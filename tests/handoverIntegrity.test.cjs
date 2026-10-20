const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const source = fs.readFileSync('src/utils/roomLinks.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const Module = require('node:module');
const m = new Module('virtual-room-links', module);
m.paths = module.paths;
m._compile(js, 'virtual-room-links.js');
const { getConfirmedRoomHandover, getLeaseContractChain } = m.exports;
const original = {id:'hd-A', roomCode:'P.101', leaseId:'L1', contractType:'Hợp đồng lần đầu', isSignedPaper:true};
const renewal = {id:'hd-R',roomCode:'P.101', leaseId:'L1', contractType:'Hợp đồng nối tiếp', isSignedPaper:true, previousContractId:'hd-A'};
const other = {id:'hd-Z',roomCode:'P.102',leaseId:'L9'};
const report = {id:'bb-A',roomCode:'P.101',leaseId:'L1',contractId:'hd-A',status:'Đã xác nhận',tenantSignedPaper:'Đã ký giấy',ownerSignedPaper:'Đã ký giấy'};
function check(name,fn){fn(); console.log('PASS',name)}
check('Phòng có biên bản giấy xác nhận đúng hợp đồng',()=> assert.equal(getConfirmedRoomHandover(original,[original],[report]),report));
check('Thiếu biên bản thì không coi đã xác nhận',()=> assert.equal(getConfirmedRoomHandover(original,[original],[]),undefined));
check('Biên bản nháp không xác nhận',()=> assert.equal(getConfirmedRoomHandover(original,[original],[{...report,status:'Đã lập'}]),undefined));
check('Thiếu chữ ký không xác nhận',()=> assert.equal(getConfirmedRoomHandover(original,[original],[{...report,tenantSignedPaper:'Chưa ký'}]),undefined));
check('Không mượn biên bản phòng khác',()=> assert.equal(getConfirmedRoomHandover(other,[original,other],[report]),undefined));
check('Hợp đồng nối tiếp kế thừa biên bản nhận phòng có thật',()=> assert.equal(getConfirmedRoomHandover(renewal,[original,renewal],[report]),report));
check('Không kế thừa biên bản từ khách cũ cùng phòng qua previousContractId sai',()=>assert.equal(getConfirmedRoomHandover({...renewal,id:'hd-NEW',leaseId:'L2'},[original,renewal],[report]),undefined));
check('Hợp đồng lần đầu không được kế thừa biên bản dù có previousContractId',()=>assert.equal(getConfirmedRoomHandover({...renewal,id:'hd-FIRST',contractType:'Hợp đồng lần đầu'},[original,renewal],[report]),undefined));
check('Không kéo biên bản từ hợp đồng khác cùng phòng',()=> assert.equal(getConfirmedRoomHandover({id:'hd-X',roomCode:'P.101',leaseId:'L3'},[original],[report]),undefined));
check('Không kéo biên bản khác phòng vào chuỗi nối tiếp',()=> assert.equal(getConfirmedRoomHandover({id:'hd-RX',roomCode:'P.102',leaseId:'L4',previousContractId:'hd-A'},[original],[report]),undefined));
check('Không lặp vô hạn khi dữ liệu có vòng tham chiếu',()=> assert.equal(getLeaseContractChain({id:'hd-A',roomCode:'P.101',previousContractId:'hd-A'},[{id:'hd-A',roomCode:'P.101',previousContractId:'hd-A'}]).length,1));
check('Không còn nút gắn dấu tra cứu hoặc điều kiện dấu tra cứu',()=>{const s=fs.readFileSync('src/components/views/HandoverAssetsView.tsx','utf8');assert(!s.includes('Gắn dấu tra cứu'));assert(!s.includes('hasValidBG05'));assert(!s.includes('AUDIT-BG05-VALID'));});
check('Cập nhật kế hoạch trả phải kiểm tra biên bản nhận phòng',()=>assert(fs.readFileSync('src/context/AppContext.tsx','utf8').includes('!getConfirmedRoomHandover(currentContract, contracts, handoverReports)')));
