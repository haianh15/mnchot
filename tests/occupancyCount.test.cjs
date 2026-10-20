const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let ts;
try { ts = require('typescript') } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript') }
function importTs(relativeFile, imports = {}) {
  const file = path.join(__dirname, '..', relativeFile);
  const source = fs.readFileSync(file, 'utf8');
  const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}});
  const exports = {};
  vm.runInNewContext(outputText, {exports, require: x => { if(x in imports) return imports[x]; throw new Error('Unexpected dependency '+x); }});
  return exports;
}
const links = importTs('src/utils/roomLinks.ts');
const { getRoomOccupancy } = importTs('src/utils/occupancy.ts', {'./roomLinks':links});
let done = 0;
function test(name, fn) {fn(); done++; console.log('PASS', name)}
const room = {roomCode:'P.301',status:'Đang thuê',currentLeaseId:'LEASE-A',currentTenantId:'T-A',currentContractId:'H-A',totalOccupants:99};
const contract = {id:'H-A',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',isSignedPaper:true,status:'Hiệu lực'};
const tenant = {id:'T-A',fullName:'Khách chính'};
const other = [
  {id:'1',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',status:'Đang cư trú'},
  {id:'2',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',status:'Đang cư trú'},
  {id:'3',roomCode:'P.301',leaseId:'OLD',tenantId:'T-A',status:'Đang cư trú'},
  {id:'4',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',status:'Đã kết thúc'},
  {id:'5',roomCode:'P.302',leaseId:'LEASE-A',tenantId:'T-A',status:'Đang cư trú'},
  {id:'6',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-B',status:'Đang cư trú'},
  {id:'7',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',status:'Dự kiến'},
  {id:'8',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',status:'Nháp'},
];
const calc = (r=room, persons=other, cont=[contract], t=[tenant])=>getRoomOccupancy(r,cont,[],t,persons);
test('Tính 1 khách chính + 2 người ở cùng đang cư trú',()=>assert.equal(calc().total,3));
test('Chỉ trả danh sách 2 người đúng phòng/lần thuê/khách',()=>assert.equal(calc().currentCoTenants.length,2));
test('Phòng trống vẫn 0 kể cả nếu đã ký hợp đồng',()=>assert.equal(calc({...room,status:'Trống',currentLeaseId:undefined},other).total,0));
test('Người dự kiến, nháp, kết thúc không tính',()=>assert.equal(calc(room,other.slice(2)).total,1));
test('Kết thúc cư trú lập tức giảm số người',()=>assert.equal(calc(room,other.map(c=>c.id==='1'?{...c,status:'Đã kết thúc'}:c)).total,2));
test('Người ở mới đúng lần thuê lập tức tăng số',()=>assert.equal(calc(room,[...other,{id:'9',roomCode:'P.301',leaseId:'LEASE-A',tenantId:'T-A',status:'Đang cư trú'}]).total,4));
test('Không dùng totalOccupants đã lưu cũ (99)',()=>assert.equal(calc().total,3));
test('Không ghi nhận số 0 giả khi hồ sơ phòng thiếu mã lần thuê',()=>assert.equal(calc({...room,currentLeaseId:undefined}).total,null));
test('Không ghi nhận số 0 giả khi hồ sơ khách chính chưa khớp',()=>assert.equal(calc({...room,currentTenantId:'T-B'}).total,null));
test('Không dùng dữ liệu người ở của lần thuê trước',()=>assert.equal(calc({...room,currentLeaseId:'LEASE-B',currentContractId:'H-B'},other,[{...contract,id:'H-B',leaseId:'LEASE-B'}]).total,1));
// The views must not fall back to a stored denormalized count.
const roomsSrc = fs.readFileSync(path.join(__dirname,'../src/components/views/RoomsView.tsx'),'utf8');
const profileSrc = fs.readFileSync(path.join(__dirname,'../src/components/views/TenantsView.tsx'),'utf8');
test('Danh sách và Chi tiết phòng dùng cùng bộ đếm',()=>{assert.match(roomsSrc,/getOccupancyForRoom\(room\)\.total/);assert.match(roomsSrc,/selectedOccupancy\?\.total/);assert.doesNotMatch(roomsSrc,/\{(?:room|selectedRoom)\.totalOccupants\}/);});
test('Hồ sơ khách sử dụng chung hàm và chỉ đếm cư trú hiện tại',()=>{assert.match(profileSrc,/getRoomOccupancy\(/); assert.match(profileSrc,/currentOccupancy\?\.total/);assert.match(profileSrc,/activeCoTenantCount/);});
console.log('TOTAL',done);
