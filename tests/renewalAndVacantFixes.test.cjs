const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const {loadTs} = require('./loadTs.cjs');
const exp = loadTs('src/utils/contractEligibility.ts');
const {canCreateRenewalContract,blocksNewLeaseOnVacantRoom}=exp;
const {findRepresentativeRoomConflict} = loadTs('src/utils/representativeRoom.ts');
const signed = {id:'HD-101',contractType:'Hợp đồng lần đầu',roomCode:'P.101',leaseId:'L1',tenantId:'TEN1',endDate:'2027-03-01',status:'Hiệu lực',isSignedPaper:true,actualCheckInDate:'2026-09-01'};
const occupied={roomCode:'P.101',status:'Đang thuê',currentLeaseId:'L1',currentContractId:'HD-101',currentTenantId:'TEN1'};
const tests=[];const test=(label,cb)=>{cb();tests.push(label);console.log('PASS',label)};
test('P101 đã trả phòng: hợp đồng lịch sử không chặn ký lượt thuê mới',()=>assert.equal(blocksNewLeaseOnVacantRoom(signed),false));
test('P909 ký mới chờ nhận phòng phải chặn ký thêm hợp đồng khác',()=>assert.equal(blocksNewLeaseOnVacantRoom({...signed,actualCheckInDate:undefined,status:'Đã ký'}),true));
test('Không gia hạn trước hạn khi phòng còn Đang thuê',()=>assert.equal(canCreateRenewalContract(signed,[occupied],[signed],'2026-10-21'),false));
test('Cho lập nối tiếp khi phòng Sắp trả',()=>assert.equal(canCreateRenewalContract(signed,[{...occupied,status:'Sắp trả'}],[signed],'2026-10-21'),true));
test('Cho lập nối tiếp khi HĐ hết hạn và người thuê vẫn ở',()=>assert.equal(canCreateRenewalContract(signed,[occupied],[signed],'2027-03-01'),true));
test('Phòng Trống không thể lập nối tiếp dù đã hết hạn',()=>assert.equal(canCreateRenewalContract(signed,[{...occupied,status:'Trống'}],[signed],'2028-01-01'),false));
test('Không nối tiếp từ HĐ của lượt thuê cũ',()=>assert.equal(canCreateRenewalContract(signed,[{...occupied,currentLeaseId:'L2'}],[signed],'2028-01-01'),false));
test('Không nối tiếp từ HĐ cũ khi đã có hợp đồng nối tiếp',()=>assert.equal(canCreateRenewalContract(signed,[occupied],[signed,{...signed,id:'NEW',previousContractId:'HD-101'}],'2028-01-01'),false));
const contextSource=fs.readFileSync('src/context/AppContext.tsx','utf8');
const ast=ts.createSourceFile('AppContext.tsx',contextSource,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
const getFn=name=>{let found;function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)found=n.initializer.getText(ast);ts.forEachChild(n,visit)}visit(ast);assert(found, name);return ts.transpileModule(`(${found});`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText};
// Actual context handler is run, so UI hiding is not the only enforcement.
const fcode=getFn('createRenewalContractHDT06');
const invoke=(room,oldContract=signed,extra=[])=>{
 const ctx={contracts:[oldContract,...extra],rooms:[room],tenants:[],returnInspections:[],leaseStartEvents:[],findRepresentativeRoomConflict,canCreateRenewalContract, currentUser:{fullName:'Chủ nhà'},logSecurity:()=>{},setContracts:cb=>ctx.contracts=cb(ctx.contracts),Date};
 return vm.runInNewContext(fcode,ctx)({previousContractId:oldContract.id,roomCode:'P.101',tenantId:'TEN1',tenantName:'Khách',batchCode:'B',startDate:'2027-03-01',endDate:'2027-09-01',monthlyRent:3500000,terms:'Gia hạn'});
};
test('Handler thực tế chặn tạo nối tiếp cho phòng Trống',()=>assert.equal(invoke({...occupied,status:'Trống'}).success,false));
test('Handler thực tế chặn tạo nối tiếp trước hạn',()=>assert.equal(invoke(occupied).success,false));
const guardExp = loadTs('src/utils/handoverValidation.ts');
const valid=guardExp.hasValidHandoverSource;
test('P909 ký giấy chưa nhận phòng, pending liên kết lỗi thời vẫn lập được hồ sơ bàn giao',()=>assert.equal(valid([{roomCode:'P.909',status:'Trống',pendingLeaseId:'WRONG',pendingContractId:'MISSING'}],[{id:'HD909',roomCode:'P.909',leaseId:'L909',status:'Đã ký',isSignedPaper:true,contractType:'Hợp đồng lần đầu'}],'P.909','L909','HD909'),true));
test('P909 không thể lập bàn giao khi hợp đồng chưa ký',()=>assert.equal(valid([{roomCode:'P.909',status:'Trống'}],[{id:'HD909',roomCode:'P.909',leaseId:'L909',status:'Nháp',isSignedPaper:false}],'P.909','L909','HD909'),false));
test('P909 không thể lập bàn giao sai mã phòng',()=>assert.equal(valid([{roomCode:'P.909',status:'Trống'}],[{id:'HD909',roomCode:'P.909',leaseId:'L909',status:'Đã ký',isSignedPaper:true}],'P.999','L909','HD909'),false));
// P101 regression: the old paper contract was once effective, but the physical room is vacant.
const checkFn = getFn('checkLeaseConditionHDT01');
const old = signed;
const vacantRoom = {...occupied,status:'Trống',currentLeaseId:undefined,currentContractId:undefined,currentTenantId:undefined};
const condition={roomCode:'P.101',batchCode:'B1',startDate:'2026-10-01',endDate:'2027-04-01',monthlyRent:3500000,depositAmount:3500000};
test('HDT01 cho tạo điều kiện thuê mới P101 khi HĐ cũ từng có khách và phòng Trống',()=>{
  const ctx={rooms:[vacantRoom],contracts:[old],batchSchedules:[{batchCode:'B1',isConfirmed:true}],tenants:[],findRepresentativeRoomConflict,blocksNewLeaseOnVacantRoom, returnInspections:[],leaseStartEvents:[],Date};
  const res=vm.runInNewContext(checkFn,ctx)(condition);assert.equal(res.isValid,true,JSON.stringify(res.blockingErrors));
});
test('HDT01 không cho tạo điều kiện thuê mới khi P909 đã ký đang chờ nhận',()=>{
  const ctx={rooms:[{roomCode:'P.909',status:'Trống'}],contracts:[{...old,roomCode:'P.909',leaseId:'L909',actualCheckInDate:undefined,status:'Đã ký'}],batchSchedules:[{batchCode:'B1',isConfirmed:true}],tenants:[],findRepresentativeRoomConflict,blocksNewLeaseOnVacantRoom, returnInspections:[],leaseStartEvents:[],Date};
  const res=vm.runInNewContext(checkFn,ctx)({...condition,roomCode:'P.909'});assert.equal(res.isValid,false);
});
const createFn=getFn('createContractDraftHDT02');
test('HDT02 cấp mã lượt thuê P101 kế tiếp không trùng hợp đồng lịch sử',()=>{
  const ctx={rooms:[vacantRoom],contracts:[{...old,leaseId:'THUE-101-L1'}], tenants:[], currentUser:{fullName:'Chủ nhà'},Date,
    validateContractTenantLink:()=>({valid:true}),findRepresentativeRoomConflict,blocksNewLeaseOnVacantRoom,returnInspections:[],leaseStartEvents:[],
    logSecurity:()=>{},setContracts:cb=>ctx.contracts=cb(ctx.contracts)};
  const res=vm.runInNewContext(createFn,ctx)({...condition,tenantId:'TEN2',tenantName:'Khách mới',contractType:'Hợp đồng lần đầu',leaseId:'',terms:'Nội dung',firstMonthRentAmount:3500000});
  assert.equal(res.success,true, res.message);assert.equal(ctx.contracts[0].leaseId,'THUE-101-L2');assert.equal(ctx.contracts[0].tenantId,'TEN2');
});
console.log('TOTAL', tests.length);
