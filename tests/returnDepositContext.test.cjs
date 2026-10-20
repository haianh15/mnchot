const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const view = fs.readFileSync(path.join(__dirname, '../src/components/views/DepositSettlementView.tsx'), 'utf8');
const handover = fs.readFileSync(path.join(__dirname, '../src/components/views/HandoverAssetsView.tsx'), 'utf8');
const contracts = fs.readFileSync(path.join(__dirname, '../src/components/views/ContractsView.tsx'), 'utf8');
for (const key of ['Hồ sơ bàn giao và tiền cọc của phòng', 'Tiền cọc gốc đã ghi nhận', 'Bảng tính tiền kỳ cuối', 'Kết quả đối chiếu tài sản', 'Bàn giao trả phòng', 'Lập phiếu quyết toán cọc cho phòng']) {
  assert.ok(view.includes(key), `Missing context detail: ${key}`);
}
assert.match(view, /i\.roomCode === contractFocus\.roomCode &&\s*i\.leaseId === contractFocus\.leaseId/);
assert.match(view, /p\.roomCode === contractFocus\.roomCode &&\s*p\.leaseId === contractFocus\.leaseId/);
assert.match(view, /!focusedCurrentSlip && focusedInitialPayment/);
assert.match(view, /Bàn giao nhận phòng không thay thế bàn giao trả phòng/);
assert.match(handover, /!returnInspectionTarget \|\| returnInspectionTarget\.step304Status !== 'Đã nhận lại' \|\| !returnInspectionTarget\.step305Confirmed/);
assert.match(contracts, /initialAction === 'deposit-settlement'/);
console.log('PASS 12 deposit handover contextual checks');
