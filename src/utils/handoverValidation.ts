import type { Room, Contract, ReturnInspection } from '../types';

/** A signed source is only writable against its own room/lease/contract. */
export function hasValidHandoverSource(
  rooms: Room[], contracts: Contract[], roomCode: string, leaseId?: string, contractId?: string
): boolean {
  if (!roomCode || !leaseId || !contractId) return false;
  const room = rooms.find(r => r.roomCode === roomCode);
  const contract = contracts.find(c => c.id === contractId && c.roomCode === roomCode &&
    c.leaseId === leaseId && c.isSignedPaper && !['Nháp', 'Đã hủy', 'Chờ khách ký'].includes(c.status));
  if (!room || !contract) return false;
  // No historical lease may masquerade as the current guest's paperwork.
  const activeLease = room.currentLeaseId || room.pendingLeaseId;
  return !activeLease || activeLease === leaseId;
}

/** 0 is a legitimate meter reading; absence is not. Never accept demo evidence. */
export function validateReturnConfirmation(inspection: ReturnInspection | undefined, evidence: string): string | null {
  if (!inspection) return 'Chưa có hồ sơ kiểm tra nhận lại được lưu.';
  if (inspection.step305Confirmed) return 'Hồ sơ đã xác nhận trước đó.';
  if (inspection.isDraft || inspection.step304Status !== 'Đã nhận lại' || !inspection.assetsCheckedFully)
    return 'Cần lưu kết quả Đã nhận lại chính thức và hoàn tất kiểm tra tài sản.';
  if (!inspection.items.length || inspection.items.some(item => !item.inspected || !Number.isInteger(item.quantity) ||
      item.quantity < 0 || !item.condition.trim()))
    return 'Danh sách tài sản chưa được kiểm tra đầy đủ.';
  if (inspection.finalElectricityKwh === undefined || inspection.finalWaterM3 === undefined ||
      !Number.isFinite(inspection.finalElectricityKwh) || !Number.isFinite(inspection.finalWaterM3) ||
      inspection.finalElectricityKwh < 0 || inspection.finalWaterM3 < 0)
    return 'Chưa có chỉ số điện, nước thực tế hợp lệ.';
  if (!inspection.step305Evidence?.trim() || !evidence.trim()) return 'Thiếu mô tả chứng cứ nhận lại thực tế.';
  return null;
}
