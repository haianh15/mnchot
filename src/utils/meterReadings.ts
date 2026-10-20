import type { Contract, HandoverCondition, HandoverReport, MeterReading, Room } from '../types';
import { getConfirmedRoomHandover } from './roomLinks';

export type MeterBaselineResult =
  | { ok: true; electric: number; water: number; electricMeterCode: string; waterMeterCode: string; source: string }
  | { ok: false; message: string };

/** Only an earlier, confirmed reading of this lease or a signed handover may establish opening meters. */
export function resolveMeterBaseline(args: {
  roomCode: string;
  leaseId: string;
  readingDate: string;
  meterReadings: MeterReading[];
  contracts: Contract[];
  handoverReports: HandoverReport[];
  handoverConditions: HandoverCondition[];
  excludeReadingId?: string;
}): MeterBaselineResult {
  const { roomCode, leaseId, readingDate, meterReadings, contracts, handoverReports, handoverConditions, excludeReadingId } = args;
  if (!roomCode || !leaseId || !/^\d{4}-\d{2}-\d{2}$/.test(readingDate))
    return { ok: false, message: 'Cần chọn đúng phòng, lần thuê và ngày ghi chỉ số.' };

  const prior = meterReadings
    .filter(r => r.id !== excludeReadingId && r.roomCode === roomCode && r.leaseId === leaseId &&
      r.readingDate < readingDate && r.status === 'Đã xác nhận' && !r.pendingVerificationFlag && !r.needsRecalculateFlag)
    .sort((a, b) => b.readingDate.localeCompare(a.readingDate))[0];
  if (prior) {
    if (![prior.finalElectricKwh, prior.finalWaterM3].every(n => Number.isFinite(n) && n >= 0))
      return { ok: false, message: 'Chỉ số của kỳ trước không hợp lệ, cần đối chiếu hồ sơ nguồn.' };
    return {
      ok: true, electric: prior.finalElectricKwh, water: prior.finalWaterM3,
      electricMeterCode: prior.electricMeterCode, waterMeterCode: prior.waterMeterCode,
      source: `Chỉ số đã xác nhận ngày ${prior.readingDate} của lần thuê ${leaseId}`
    };
  }

  const leaseContracts = contracts.filter(c => c.roomCode === roomCode && c.leaseId === leaseId && c.isSignedPaper &&
    !['Đã hủy'].includes(c.status));
  const handover = leaseContracts.map(contract => getConfirmedRoomHandover(contract, contracts, handoverReports)).find(Boolean);
  if (!handover)
    return { ok: false, message: 'Đây là kỳ ghi đầu của lần thuê nhưng chưa có biên bản nhận phòng đã xác nhận đủ chữ ký. Hãy kiểm tra hồ sơ Bàn giao; không tự lấy chỉ số 0 hoặc chỉ số của khách cũ.' };
  if (handover.date > readingDate)
    return { ok: false, message: 'Ngày ghi chỉ số không thể trước ngày nhận phòng trên biên bản đã xác nhận.' };
  if (![handover.initialElectricityKwh, handover.initialWaterM3].every(n => Number.isFinite(n) && n >= 0))
    return { ok: false, message: 'Biên bản nhận phòng chưa có đủ chỉ số điện, nước hợp lệ.' };

  const condition = handoverConditions.find(c => c.roomCode === roomCode && c.linkedLeaseId === leaseId &&
    c.linkedContractId === handover.contractId && c.status === 'Đã hoàn tất' &&
    c.scope === 'Hiện trạng chung của phòng');
  if (condition && (condition.initialElectricityKwh !== handover.initialElectricityKwh ||
    condition.initialWaterM3 !== handover.initialWaterM3))
    return { ok: false, message: 'Chỉ số trên biên bản nhận phòng không khớp hồ sơ hiện trạng. Hãy đối chiếu và xử lý sai lệch trước khi ghi chỉ số.' };

  return {
    ok: true,
    electric: handover.initialElectricityKwh,
    water: handover.initialWaterM3,
    electricMeterCode: condition?.meterElectricCode?.trim() || '',
    waterMeterCode: condition?.meterWaterCode?.trim() || '',
    source: `Biên bản nhận phòng ${handover.reportNumber} đã xác nhận đủ chữ ký`
  };
}

/** Synchronous business validation, independent of which screen initiated the write. */
export function validateMeterReadingSave(args: {
  reading: MeterReading;
  rooms: Room[];
  meterReadings: MeterReading[];
  contracts: Contract[];
  handoverReports: HandoverReport[];
  handoverConditions: HandoverCondition[];
}): { success: boolean; message: string } {
  const { reading, rooms, meterReadings, contracts, handoverReports, handoverConditions } = args;
  const room = rooms.find(r => r.roomCode === reading.roomCode);
  if (!room || room.currentLeaseId !== reading.leaseId ||
    !(['Đang thuê', 'Sắp trả'].includes(room.status) || (room.status === 'Trống' && !!room.currentLeaseId)))
    return { success: false, message: 'Phòng không có lần thuê phù hợp để ghi chỉ số; không thể ghi cho khách cũ hoặc phòng chưa có hồ sơ.' };
  if (!reading.periodCode?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(reading.readingDate))
    return { success: false, message: 'Chưa có kỳ hoặc ngày ghi chỉ số hợp lệ.' };
  if (!reading.electricMeterCode?.trim() || !reading.waterMeterCode?.trim())
    return { success: false, message: 'Bắt buộc có mã công tơ điện và nước theo hồ sơ thực tế.' };
  if (![reading.initialElectricKwh, reading.finalElectricKwh, reading.initialWaterM3, reading.finalWaterM3]
    .every(n => Number.isFinite(n) && n >= 0))
    return { success: false, message: 'Chỉ số điện, nước phải là số hợp lệ và không âm.' };
  if (reading.status !== 'Nháp')
    return { success: false, message: 'Chức năng Ghi chỉ số chỉ lưu nháp; sửa bản đã xác nhận phải theo quy trình sửa riêng.' };

  const sameId = meterReadings.find(m => m.id === reading.id);
  if (sameId && (sameId.roomCode !== reading.roomCode || sameId.leaseId !== reading.leaseId ||
    sameId.periodCode.trim() !== reading.periodCode.trim() || !['Nháp', 'Nháp – điều chỉnh'].includes(sameId.status)))
    return { success: false, message: 'Không được ghi đè bản ghi đã xác nhận hoặc dùng ID của phòng/lần thuê/kỳ khác.' };
  const duplicate = meterReadings.find(m => m.id !== reading.id && m.roomCode === reading.roomCode &&
    m.leaseId === reading.leaseId && (m.periodCode.trim() === reading.periodCode.trim() || m.readingDate === reading.readingDate));
  if (duplicate)
    return { success: false, message: 'Đã tồn tại chỉ số cho phòng/lần thuê trong kỳ hoặc ngày này. Mở bản ghi đang có để sửa, không lập trùng.' };

  const baseline = resolveMeterBaseline({
    roomCode: reading.roomCode, leaseId: reading.leaseId, readingDate: reading.readingDate,
    meterReadings, contracts, handoverReports, handoverConditions, excludeReadingId: reading.id
  });
  if (baseline.ok === false) return { success: false, message: baseline.message };
  if (reading.initialElectricKwh !== baseline.electric || reading.initialWaterM3 !== baseline.water)
    return { success: false, message: `Chỉ số đầu kỳ phải lấy từ ${baseline.source}, không được tự thay hoặc mặc định là 0.` };
  if (baseline.electricMeterCode && reading.electricMeterCode !== baseline.electricMeterCode &&
    reading.abnormalReason !== 'Thay công tơ')
    return { success: false, message: 'Mã công tơ điện khác hồ sơ nguồn. Hãy kiểm tra; nếu thay công tơ, ghi rõ lý do và chứng cứ.' };
  if (baseline.waterMeterCode && reading.waterMeterCode !== baseline.waterMeterCode &&
    reading.abnormalReason !== 'Thay công tơ')
    return { success: false, message: 'Mã công tơ nước khác hồ sơ nguồn. Hãy kiểm tra; nếu thay công tơ, ghi rõ lý do và chứng cứ.' };
  if (reading.finalElectricKwh < baseline.electric || reading.finalWaterM3 < baseline.water) {
    if (!reading.pendingVerificationFlag && !reading.abnormalEvidence?.trim())
      return { success: false, message: 'Chỉ số cuối thấp hơn đầu kỳ phải được đánh dấu Cần xác minh hoặc có chứng cứ xác minh.' };
  }
  return { success: true, message: 'Đã lưu chỉ số cho đúng phòng, lần thuê và kỳ; chỉ số đầu đã được đối chiếu với hồ sơ nguồn.' };
}
