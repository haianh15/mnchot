const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const Module = require('node:module');
const path = require('node:path');
const file = 'src/utils/handoverValidation.ts';
const js = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const m = new Module(file, module); m.paths = module.paths; m._compile(js, path.resolve('src/utils/handoverValidation.js'));
const {hasValidHandoverSource,validateReturnConfirmation} = m.exports;
const room = {roomCode:'P.101',status:'Đang thuê',currentLeaseId:'LEASE-A'};
const contract = {id:'HD-A',roomCode:'P.101',leaseId:'LEASE-A',isSignedPaper:true,status:'Hiệu lực'};
const rooms=[room,{roomCode:'P.102',status:'Trống',pendingLeaseId:'LEASE-P'}];
const contracts=[contract,{...contract,id:'HD-OLD',leaseId:'LEASE-OLD',status:'Kết thúc'},
  {...contract,id:'HD-P',roomCode:'P.102',leaseId:'LEASE-P',status:'Đã ký'}];
let checks=0; function test(name,fn){fn();console.log('PASS',name);checks++}
test('Nhận diện liên kết đúng phòng/hợp đồng/lần thuê',()=>assert(hasValidHandoverSource(rooms,contracts,'P.101','LEASE-A','HD-A')));
test('Chặn hợp đồng của phòng khác',()=>assert(!hasValidHandoverSource(rooms,contracts,'P.102','LEASE-A','HD-A')));
test('Chặn hợp đồng cũ khi phòng đã có lần thuê mới',()=>assert(!hasValidHandoverSource(rooms,contracts,'P.101','LEASE-OLD','HD-OLD')));
test('Chặn mã hợp đồng thiếu',()=>assert(!hasValidHandoverSource(rooms,contracts,'P.101','LEASE-A',undefined)));
test('Cho phép hợp đồng đã ký chờ nhận phòng',()=>assert(hasValidHandoverSource(rooms,contracts,'P.102','LEASE-P','HD-P')));
test('Chặn hợp đồng chưa ký',()=>assert(!hasValidHandoverSource(rooms,[{...contract,isSignedPaper:false}],room.roomCode,contract.leaseId,contract.id)));
const ready={roomCode:'P.101',leaseId:'LEASE-A',contractId:'HD-A',step304Status:'Đã nhận lại',step305Confirmed:false,isDraft:false,assetsCheckedFully:true,items:[{name:'Chìa khóa',inspected:true,quantity:0,condition:'Bình thường'}],finalElectricityKwh:0,finalWaterM3:0,step305Evidence:'Đã nhận bàn giao thực tế'};
test('Chỉ số thực tế bằng 0 vẫn hợp lệ',()=>assert.equal(validateReturnConfirmation(ready,ready.step305Evidence),null));
test('Không có hồ sơ đã lưu không được xác nhận',()=>assert(validateReturnConfirmation(undefined,'Bằng chứng')));
test('Biên bản nháp không được xác nhận',()=>assert(validateReturnConfirmation({...ready,isDraft:true},ready.step305Evidence)));
test('Phải kiểm tra đủ tài sản',()=>assert(validateReturnConfirmation({...ready,items:[{name:'Chìa khóa',inspected:false,quantity:1,condition:''}]},ready.step305Evidence)));
test('Thiếu số điện thực đo bị chặn',()=>assert(validateReturnConfirmation({...ready,finalElectricityKwh:undefined},ready.step305Evidence)));
test('Thiếu số nước thực đo bị chặn',()=>assert(validateReturnConfirmation({...ready,finalWaterM3:undefined},ready.step305Evidence)));
test('Thiếu chứng cứ thực tế bị chặn',()=>assert(validateReturnConfirmation({...ready,step305Evidence:''},'')));
test('Không xác nhận hai lần',()=>assert(validateReturnConfirmation({...ready,step305Confirmed:true},ready.step305Evidence)));
console.log('TOTAL',checks);
