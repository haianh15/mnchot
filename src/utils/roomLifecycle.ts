import type { Contract, LeaseStartEvent, ReturnInspection, Room } from '../types';

/** Nguồn duy nhất xác định vòng đời một lần thuê; không phụ thuộc mã phòng mẫu. */
export function wasLeaseReturned(contract: Pick<Contract, 'roomCode' | 'leaseId'>, inspections: ReturnInspection[]): boolean {
  return inspections.some(i => i.roomCode === contract.roomCode && i.leaseId === contract.leaseId &&
    i.step305Confirmed && i.step304Status !== 'Chưa nhận lại');
}

export function isAwaitingFirstCheckIn(
  contract: Contract, inspections: ReturnInspection[] = [], starts: LeaseStartEvent[] = []
): boolean {
  return contract.contractType !== 'Hợp đồng nối tiếp' && contract.isSignedPaper &&
    ['Đã ký', 'Chờ hiệu lực', 'Hiệu lực'].includes(contract.status) &&
    !contract.actualCheckInDate && !wasLeaseReturned(contract, inspections) &&
    !starts.some(s => s.roomCode === contract.roomCode && s.leaseId === contract.leaseId);
}

/** Nếu hồ sơ có nhiều hợp đồng giấy khác nhau cùng chờ nhận phòng, KHÔNG tự đoán. */
export function pendingSignedContractsForRoom(
  roomCode: string, contracts: Contract[], inspections: ReturnInspection[], starts: LeaseStartEvent[] = []
): Contract[] {
  return contracts.filter(c => c.roomCode === roomCode && isAwaitingFirstCheckIn(c, inspections, starts));
}

export function getPendingSignedRoomContract(
  room: Room, contracts: Contract[], inspections: ReturnInspection[], starts: LeaseStartEvent[] = []
): Contract | undefined {
  if (room.status !== 'Trống') return undefined;
  const pending = pendingSignedContractsForRoom(room.roomCode, contracts, inspections, starts);
  // An inconsistent legacy reference must not select the wrong lease; the valid
  // paper source wins only when it is unambiguous.
  return pending.length === 1 ? pending[0] : undefined;
}

export type RoomWorkflowPhase = 'vacant' | 'awaiting-handover' | 'check-in-ready' | 'occupied' | 'returning' | 'conflict';

export function getRoomWorkflowPhase(
  room: Room, contracts: Contract[], inspections: ReturnInspection[],
  confirmedHandover: boolean, starts: LeaseStartEvent[] = []
): RoomWorkflowPhase {
  if (room.status === 'Sắp trả') return 'returning';
  if (room.status !== 'Trống') return 'occupied';
  if (pendingSignedContractsForRoom(room.roomCode, contracts, inspections, starts).length > 1) return 'conflict';
  const pending = getPendingSignedRoomContract(room, contracts, inspections, starts);
  return !pending ? 'vacant' : confirmedHandover ? 'check-in-ready' : 'awaiting-handover';
}

/** Chỉ sửa liên kết hồ sơ có thể chứng minh được; không tự tạo khách, chữ ký hay biên bản. */
export function reconcileRoomWorkflowLinks(
  room: Room, contracts: Contract[], inspections: ReturnInspection[], starts: LeaseStartEvent[] = []
): Room {
  if (room.status === 'Trống') {
    const signed = getPendingSignedRoomContract(room, contracts, inspections, starts);
    if (room.pendingContractId === signed?.id && room.pendingLeaseId === signed?.leaseId) return room;
    return { ...room, pendingContractId: signed?.id, pendingLeaseId: signed?.leaseId };
  }
  if (!room.currentLeaseId) return room;
  const candidates = contracts.filter(c => c.roomCode === room.roomCode && c.leaseId === room.currentLeaseId &&
    c.isSignedPaper && !['Đã hủy', 'Kết thúc', 'Nháp', 'Chờ khách ký'].includes(c.status) &&
    c.tenantId === room.currentTenantId);
  const current = candidates.find(c => c.id === room.currentContractId);
  // Only repair a stale pointer when there is ONE unambiguous signed source.
  if (!current && candidates.length === 1) {
    return { ...room, currentContractId: candidates[0].id, pendingContractId: undefined, pendingLeaseId: undefined };
  }
  if (current && (room.pendingContractId || room.pendingLeaseId)) {
    return { ...room, pendingContractId: undefined, pendingLeaseId: undefined };
  }
  return room;
}
