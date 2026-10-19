const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts;
try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const vm = require('node:vm');
const file = fs.readFileSync(__dirname + '/../src/utils/roomLinks.ts','utf8');
const js = ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleExports = {};
vm.runInNewContext(js,{exports: moduleExports, require});
const {resolveRoomContract, resolveRoomTenantId} = moduleExports;
const vacancy = {roomCode:'P.505',status:'Trống',totalOccupants:0};
const pending = {id:'HD505',roomCode:'P.505',leaseId:'THUE-505-L2',tenantId:'new',signedDate:'2026-10-19',status:'Chờ hiệu lực',isSignedPaper:true};
const past = {id:'HD-OLD',roomCode:'P.505',leaseId:'THUE-505-L1',tenantId:'old',status:'Kết thúc',actualCheckInDate:'2026-01-01',isSignedPaper:true};
const wrongRoom = {...pending,id:'HD-OTHER',roomCode:'P.506',leaseId:'THUE-506-L1'};
const draft = {...pending,id:'HD-DRAFT',isSignedPaper:false,status:'Nháp'};
const tenants = [{id:'old',fullName:'Khách trước'},{id:'new',fullName:'Khách đã ký'}];
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS',name)}
test('Phòng mới không có hợp đồng đã ký thì không tự mở hợp đồng cũ hoặc nháp',()=>assert.equal(resolveRoomContract(vacancy,[past,draft,wrongRoom],[]),undefined));
test('Ký giấy cho phòng Trống sẽ xuất hiện đúng hợp đồng mới, không giả có người ở',()=>{const c=resolveRoomContract(vacancy,[past,pending,wrongRoom],[]); assert.equal(c.id,'HD505'); assert.equal(vacancy.status,'Trống'); assert.equal(resolveRoomTenantId(vacancy,c,tenants),'new')});
test('Không lấy hợp đồng của phòng khác',()=>assert.equal(resolveRoomContract(vacancy,[wrongRoom],[]),undefined));
test('Lần thuê cũ đã trả phòng không trở lại thành hợp đồng hiện tại',()=>assert.equal(resolveRoomContract(vacancy,[{...past,status:'Hiệu lực'}],[{roomCode:'P.505',leaseId:past.leaseId,step305Confirmed:true}]),undefined));
test('Khi đã nhận phòng, chỉ mở hợp đồng khớp lease',()=>{const occupied={...vacancy,status:'Đang thuê',currentLeaseId:'THUE-505-L2',currentContractId:'HD505',currentTenantId:'new'};const c=resolveRoomContract(occupied,[past,pending,wrongRoom],[]);assert.equal(c.id,'HD505');assert.equal(resolveRoomTenantId(occupied,c,tenants),'new')});
test('Không chuyển hồ sơ sang khách khác nếu room và contract xung đột',()=>{const occupied={...vacancy,status:'Đang thuê',currentLeaseId:'THUE-505-L2',currentContractId:'HD505',currentTenantId:'old'};assert.equal(resolveRoomTenantId(occupied,pending,tenants),undefined)});
test('Hợp đồng khác lần thuê không được dùng làm nguồn cho phòng có khách',()=>{const occupied={...vacancy,status:'Đang thuê',currentLeaseId:'THUE-505-L3'};assert.equal(resolveRoomContract(occupied,[pending,past],[]),undefined)});
test('Ưu tiên hợp đồng chờ nhận đã được liên kết chính xác',()=>{const pending2={...pending,id:'HD505SECOND',signedDate:'2026-10-20'};assert.equal(resolveRoomContract({...vacancy,pendingContractId:'HD505'},[pending,pending2],[]).id,'HD505')});
console.log('TOTAL',tests);
