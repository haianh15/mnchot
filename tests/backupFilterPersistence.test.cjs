const assert = require('node:assert/strict');
const {loadTs} = require('./loadTs.cjs');
const {matchesSettlementGroup, terminalSettlementStatuses} = loadTs('src/utils/settlementUi.ts');
const {commitBusinessStorage} = loadTs('src/utils/businessStorage.ts');
const {validateBusinessBackup} = loadTs('src/utils/backupValidation.ts');
let checks=0;function check(label,fn){fn();checks++;console.log('PASS',label)}
check('Thẻ pending/agreed/dispute/published lọc cùng trạng thái với danh sách',()=>{
 const slips=[{status:'Đang lập'},{status:'Không đồng ý'},{status:'Không liên hệ được'},
 {status:'Khách đồng ý'},{status:'Tranh chấp'},...terminalSettlementStatuses.map(status=>({status}))];
 assert.equal(slips.filter(s=>matchesSettlementGroup(s.status,'pending')).length,3);
 assert.equal(slips.filter(s=>matchesSettlementGroup(s.status,'agreed')).length,1);
 assert.equal(slips.filter(s=>matchesSettlementGroup(s.status,'dispute')).length,1);
 assert.equal(slips.filter(s=>matchesSettlementGroup(s.status,'published')).length,terminalSettlementStatuses.length);
 assert.equal(slips.filter(s=>matchesSettlementGroup(s.status,'all')).length,slips.length);
 assert.equal(matchesSettlementGroup('Hoàn tất','Hoàn tất'),true);
});
function fakeStore(failKey=''){
 let memory=new Map([['mini_apt_rooms','[{"old":true}]'],['mini_apt_contracts','[{"old":true}]']]);
 return {memory,getItem:key=>memory.has(key)?memory.get(key):null,setItem:(key,v)=>{if(key===failKey)throw Error('quota');memory.set(key,v)},removeItem:key=>memory.delete(key)};
}
check('Ghi nhiều nhóm dữ liệu được đọc xác nhận trước báo thành công',()=>{
 const mem=fakeStore();const r=commitBusinessStorage({mini_apt_rooms:[{id:'r1'}],mini_apt_contracts:[{id:'h1'}]},mem);
 assert.equal(r.success,true);assert.equal(JSON.parse(mem.getItem('mini_apt_rooms'))[0].id,'r1');
});
check('Lỗi khi ghi nhóm thứ hai trả lại nhóm trước, không báo thành công',()=>{
 const mem=fakeStore('mini_apt_contracts');const old=mem.getItem('mini_apt_rooms');
 const r=commitBusinessStorage({mini_apt_rooms:[{id:'r1'}],mini_apt_contracts:[{id:'h1'}]},mem);
 assert.equal(r.success,false);assert.equal(mem.getItem('mini_apt_rooms'),old);
});
const valid={schema:'ccmn-business-backup-v1',exportedAt:'2026-10-22T00:00:00.000Z',records:{
 mini_apt_rooms:[{id:'r1',roomCode:'P.101',status:'Đang thuê',currentTenantId:'t1',currentContractId:'hd1',currentLeaseId:'L1'}],
 mini_apt_tenants:[{id:'t1',fullName:'Trần A',idNumber:'12345'}],
 mini_apt_contracts:[{id:'hd1',roomCode:'P.101',leaseId:'L1',tenantId:'t1',tenantName:'Trần A',isSignedPaper:true}],
 mini_apt_initialPaymentRecords:[{id:'pay1',roomCode:'P.101',leaseId:'L1',contractId:'hd1'}],
 mini_apt_handoverReports:[{id:'bb1',roomCode:'P.101',leaseId:'L1',contractId:'hd1'}]
}};
check('Bản JSON có đủ liên kết hợp lệ được chấp nhận',()=> assert.deepEqual(validateBusinessBackup(valid),[]));
check('Sai sơ đồ/phiên bản và thiếu nhóm bắt buộc bị chặn',()=>{
 assert.ok(validateBusinessBackup({...valid,schema:'other'}).length);
 assert.ok(validateBusinessBackup({...valid,records:{mini_apt_rooms:[]}}).some(s=>s.includes('contracts')));
});
check('Sai mã hợp đồng và phòng đã thuê liên kết khách khác bị chặn',()=>{
 const x=structuredClone(valid);x.records.mini_apt_handoverReports[0].contractId='HD khác';
 assert.ok(validateBusinessBackup(x).some(s=>s.includes('handoverReports')));
 const y=structuredClone(valid);y.records.mini_apt_rooms[0].currentTenantId='t2';
 assert.ok(validateBusinessBackup(y).some(s=>s.includes('rooms[0]')));
});
check('Trùng phòng, trùng hồ sơ, nhóm lạ đều bị từ chối',()=>{
 const x=structuredClone(valid);x.records.mini_apt_rooms.push({...x.records.mini_apt_rooms[0],id:'r2'});
 assert.ok(validateBusinessBackup(x).some(s=>s.includes('trùng')));
 const y=structuredClone(valid);y.records.mini_apt_privateUnknown=[{name:'z'}];
 assert.ok(validateBusinessBackup(y).some(s=>s.includes('không được hỗ trợ')));
});
console.log(`TOTAL ${checks} backup/filter/commit verification tests`);
