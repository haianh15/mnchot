import type { Room, Contract, ReturnInspection, LeaseStartEvent } from '../types';
import { getPendingSignedRoomContract, pendingSignedContractsForRoom } from './roomLifecycle';

/** A signed source is only writable against its own room/lease/contract. */
export function hasValidHandoverSource(
  rooms: Room[], contracts: Contract[], roomCode: string, leaseId?: string, contractId?: string, inspections: ReturnInspection[] = [], starts: LeaseStartEvent[] = []
): boolean {
  if (!roomCode || !leaseId || !contractId) return false;
  const room = rooms.find(r => r.roomCode === roomCode);
  const contract = contracts.find(c => c.id === contractId && c.roomCode === roomCode &&
    c.leaseId === leaseId && c.isSignedPaper && !['Nháp', 'Đã hủy', 'Chờ khách ký'].includes(c.status));
  if (!room || !contract) return false;
  // No historical lease may masquerade as the current guest's paperwork.
  if (room.status === 'Trống') {
    // Chỉ hợp đồng giấy đang chờ nhận phòng của phòng này được ghi biên bản.
    // Trả xong một lần thuê thì biên bản cũ KHÔNG được dùng để nhận phòng mới.
    if (pendingSignedContractsForRoom(roomCode, contracts, inspections, starts).length !== 1) return false;
    return getPendingSignedRoomContract(room, contracts, inspections, starts)?.id === contractId;
  }
  return room.currentLeaseId === leaseId;
}


/**
 * Giải thích chính xác vì sao chưa thể lưu kết quả nhận lại "Đã nhận lại".
 * Kiểm tra cùng bộ điều kiện với màn hình, không suy diễn từ mỗi cột "Đã kiểm tra".
 * Giá trị công tơ bằng 0 là hợp lệ nếu được nhập thực tế.
 */
export function getReturnInspectionReadinessIssues(input: {
  items: ReturnInspection['items'];
  finalElectricityKwh: number | '';
  finalWaterM3: number | '';
  evidence: string;
  validContractLease: boolean;
}): string[] {
  const { items, finalElectricityKwh, finalWaterM3, evidence, validContractLease } = input;
  const issues: string[] = [];
  if (!items.length) {
    issues.push('Chưa có danh sách tài sản để kiểm tra.');
  } else {
    const unchecked = items.filter(item => !item.inspected);
    if (unchecked.length) {
      const names = unchecked.slice(0, 3).map(item => item.name).join(', ');
      issues.push(`Còn ${unchecked.length} tài sản chưa đánh dấu Đã kiểm tra${names ? `: ${names}` : ''}.`);
    }
    if (items.some(item => !Number.isInteger(item.quantity) || item.quantity < 0))
      issues.push('Số lượng thực tế của một số tài sản chưa hợp lệ (phải là số nguyên không âm).');
    const noCondition = items.filter(item => item.inspected && !item.condition?.trim());
    if (noCondition.length) {
      const names = noCondition.slice(0, 3).map(item => item.name).join(', ');
      issues.push(`Còn ${noCondition.length} tài sản chưa chọn tình trạng vật lý${names ? `: ${names}` : ''}.`);
    }
  }
  if (finalElectricityKwh === '' || !Number.isFinite(finalElectricityKwh) || finalElectricityKwh < 0)
    issues.push('Chưa nhập chỉ số điện cuối kỳ hợp lệ.');
  if (finalWaterM3 === '' || !Number.isFinite(finalWaterM3) || finalWaterM3 < 0)
    issues.push('Chưa nhập chỉ số nước cuối kỳ hợp lệ.');
  if (!evidence.trim())
    issues.push('Chưa nhập mô tả bằng chứng nhận lại phòng thực tế (chìa khóa, hiện trạng...).');
  if (!validContractLease)
    issues.push('Hợp đồng đã ký chưa liên kết hợp lệ với phòng và lượt thuê hiện tại.');
  return issues;
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
