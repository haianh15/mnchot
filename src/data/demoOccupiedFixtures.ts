import type { Asset, Contract, HandoverCondition, HandoverReport, InitialPaymentRecord, InventoryRecord, LeaseStartEvent, Room, Tenant } from '../types';

/**
 * DỮ LIỆU DEMO, không phải bằng chứng chuyển khoản, hợp đồng hay giấy tờ đã ký thật.
 * Chỉ dùng cho những phòng ví dụ định danh sẵn; không sửa hồ sơ ngoài danh sách này.
 * Phải gọi bằng thao tác chủ động nếu trình duyệt đã lưu dữ liệu từ phiên bản cũ.
 */
export const DEMO_OCCUPIED_ROOMS = [
  'P.101', 'P.102', 'P.201', 'P.203', 'P.301', 'P.302', 'P.401', 'P.402', 'P.403'
] as const;
const DEMO_RENTS: Record<string, number> = {
  'P.301': 3800000, 'P.302': 3800000, 'P.401': 4000000,
  'P.402': 3900000, 'P.403': 3900000
};
// Dấu vân tay một số hợp đồng ví dụ có sẵn từ bản gốc. Không tự tạo chứng từ
// cho hợp đồng người dùng đã chỉnh sửa, dù cùng mã phòng/mã hợp đồng.
const ORIGINAL_SEED_CONTRACTS: Record<string, [number, string, string]> = {
  'P.101': [3500000, '2026-08-30', 'Hợp đồng thuê căn hộ mini 6 tháng, thanh toán hàng tháng qua ngân hàng.'],
  'P.102': [3800000, '2026-04-28', 'Hợp đồng thuê căn hộ mini 6 tháng.'],
  'P.201': [4000000, '2026-07-29', 'Hợp đồng thuê căn hộ mini 6 tháng.'],
  'P.203': [3800000, '2026-04-12', 'Hợp đồng thuê căn hộ mini 6 tháng.']
};
const DEMO_METER_BASE: Record<string, [number, number]> = {
  'P.102': [1430, 53], 'P.201': [2140, 73], 'P.203': [2380, 68],
  'P.301': [3130, 101], 'P.302': [3240, 106], 'P.401': [4180, 124],
  'P.402': [4290, 128], 'P.403': [4390, 135]
};

export type DemoFixtureState = {
  rooms: Room[]; tenants: Tenant[]; contracts: Contract[];
  initialPaymentRecords: InitialPaymentRecord[];
  handoverReports: HandoverReport[];
  inventoryRecords: InventoryRecord[];
  handoverConditions: HandoverCondition[];
  leaseStartEvents: LeaseStartEvent[];
};
export type DemoFixtureResult = Omit<DemoFixtureState, 'rooms' | 'tenants'> & {
  added: number;
  corrected: number;
  skipped: string[];
};

export function completeDemoOccupiedFixtures(state: DemoFixtureState, assets: Asset[]): DemoFixtureResult {
  const contracts = [...state.contracts];
  const initialPaymentRecords = [...state.initialPaymentRecords];
  const handoverReports = [...state.handoverReports];
  const inventoryRecords = [...state.inventoryRecords];
  const handoverConditions = [...state.handoverConditions];
  const leaseStartEvents = [...state.leaseStartEvents];
  const skipped: string[] = [];
  let added = 0;
  let corrected = 0;

  for (const roomCode of DEMO_OCCUPIED_ROOMS) {
    const room = state.rooms.find(r => r.roomCode === roomCode);
    if (!room || room.status === 'Trống' || !room.currentContractId || !room.currentLeaseId || !room.currentTenantId || !room.currentTenantName) {
      skipped.push(`${roomCode}: không phải phòng mẫu đang thuê có đủ mã nguồn`);
      continue;
    }
    const tenant = state.tenants.find(t => t.id === room.currentTenantId && t.fullName === room.currentTenantName);
    if (!tenant || !room.contractStartDate || !room.contractEndDate) {
      skipped.push(`${roomCode}: thiếu hồ sơ khách hoặc thời hạn thuê để tạo dữ liệu demo`);
      continue;
    }
    const code = roomCode.replace('P.', '');
    const original = contracts.find(c => c.id === room.currentContractId);
    if (original && (original.roomCode !== roomCode || original.leaseId !== room.currentLeaseId ||
      original.tenantId !== tenant.id || original.tenantName !== tenant.fullName ||
      !original.isSignedPaper || ['Nháp', 'Chờ khách ký', 'Đã hủy', 'Kết thúc'].includes(original.status))) {
      skipped.push(`${roomCode}: hợp đồng hiện tại khác bản demo; không ghi đè`);
      continue;
    }
    if (original) {
      const source = ORIGINAL_SEED_CONTRACTS[roomCode];
      const originalDemo = original.terms?.startsWith('HỢP ĐỒNG MẪU —') || Boolean(source &&
        original.monthlyRent === source[0] && original.signedDate === source[1] &&
        original.terms === source[2] && original.version === 1);
      if (!originalDemo) {
        skipped.push(`${roomCode}: hợp đồng có dấu hiệu đã được sửa ngoài bộ demo; không tạo chứng từ giả`);
        continue;
      }
    }
    const rent = DEMO_RENTS[roomCode];
    const checkInDate = room.contractStartDate;
    const signedDate = original?.signedDate || new Date(Date.parse(checkInDate + 'T00:00:00Z') - 86400000 * 3).toISOString().slice(0, 10);
    const contract: Contract = original || {
      id: room.currentContractId,
      contractType: 'Hợp đồng lần đầu',
      leaseId: room.currentLeaseId, roomCode,
      tenantId: tenant.id, tenantName: tenant.fullName,
      tenantIdNumber: tenant.idNumber,
      batchCode: `DEMO-${room.firstMonthPeriod.replace('Kỳ ', '').replace('/', '-')}`,
      startDate: room.contractStartDate, endDate: room.contractEndDate,
      signedDate, actualCheckInDate: checkInDate,
      monthlyRent: rent, depositAmount: rent, firstMonthRentAmount: rent,
      firstMonthRentPaid: true, paymentMethod: 'Chuyển khoản',
      terms: 'HỢP ĐỒNG MẪU — Chỉ để thử luồng quản lý phòng; không phải hợp đồng đã ký thật.',
      status: 'Hiệu lực', isSignedPaper: true,
      initialDepositCode: `DEMO-COC-${code}-L1`, version: 1
    };
    if (!original) { contracts.push(contract); added++; }
    if (!contract.actualCheckInDate || !contract.signedDate || contract.signedDate > contract.actualCheckInDate) {
      skipped.push(`${roomCode}: thiếu ngày ký/nhận phòng hoặc ngày không nhất quán; cần đối chiếu`);
      continue;
    }
    // Demo proof only. A manual entry with a different ID/value is never overwritten.
    const existingPaymentIndex = initialPaymentRecords.findIndex(p =>
      p.contractId === contract.id && p.leaseId === contract.leaseId && p.roomCode === roomCode);
    const existingPayment = existingPaymentIndex >= 0 ? initialPaymentRecords[existingPaymentIndex] : undefined;
    const legacy102 = roomCode === 'P.102' && existingPayment?.id === 'pay07_102' &&
      existingPayment.depositAmount === 3600000 && existingPayment.firstMonthRentAmount === 3600000 &&
      existingPayment.actualAmount === 7200000 && !existingPayment.correctionHistory?.length;
    if (!existingPayment || legacy102) {
      const p: InitialPaymentRecord = {
        id: legacy102 ? 'pay07_102' : `DEMO-PAY07-${code}-L1`,
        contractId: contract.id, roomCode, leaseId: contract.leaseId,
        depositAmount: contract.depositAmount,
        firstMonthRentAmount: contract.firstMonthRentAmount,
        actualAmount: contract.depositAmount + contract.firstMonthRentAmount,
        receivedDate: contract.signedDate,
        transactionCode: `DEMO-CHUYEN-KHOAN-${code}-L1`,
        bankAccountReceived: 'DEMO — tài khoản giả lập, không có giao dịch thực',
        depositCode: contract.initialDepositCode || `DEMO-COC-${code}-L1`,
        rentPeriodNote: room.firstMonthPeriod || `Kỳ ${checkInDate.slice(5,7)}/${checkInDate.slice(0,4)}`,
        proofFile: 'DEMO - không có chứng từ chuyển khoản thật',
        confirmedBy: 'DEMO — hồ sơ mô phỏng',
        confirmedAt: contract.signedDate + 'T09:00:00Z'
      };
      if (legacy102) { initialPaymentRecords[existingPaymentIndex] = p; corrected++; }
      else { initialPaymentRecords.push(p); added++; }
    } else if (existingPayment.depositAmount !== contract.depositAmount ||
      existingPayment.firstMonthRentAmount !== contract.firstMonthRentAmount) {
      skipped.push(`${roomCode}: chứng từ hiện tại không khớp hợp đồng; không tự sửa dữ liệu đã nhập`);
    }
    const reports = handoverReports.filter(r => r.roomCode === roomCode && r.leaseId === contract.leaseId);
    if (!reports.length) {
      const [electricity, water] = DEMO_METER_BASE[roomCode] || [1000, 40];
      const report: HandoverReport = {
        id: `DEMO-BB-${code}-L1`, reportNumber: `DEMO-BB-${code}-L1`,
        roomCode, contractId: contract.id, leaseId: contract.leaseId,
        date: checkInDate, giverName: 'Chủ nhà (DEMO)', receiverName: tenant.fullName,
        status: 'Đã xác nhận', tenantSignedPaper: 'Đã ký giấy', ownerSignedPaper: 'Đã ký giấy',
        paperLocation: 'DEMO — giả lập xác nhận hai bên, không tồn tại biên bản giấy',
        version: 1, createdAt: checkInDate + 'T08:00:00Z', confirmedAt: checkInDate + 'T09:00:00Z',
        initialElectricityKwh: electricity, initialWaterM3: water
      };
      handoverReports.push(report); added++;
    } else if (!reports.some(r => r.contractId === contract.id && r.status === 'Đã xác nhận' &&
      r.tenantSignedPaper === 'Đã ký giấy' && r.ownerSignedPaper === 'Đã ký giấy')) {
      skipped.push(`${roomCode}: có biên bản nhận phòng chưa xác nhận; không tự ký thay`);
    }
    if (!inventoryRecords.some(r => r.roomCode === roomCode && r.linkedLeaseId === contract.leaseId)) {
      inventoryRecords.push({
        id: `DEMO-INV-${code}-L1`, roomCode, expectedBatchCode: contract.batchCode,
        version: 1, inventoryStatus: 'Đã hoàn tất', linkStatus: 'Đã liên kết',
        linkedContractId: contract.id, linkedLeaseId: contract.leaseId,
        items: assets.map((ast, idx) => ({id: `demo_${code}_${idx}`, assetId: ast.id,
          name: ast.name, unit: ast.unit, standardQuantity: ast.standardQuantity,
          actualQuantity: ast.standardQuantity, quantityDiff: 'Đủ', physicalCondition: 'Bình thường'})),
        completedAt: checkInDate + 'T08:30:00Z', completedBy: 'DEMO — kiểm kê mô phỏng'
      }); added++;
    }
    if (!handoverConditions.some(c => c.roomCode === roomCode && c.linkedLeaseId === contract.leaseId)) {
      const [electricity, water] = DEMO_METER_BASE[roomCode] || [1000, 40];
      handoverConditions.push({
        id: `DEMO-HC-${code}-L1`, roomCode, expectedBatchCode: contract.batchCode,
        linkedContractId: contract.id, linkedLeaseId: contract.leaseId,
        status: 'Đã hoàn tất', scope: 'Hiện trạng chung của phòng',
        description: 'DEMO — hiện trạng chỉ là dữ liệu minh họa, chưa được kiểm tra thực tế.',
        photos: [], meterPhotos: [], evidenceStatus: 'Chưa đính kèm',
        initialElectricityKwh: electricity, initialWaterM3: water,
        meterElectricCode: `DEMO-CT-D-${code}`, meterWaterCode: `DEMO-CT-N-${code}`,
        tenantChecked: true, tenantCheckNote: 'DEMO — xác nhận giả lập',
        handoverDoneAt: checkInDate + 'T08:30:00Z', loggedBy: 'DEMO', version: 1
      }); added++;
    }
    if (!leaseStartEvents.some(e => e.roomCode === roomCode && e.leaseId === contract.leaseId)) {
      const report = handoverReports.find(r => r.roomCode === roomCode && r.leaseId === contract.leaseId &&
        r.status === 'Đã xác nhận' && r.contractId === contract.id);
      if (report) {
        leaseStartEvents.push({eventId: `DEMO-EVT-${code}-L1`, roomCode,
          contractId: contract.id, leaseId: contract.leaseId,
          checkInDate, handoverReportId: report.reportNumber,
          handoverVersion: 'v1.0', emittedAt: checkInDate + 'T09:15:00Z',
          coTenantsChecked: true, syncStatus: 'Đã gửi HSKT-02'}); added++;
      }
    }
  }
  return {contracts, initialPaymentRecords, handoverReports, inventoryRecords,
    handoverConditions, leaseStartEvents, added, corrected, skipped};
}
