import type { Contract, HandoverReport, Room, ReturnInspection, Tenant } from '../types';

/**
 * Resolve the contract shown from a room without confusing an upcoming signed
 * contract with an actual occupied lease. Never fall back to an unrelated
 * historical contract just because it shares a room code.
 */
export function resolveRoomContract(
  room: Room,
  contracts: Contract[],
  returnInspections: ReturnInspection[]
): Contract | undefined {
  if (room.status !== 'Trống') {
    if (!room.currentLeaseId) return undefined;
    return contracts.find(c => c.id === room.currentContractId && c.roomCode === room.roomCode &&
      c.leaseId === room.currentLeaseId && !['Đã hủy', 'Kết thúc'].includes(c.status)) ||
      contracts.find(c => c.roomCode === room.roomCode && c.leaseId === room.currentLeaseId &&
        c.isSignedPaper && !['Đã hủy', 'Kết thúc'].includes(c.status));
  }
  const pending = contracts.filter(c => c.roomCode === room.roomCode && c.isSignedPaper &&
    ['Đã ký', 'Chờ hiệu lực', 'Hiệu lực'].includes(c.status) && !c.actualCheckInDate &&
    !returnInspections.some(i => i.roomCode === room.roomCode && i.leaseId === c.leaseId && i.step305Confirmed));
  return pending.find(c => c.id === room.pendingContractId) ||
    [...pending].sort((a, b) => (b.signedDate || b.createdAt || '').localeCompare(a.signedDate || a.createdAt || ''))[0];
}

export function resolveRoomTenantId(room: Room, contract: Contract | undefined, tenants: Tenant[]): string | undefined {
  if (room.status !== 'Trống' && room.currentTenantId) {
    if (contract && contract.tenantId !== room.currentTenantId) return undefined;
    return tenants.some(t => t.id === room.currentTenantId) ? room.currentTenantId : undefined;
  }
  return contract?.tenantId && tenants.some(t => t.id === contract.tenantId)
    ? contract.tenantId : undefined;
}

/** A continuing/renewed contract inherits the actual signed handover from its
 * previous contract; do not manufacture a new handover document on renewal. */
export function getLeaseContractChain(contract: Contract | undefined, contracts: Contract[]): Contract[] {
  if (!contract) return [];
  const chain: Contract[] = [];
  const visited = new Set<string>();
  let cursor: Contract | undefined = contract;
  while (cursor && !visited.has(cursor.id)) {
    chain.push(cursor);
    visited.add(cursor.id);
    cursor = cursor.previousContractId && cursor.contractType === 'Hợp đồng nối tiếp'
      ? contracts.find(c => c.id === cursor!.previousContractId &&
          c.roomCode === contract.roomCode && c.leaseId === contract.leaseId &&
          c.id !== cursor!.id && c.isSignedPaper && c.contractType)
      : undefined;
  }
  return chain;
}

/** Never equate status=Đang thuê/Sắp trả with proof of a signed paper report. */
export function getConfirmedRoomHandover(
  contract: Contract | undefined, contracts: Contract[], reports: HandoverReport[]
): HandoverReport | undefined {
  return getLeaseContractChain(contract, contracts).map(c => reports.find(r =>
    r.roomCode === c.roomCode && r.leaseId === c.leaseId && r.contractId === c.id &&
    r.status === 'Đã xác nhận' && r.tenantSignedPaper === 'Đã ký giấy' &&
    r.ownerSignedPaper === 'Đã ký giấy')).find(Boolean);
}

/**
 * Nút thao tác tiếp theo trên phòng Trống bám vào hợp đồng ĐÃ KÝ (không dùng
 * hợp đồng nháp). Ký hợp đồng chưa có nghĩa là khách đã nhận phòng.
 */
export function getVacantRoomNextStep(
  room: Room, contracts: Contract[], returnInspections: ReturnInspection[], reports: HandoverReport[]
): { label: string; tab: 'contracts' | 'handover' } {
  const signedContract = room.status === 'Trống'
    ? resolveRoomContract(room, contracts, returnInspections) : undefined;
  if (!signedContract?.isSignedPaper) {
    return { label: 'Lập hợp đồng', tab: 'contracts' };
  }
  if (getConfirmedRoomHandover(signedContract, contracts, reports)) {
    return { label: 'Xác nhận nhận phòng', tab: 'handover' };
  }
  return { label: 'Lập biên bản nhận phòng', tab: 'handover' };
}
