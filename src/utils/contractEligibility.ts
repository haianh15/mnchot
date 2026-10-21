import type { Contract, Room, ReturnInspection, LeaseStartEvent } from '../types';
import { isAwaitingFirstCheckIn } from './roomLifecycle';

/** Hợp đồng nối tiếp chỉ gia hạn CÙNG khách, CÙNG lần thuê khi phòng sắp trả hoặc kỳ cũ hết hạn. */
export function canCreateRenewalContract(
  contract: Contract | undefined, rooms: Room[], contracts: Contract[], today: string
): boolean {
  if (!contract || !contract.isSignedPaper || !['Hiệu lực', 'Đã ký', 'Chờ hiệu lực', 'Kết thúc'].includes(contract.status)) return false;
  const room = rooms.find(r => r.roomCode === contract.roomCode);
  if (!room || room.status === 'Trống' || room.currentLeaseId !== contract.leaseId ||
      room.currentContractId !== contract.id || room.currentTenantId !== contract.tenantId) return false;
  if (!(room.status === 'Sắp trả' || Boolean(contract.endDate && contract.endDate <= today))) return false;
  return !contracts.some(c => c.previousContractId === contract.id && c.status !== 'Đã hủy');
}

/** HĐ đã nhận phòng của một lượt thuê đã trả xong là lịch sử, không khóa lượt thuê mới. */
export function blocksNewLeaseOnVacantRoom(
  contract: Contract, inspections: ReturnInspection[] = [], starts: LeaseStartEvent[] = []
): boolean {
  return isAwaitingFirstCheckIn(contract, inspections, starts);
}
