const assert = require('node:assert/strict');
const fs = require('node:fs');
const ctx = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
const hv = fs.readFileSync('src/components/views/HandoverAssetsView.tsx', 'utf8');
const rv = fs.readFileSync('src/components/views/RoomsView.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx','utf8');
const contracts = fs.readFileSync('src/components/views/ContractsView.tsx','utf8');
let n=0;
function test(name, fn) { fn(); n++; console.log('PASS',name); }
const checkin = ctx.slice(ctx.indexOf('const confirmCheckInPH05 ='), ctx.indexOf('const saveMissingConditionPH06 ='));
const sign = ctx.slice(ctx.indexOf('const confirmHandoverSignaturesBG03 ='),ctx.indexOf('const recordIncidentBG04 ='));
test('Cả màn hình phòng và bàn giao đều gọi cùng một hàm xác nhận nhận phòng', () => {
  assert(rv.includes('confirmCheckInPH05('));
  assert(hv.includes('confirmCheckInPH05('));
  assert(sign.includes('confirmCheckInPH05('));
});
test('Không kích hoạt phòng khi chỉ lưu nháp hay Đã lập', () => {
  assert(!ctx.slice(ctx.indexOf('const saveHandoverReportBG03 ='),ctx.indexOf('const confirmHandoverSignaturesBG03 =')).includes('confirmCheckInPH05('));
  assert(sign.includes('tenantSigned && ownerSigned && actualCheckInDate'));
});
test('Xác nhận đủ chữ ký và ngày nhận gọi cùng nguồn kiểm tra', () => {
  assert(sign.includes('signedReportOverride') === false);
  assert(sign.includes('const confirmedReport: HandoverReport'));
  assert(sign.includes('confirmCheckInPH05(report.roomCode, report.leaseId, actualCheckInDate'));
  assert(sign.includes('if (!checkInResult.success) return checkInResult'));
});
test('Kiểm tra phòng đang Trống, mã phòng và hợp đồng đúng lần thuê', () => {
  assert(checkin.includes("room.status !== 'Trống'"));
  assert(checkin.includes('getPendingSignedRoomContract(room, contracts, returnInspections, leaseStartEvents)'));
  assert(checkin.includes('h.contractId === contract?.id'));
});
test('Kiểm tra hồ sơ khách, chứng từ cọc + thuê đầu, chữ ký trên biên bản', () => {
  assert(checkin.includes('validateContractTenantLink(contract, tenants)'));
  assert(checkin.includes('getInitialPaymentStatus(contract, contracts, initialPaymentRecords)'));
  assert(checkin.includes("h.status === 'Đã xác nhận'"));
  assert(checkin.includes("h.tenantSignedPaper === 'Đã ký giấy'"));
  assert(checkin.includes("h.ownerSignedPaper === 'Đã ký giấy'"));
});
test('Không nhận phòng trùng và không dùng ngày trong tương lai', () => {
  assert(checkin.includes('leaseStartEvents.some('));
  assert(checkin.includes('actualCheckInDate > new Date().toISOString().slice(0, 10)'));
});
test('Một xác nhận cập nhật đồng thời phòng hợp đồng khách số người và sự kiện', () => {
  assert(checkin.includes("status: 'Đang thuê'"));
  assert(checkin.includes('currentTenantId: contract.tenantId'));
  assert(checkin.includes('currentContractId: contract.id'));
  assert(checkin.includes('currentLeaseId: contract.leaseId'));
  assert(checkin.includes('totalOccupants: 1 + coTenants.filter('));
  assert(checkin.includes('setContracts(nextContracts)'));
  assert(checkin.includes('persistCritical({rooms:nextRooms,contracts:nextContracts'));
  assert(checkin.includes('setLeaseStartEvents(nextStarts'));
});
test('Biên bản đã ký từ trước có nút xác nhận nhận phòng chung mọi phòng', () => {
  assert(hv.includes("existingReport?.status === 'Đã xác nhận' && selectedRoom?.status === 'Trống'"));
  assert(hv.includes('Xác nhận nhận phòng</button>'));
  assert(!hv.includes('P.999'));
});
test('Biên bản đang Đã lập chỉ hướng dẫn tiếp tục xác nhận ký chứ không hiện Đang thuê', () => {
  assert(hv.includes("existingReport?.status === 'Đã lập' && selectedRoom?.status === 'Trống'"));
  assert(hv.includes('Biên bản đã lập nhưng chưa xác nhận đủ chữ ký'));
});
test('Ẩn những banner hướng dẫn và nhãn DEMO trong quản lý phòng', () => {
  for (const s of ['Hồ sơ DEMO','Bổ sung hồ sơ DEMO','phòng đang thuê/sắp trả cần đối chiếu','DEMO - giả lập']) assert(!rv.includes(s),s);
});
test('Bộ lọc vẫn có nhãn truy cập nhưng không còn chữ nhãn bên cạnh', () => {
  assert(contracts.includes('aria-label="Lọc hợp đồng theo tình trạng quyết toán cọc"'));
  assert(!contracts.includes('>Tình trạng quyết toán cọc</label>'));
});
test('Không còn banner chạy thử ở đầu danh sách',()=>assert(!app.includes('Bản chạy thử: dữ liệu hiện lưu trên trình duyệt')));
console.log(`${n}/${n} test cases passed`);
