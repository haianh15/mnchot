const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let ts;
try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const {loadTs} = require('./loadTs.cjs');
const moduleExports = loadTs('src/utils/roomLinks.ts');
const {getVacantRoomNextStep} = moduleExports;
const vacant = {roomCode:'P.999',status:'Trống',pendingContractId:'HD-P999',pendingLeaseId:'LEASE-P999'};
const signed = {id:'HD-P999',roomCode:'P.999',leaseId:'LEASE-P999',status:'Chờ hiệu lực',isSignedPaper:true,tenantId:'T999'};
const draft = {...signed,id:'HD-DRAFT',status:'Nháp',isSignedPaper:false};
const handover = {roomCode:'P.999',contractId:'HD-P999',leaseId:'LEASE-P999',status:'Đã xác nhận',tenantSignedPaper:'Đã ký giấy',ownerSignedPaper:'Đã ký giấy'};
let n = 0;
function test(name, callback) {callback(); n++; console.log('PASS',name)}
test('Phòng chưa có hợp đồng đã ký vẫn chỉ hiện Lập hợp đồng', () => {
  assert.equal(getVacantRoomNextStep(vacant,[draft],[],[]).label,'Lập hợp đồng');
  assert.equal(getVacantRoomNextStep(vacant,[draft],[],[]).tab,'contracts');
});
test('Phòng chờ nhận sau khi đã ký hiện Lập biên bản nhận phòng và mở Bàn giao', () => {
  const step = getVacantRoomNextStep(vacant,[signed,draft],[],[]);
  assert.equal(step.label,'Lập biên bản nhận phòng');
  assert.equal(step.tab,'handover');
});
test('Biên bản Nháp vẫn được lập tiếp nhưng Đã lập thì chỉ xem và bổ sung', () => {
  const draft = getVacantRoomNextStep(vacant,[signed],[],[{...handover,status:'Nháp'}]);
  const created = getVacantRoomNextStep(vacant,[signed],[],[{...handover,status:'Đã lập'}]);
  assert.equal(draft.label,'Lập biên bản nhận phòng');
  assert.equal(created.label,'Xem biên bản nhận phòng');
  assert.equal(created.tab,'handover');
});
test('Phòng đã có biên bản đủ chữ ký, chưa chuyển Đang thuê thì hiện Xác nhận nhận phòng', () => {
  const step = getVacantRoomNextStep(vacant,[signed],[],[handover]);
  assert.equal(step.label,'Xác nhận nhận phòng');
  assert.equal(step.tab,'handover');
});
test('Không lấy hợp đồng đã ký thuộc phòng khác', () => {
  const step = getVacantRoomNextStep(vacant,[{...signed,roomCode:'P.998'}],[],[]);
  assert.equal(step.label,'Lập hợp đồng');
});
test('Không lấy hợp đồng của lần thuê đã trả phòng', () => {
  const step = getVacantRoomNextStep(vacant,[signed],[{roomCode:'P.999',leaseId:'LEASE-P999',step305Confirmed:true}],[]);
  assert.equal(step.label,'Lập hợp đồng');
});
test('Danh sách và màn kiểm tra phòng đều dùng chung hành động để dẫn đúng nghiệp vụ', () => {
  const rooms = fs.readFileSync('src/components/views/RoomsView.tsx','utf8');
  assert(rooms.includes("onClick={() => openLinkedRecord(getVacantNextStep(room).tab, room)}"));
  assert(rooms.includes("{getVacantNextStep(room).label}"));
  assert(rooms.includes("openLinkedRecord(getVacantNextStep(targetRoom).tab, targetRoom)"));
  assert(rooms.includes("? getVacantNextStep(selectedRoom).label"));
});
console.log(`${n}/${n} cases passed`);
