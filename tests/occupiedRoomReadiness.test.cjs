const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
require.extensions['.ts'] = function(mod, file) {
  mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS,target: ts.ScriptTarget.ES2022}}).outputText, file);
};
const { auditOccupiedRoom } = require('../src/utils/roomReadiness.ts');
const { INITIAL_ROOMS, INITIAL_CONTRACTS, INITIAL_TENANTS, INITIAL_INITIAL_PAYMENT_RECORDS, INITIAL_HANDOVER_REPORTS } = require('../src/data/seedData.ts');
let count = 0;
const test = (label, fn) => { fn(); count++; console.log('PASS',label); };
const original = {id:'HD-X',contractType:'Hợp đồng lần đầu',roomCode:'P.999',leaseId:'LEASE-X',tenantId:'TEN-X',tenantName:'Nguyễn Văn A',status:'Hiệu lực',isSignedPaper:true,actualCheckInDate:'2026-10-15',depositAmount:3000000,firstMonthRentAmount:3000000,signedDate:'2026-10-10'};
const tenant = {id:'TEN-X',fullName:'Nguyễn Văn A'};
const room = {roomCode:'P.999',status:'Đang thuê',currentContractId:'HD-X',currentLeaseId:'LEASE-X',currentTenantId:'TEN-X',currentTenantName:'Nguyễn Văn A'};
const payment = {id:'PM-X',roomCode:'P.999',leaseId:'LEASE-X',contractId:'HD-X',depositAmount:3000000,firstMonthRentAmount:3000000,actualAmount:6000000,receivedDate:'2026-10-09',transactionCode:'BANK-X',bankAccountReceived:'BANK-1',confirmedBy:'Chủ nhà',confirmedAt:'2026-10-10T08:30:00Z'};
const report = {id:'BB-X',contractId:'HD-X',roomCode:'P.999',leaseId:'LEASE-X',status:'Đã xác nhận',tenantSignedPaper:'Đã ký giấy',ownerSignedPaper:'Đã ký giấy'};
const valid = (r=room, cs=[original], ts=[tenant], ps=[payment], bs=[report]) => auditOccupiedRoom(r,cs,ts,ps,bs);
test('Chỉ phòng đầy đủ hợp đồng khách cọc thuê đầu bàn giao mới đạt', () => assert.equal(valid().valid,true));
test('Sai mã hợp đồng bị cảnh báo', () => assert.equal(valid({...room,currentContractId:'WRONG'}).valid,false));
test('Sai mã lần thuê bị cảnh báo', () => assert.equal(valid({...room,currentLeaseId:'OLD'}).valid,false));
test('Không có hồ sơ khách bị cảnh báo', () => assert.equal(valid(room,[original],[]).tenantValid,false));
test('Sai khách trong phòng bị cảnh báo', () => assert.equal(valid({...room,currentTenantId:'OLD'}).tenantValid,false));
test('Không có tiền cọc và tháng đầu bị cảnh báo', () => assert.equal(valid(room,[original],[tenant],[]).paymentValid,false));
test('Cọc không đúng tiền hợp đồng bị cảnh báo', () => assert.equal(valid(room,[original],[tenant],[{...payment,depositAmount:1}]).paymentValid,false));
test('Không có biên bản nhận phòng bị cảnh báo', () => assert.equal(valid(room,[original],[tenant],[payment],[]).handoverValid,false));
test('Biên bản chưa ký không hợp lệ', () => assert.equal(valid(room,[original],[tenant],[payment],[{...report,tenantSignedPaper:'Chưa ký'}]).handoverValid,false));
test('Biên bản lần thuê cũ không hợp lệ', () => assert.equal(valid(room,[original],[tenant],[payment],[{...report,leaseId:'OLD'}]).handoverValid,false));
test('Thiếu ngày nhận phòng bị cảnh báo', () => assert.equal(valid(room,[{...original,actualCheckInDate:undefined}]).valid,false));
test('Phòng Trống không bị gán hồ sơ đang thuê', () => assert.equal(valid({...room,status:'Trống'}).valid,true));
const seedRoom = id => INITIAL_ROOMS.find(r=>r.roomCode===id);
test('Dữ liệu demo P101 có chứng từ nguồn đối chiếu được', () => assert.equal(auditOccupiedRoom(seedRoom('P.101'),INITIAL_CONTRACTS,INITIAL_TENANTS,INITIAL_INITIAL_PAYMENT_RECORDS,INITIAL_HANDOVER_REPORTS).valid,true));
test('Bộ dữ liệu mẫu mới P201 có đủ hợp đồng, cọc, thuê đầu và biên bản DEMO', () => {
  const a = auditOccupiedRoom(seedRoom('P.201'),INITIAL_CONTRACTS,INITIAL_TENANTS,INITIAL_INITIAL_PAYMENT_RECORDS,INITIAL_HANDOVER_REPORTS);
  assert.equal(a.valid,true); assert.equal(a.paymentValid,true); assert.equal(a.handoverValid,true);
});
test('Bỏ chứng từ hoặc biên bản vẫn bị chặn dù trạng thái phòng là Đang thuê', () => {
  const r = seedRoom('P.201');
  assert.equal(auditOccupiedRoom(r,INITIAL_CONTRACTS,INITIAL_TENANTS,[],INITIAL_HANDOVER_REPORTS).valid,false);
  assert.equal(auditOccupiedRoom(r,INITIAL_CONTRACTS,INITIAL_TENANTS,INITIAL_INITIAL_PAYMENT_RECORDS,[]).valid,false);
});
const ctx=fs.readFileSync('src/context/AppContext.tsx','utf8');
const ck=ctx.slice(ctx.indexOf('const confirmCheckInPH05'),ctx.indexOf('const saveMissingConditionPH06'));
test('Xác nhận nhận phòng kiểm tra hồ sơ khách', () => assert(ck.includes('validateContractTenantLink(contract, tenants)')));
test('Chặn nhận phòng khi chưa có biên bản đã ký và cọc hợp lệ', () => { assert(ck.includes("h.status === 'Đã xác nhận'")); assert(ck.includes('getInitialPaymentStatus(contract, contracts, initialPaymentRecords)')); });
test('Chặn nhận phòng trùng', () => assert(ck.includes('leaseStartEvents.some(')));
const plan=ctx.slice(ctx.indexOf('const updateExpectedReturnDatePH11_12'),ctx.indexOf('const autoCancelReturnPlanPH14'));
test('Không chuyển sang Sắp trả khi dữ liệu cũ thiếu hồ sơ', () => assert(plan.includes('auditOccupiedRoom(room, contracts, tenants, initialPaymentRecords, handoverReports)')));
const view=fs.readFileSync('src/components/views/RoomsView.tsx','utf8');
test('Danh sách hiển thị nguồn cọc đối chiếu và không còn banner nhãn demo',()=>{ assert(view.includes('getInitialPaymentStatus(verifiedContract, contracts, initialPaymentRecords).valid')); assert(view.includes('Đã đối chiếu')); assert(!view.includes('Hồ sơ DEMO')); assert(!view.includes('Bổ sung hồ sơ DEMO')); assert(!view.includes('phòng mẫu cần bổ sung hồ sơ demo')); });
console.log(`Room readiness: ${count}/${count} tests passed.`);
