const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,file);
const d=require('../src/data/seedData.ts');
const {completeDemoOccupiedFixtures,DEMO_OCCUPIED_ROOMS}=require('../src/data/demoOccupiedFixtures.ts');
const {auditOccupiedRoom}=require('../src/utils/roomReadiness.ts');
const {getInitialPaymentStatus}=require('../src/utils/initialPayments.ts');
const {getConfirmedRoomHandover}=require('../src/utils/roomLinks.ts');
let n=0;const check=(name,fn)=>{fn();n++;console.log('PASS',name)};
const makeState=()=>({rooms:[...d.INITIAL_ROOMS],tenants:[...d.INITIAL_TENANTS],contracts:[...d.INITIAL_CONTRACTS],
  initialPaymentRecords:[...d.INITIAL_INITIAL_PAYMENT_RECORDS],handoverReports:[...d.INITIAL_HANDOVER_REPORTS],
  inventoryRecords:[...d.INITIAL_INVENTORY_RECORDS],handoverConditions:[...d.INITIAL_HANDOVER_CONDITIONS],
  leaseStartEvents:[...d.INITIAL_LEASE_START_EVENTS]});
check('Tất cả 9 phòng mẫu đang thuê/Sắp trả đủ các 5 điều kiện',()=>{
  for(const code of DEMO_OCCUPIED_ROOMS){
    const s=makeState();const r=s.rooms.find(r=>r.roomCode===code);
    const a=auditOccupiedRoom(r,s.contracts,s.tenants,s.initialPaymentRecords,s.handoverReports);
    assert(a.valid,code+': '+a.missing.join(';'));
    assert(s.leaseStartEvents.some(e=>e.roomCode===code&&e.leaseId===r.currentLeaseId));
    assert(s.inventoryRecords.some(i=>i.roomCode===code&&i.linkedLeaseId===r.currentLeaseId));
    assert(s.handoverConditions.some(i=>i.roomCode===code&&i.linkedLeaseId===r.currentLeaseId));
  }
});
check('Chứng từ cọc/thuê đầu số tiền đúng hợp đồng (kể cả P102)',()=>{
  const s=makeState();for(const code of DEMO_OCCUPIED_ROOMS){
    const r=s.rooms.find(r=>r.roomCode===code);const c=s.contracts.find(c=>c.id===r.currentContractId);
    const p=getInitialPaymentStatus(c,s.contracts,s.initialPaymentRecords);assert(p.valid,code+': '+p.message);
    assert.equal(p.payment.actualAmount,p.payment.depositAmount+p.payment.firstMonthRentAmount);
    assert(p.payment.receivedDate<=c.signedDate);
  }
});
check('Các chứng từ và biên bản thêm mới đều có dấu DEMO dễ nhận diện',()=>{
  const s=makeState();
  for(const x of s.initialPaymentRecords.filter(p=>p.id.startsWith('DEMO-')||p.id==='pay07_102'))assert(x.transactionCode.startsWith('DEMO-'));
  for(const x of s.handoverReports.filter(r=>r.id.startsWith('DEMO-')))assert(x.paperLocation.includes('DEMO'));
});
check('Phòng Trống P103/P202/P303 không bị biến thành Đang thuê',()=>{
  const s=makeState();for(const code of ['P.103','P.202','P.303'])assert.equal(s.rooms.find(r=>r.roomCode===code).status,'Trống');
});
check('Nạp lại bộ dữ liệu mẫu không phát sinh thêm giao dịch/biên bản trùng',()=>{
  const s=makeState();const res=completeDemoOccupiedFixtures(s,d.INITIAL_STANDARD_ASSETS);
  assert.equal(res.added,0);assert.equal(res.corrected,0);assert.equal(res.skipped.length,0);
});
check('Có thể thêm hồ sơ DEMO cho localStorage cũ thiếu bản ghi mà không xóa dữ liệu khác',()=>{
  const s=makeState();s.contracts=s.contracts.filter(c=>!c.id.startsWith('HD-301'));
  s.initialPaymentRecords=s.initialPaymentRecords.filter(p=>p.roomCode!=='P.301');
  s.handoverReports=s.handoverReports.filter(p=>p.roomCode!=='P.301');
  s.inventoryRecords=s.inventoryRecords.filter(p=>p.roomCode!=='P.301');
  s.handoverConditions=s.handoverConditions.filter(p=>p.roomCode!=='P.301');
  s.leaseStartEvents=s.leaseStartEvents.filter(p=>p.roomCode!=='P.301');
  const extras={id:'USER-OWNED',contractId:'OTHER',roomCode:'P.777',leaseId:'L777'};
  s.initialPaymentRecords.push(extras);
  const res=completeDemoOccupiedFixtures(s,d.INITIAL_STANDARD_ASSETS);
  assert(res.added>=5);assert(res.initialPaymentRecords.includes(extras));
  const a=auditOccupiedRoom(s.rooms.find(r=>r.roomCode==='P.301'),res.contracts,s.tenants,res.initialPaymentRecords,res.handoverReports);
  assert(a.valid,a.missing.join(';'));
});
check('Không sửa chứng từ người dùng đã tự nhập khác bản demo',()=>{
  const s=makeState();const idx=s.initialPaymentRecords.findIndex(p=>p.roomCode==='P.102');
  s.initialPaymentRecords[idx]={...s.initialPaymentRecords[idx],id:'USER-PAY-102',depositAmount:1};
  const res=completeDemoOccupiedFixtures(s,d.INITIAL_STANDARD_ASSETS);
  assert.equal(res.initialPaymentRecords[idx].depositAmount,1);
  assert(res.skipped.some(msg=>msg.includes('P.102')));
});
check('Không cho lấy biên bản chưa ký làm biên bản đã xác nhận',()=>{
  const s=makeState();const r=s.rooms.find(r=>r.roomCode==='P.201');const c=s.contracts.find(c=>c.id===r.currentContractId);
  const rep=s.handoverReports.find(h=>h.roomCode==='P.201');
  assert(getConfirmedRoomHandover(c,s.contracts,s.handoverReports));
  assert.equal(getConfirmedRoomHandover(c,s.contracts,[{...rep,status:'Đã lập',ownerSignedPaper:'Chưa ký'}]),undefined);
});
check('Giữ nguyên hợp đồng mới từ người dùng nếu mã phòng có xung đột',()=>{
  const s=makeState();const idx=s.contracts.findIndex(c=>c.id==='HD-401-2026');
  s.contracts[idx]={...s.contracts[idx],leaseId:'OTHER-LEASE'};
  const res=completeDemoOccupiedFixtures(s,d.INITIAL_STANDARD_ASSETS);
  assert.equal(res.contracts[idx].leaseId,'OTHER-LEASE');
  assert(res.skipped.some(msg=>msg.includes('P.401')));
});
console.log(`DEMO occupied fixture: ${n}/${n} passed`);
