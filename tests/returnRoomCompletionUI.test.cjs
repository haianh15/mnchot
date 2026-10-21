const fs = require('fs');
const assert = require('node:assert/strict');
const root = require('path').resolve(__dirname, '..');
const handover = fs.readFileSync(root + '/src/components/views/HandoverAssetsView.tsx', 'utf8');
const ctx = fs.readFileSync(root + '/src/context/AppContext.tsx', 'utf8');
const app = fs.readFileSync(root + '/src/App.tsx', 'utf8');
for (const phrase of ['showCorrectionModal', 'Đính chính kết quả nhận lại phòng', 'Xác nhận đính chính']) {
  assert(!handover.includes(phrase), 'Remove correction control: ' + phrase);
}
assert(handover.includes('Xác nhận trả phòng – Chuyển về Trống'));
assert(handover.includes('confirmReturnStep305AndVacantPH08('));
assert(handover.includes('returnInspectionTarget?.step305Confirmed'));
assert(handover.includes('!existingReturnReport'));
assert(app.includes('onNavigateToRooms={(roomCode) => navigate(\'rooms\', {roomCode})}'));
const start = ctx.indexOf('const confirmReturnStep305AndVacantPH08 =');
const end = ctx.indexOf('// UC-PH-09:', start);
assert(start > 0 && end > start);
const implementation = ctx.slice(start,end);
assert(implementation.includes("status: 'Trống'"));
assert(implementation.includes('inspection.step305Confirmed'));
assert(implementation.includes('handoverReturnReports.some'));
assert(!implementation.includes('settlementSlips'), 'Vacancy should not wait for deposit settlement');
console.log('Return UI and vacancy checks: 10 PASS');
