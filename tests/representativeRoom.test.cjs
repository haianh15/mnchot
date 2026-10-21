/** One representative may be linked to only one unfinished room at a time. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const vm = require('node:vm');
const {loadTs} = require('./loadTs.cjs');
const {findRepresentativeRoomConflict: conflict} = loadTs('src/utils/representativeRoom.ts');
const source = fs.readFileSync('src/context/AppContext.tsx','utf8');
const ast = ts.createSourceFile('AppContext.tsx',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
function getFn(name){let code;function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)code=n.initializer.getText(ast);ts.forEachChild(n,visit)}visit(ast);assert(code,name);return ts.transpileModule(`(${code});`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText}
const tenant=(id,fullName='Nguyễn Văn A',phone='0900000001',idNumber='001234567890')=>({id,fullName,phoneNumber:phone,idNumber});
const room=(code,status='Trống',tenantId,leaseId='L1')=>({roomCode:code,status,currentTenantId:tenantId,currentLeaseId:leaseId,currentContractId:tenantId?'HD-'+code:undefined});
const contract=(code,id='TEN-A',status='Hiệu lực',signed=true,actualCheckInDate='2026-05-01',leaseId='L1')=>({id:'HD-'+code,roomCode:code,tenantId:id,tenantName:'Nguyễn Văn A',tenantPhone:'0900000001',tenantIdNumber:'001234567890',leaseId,contractType:'Hợp đồng lần đầu',status,isSignedPaper:signed,actualCheckInDate,startDate:'2026-05-01',endDate:'2027-05-01'});
let count=0;function t(name,fn){fn();count++;console.log('PASS',name)}
for(const code of ['P.101','P.909','P.999','ROOM-NEW']){
  const person=tenant('TEN-A');
  const assignedRoom=room(code,'Đang thuê','TEN-A');
  const target='P.880';
  t(`${code}: same tenantId blocks different occupied room`,()=>assert.equal(conflict({roomCode:target,tenantId:'TEN-A'},[assignedRoom,room(target)],[],[person])?.roomCode,code));
  t(`${code}: CCCD blocks an alternative profile`,()=>assert.equal(conflict({roomCode:target,tenantId:'TEN-B'},[assignedRoom,room(target)],[contract(code)],[person,tenant('TEN-B','Tên khác','0900000002','001234567890')])?.roomCode,code));
  t(`${code}: preliminary identity name+phone prevents room duplication`,()=>assert.equal(conflict({roomCode:target,tenantName:' Nguyễn Văn A ',tenantPhone:'0900 000 001'},[assignedRoom,room(target)],[],[person])?.roomCode,code));
  t(`${code}: same name different phone does not conflate people`,()=>assert.equal(conflict({roomCode:target,tenantName:'Nguyễn Văn A',tenantPhone:'0988888888'},[assignedRoom,room(target)],[],[person]),undefined));
  t(`${code}: same room is allowed (consecutive contract)`,()=>assert.equal(conflict({roomCode:code,tenantId:'TEN-A'},[assignedRoom],[contract(code)],[person]),undefined));
  t(`${code}: after verified return it is allowed to move to a new room`,()=>assert.equal(conflict({roomCode:target,tenantId:'TEN-A'},[room(code),room(target)],[contract(code)],[person],[{roomCode:code,leaseId:'L1',step305Confirmed:true,step304Status:'Đã nhận lại'}]),undefined));
  t(`${code}: paper signed awaiting check-in blocks new room`,()=>assert.equal(conflict({roomCode:target,tenantId:'TEN-A'},[room(code),room(target)],[{...contract(code,'TEN-A','Đã ký'),actualCheckInDate:undefined}],[person])?.roomCode,code));
  t(`${code}: unsigned draft on other room blocks duplicate assignment`,()=>assert.equal(conflict({roomCode:target,tenantId:'TEN-A'},[room(code),room(target)],[contract(code,'TEN-A','Nháp',false,undefined)],[person])?.roomCode,code));
  t(`${code}: cancelled or completed contract is not a conflict`,()=>assert.equal(conflict({roomCode:target,tenantId:'TEN-A'},[room(code),room(target)],[contract(code,'TEN-A','Kết thúc')],[person]),undefined));
}
// Handlers are the actual code from AppContext, not copies of its conditions.
const active=room('P.101','Đang thuê','TEN-A');
const empty=room('P.909');
const base=contract('P.101');
const cDraft={...contract('P.909'),id:'D909',isSignedPaper:false,status:'Nháp',actualCheckInDate:undefined,tenantIdNumber:undefined};
const allTenants=[tenant('TEN-A')];
function ctx(overrides={}) {
 let c={rooms:[active,empty],contracts:[base],tenants:allTenants,returnInspections:[],leaseStartEvents:[],initialPaymentRecords:[],currentUser:{fullName:'Chủ nhà'},findRepresentativeRoomConflict:conflict,
 validateContractTenantLink:()=>({valid:true}),blocksNewLeaseOnVacantRoom:()=>false,logSecurity:()=>{},setContracts:fn=>c.contracts=fn(c.contracts),Date,...overrides};
 return c;
}
const draftData={...cDraft,id:undefined,contractType:'Hợp đồng lần đầu',leaseId:'',roomCode:'P.909',tenantId:'TEN-A',tenantName:'Nguyễn Văn A',tenantIdNumber:'001234567890',monthlyRent:3500000,depositAmount:3500000,firstMonthRentAmount:3500000,firstMonthRentPaid:false};
t('HDT02 actual handler rejects assigning same representative to second room',()=>{
 const c=ctx();const before=c.contracts.length;const res=vm.runInNewContext(getFn('createContractDraftHDT02'),c)(draftData);
 assert.equal(res.success,false);assert.equal(c.contracts.length,before);assert.match(res.message,/P\.101/);
});
t('HDT03 actual update handler rejects changing representative to occupied tenant',()=>{
 const c=ctx({contracts:[base,{...cDraft,tenantId:'TEN-B'}],tenants:[tenant('TEN-A'),tenant('TEN-B','Khác','0900000002','009999999999')]});
 const res=vm.runInNewContext(getFn('updateContractDraftHDT03'),c)('D909',{tenantId:'TEN-A',tenantName:'Nguyễn Văn A',tenantIdNumber:'001234567890'},'Đổi đại diện');
 assert.equal(res.success,false);assert.equal(c.contracts[1].tenantId,'TEN-B');
});
t('HDT04 actual signature handler rejects a previously created draft for second room',()=>{
 const c=ctx({contracts:[base,{...cDraft,tenantId:'TEN-A',tenantIdNumber:'001234567890'}], getInitialPaymentStatus:()=>({valid:true})});
 const res=vm.runInNewContext(getFn('confirmContractSignedHDT04'),c)('D909','2026-10-20',['paper.pdf']);
 assert.equal(res.success,false);assert.equal(c.contracts[1].isSignedPaper,false);
});
t('HDT01 actual eligibility check explains duplicate representative',()=>{
 const c=ctx({batchSchedules:[{batchCode:'B',isConfirmed:true}]});
 const res=vm.runInNewContext(getFn('checkLeaseConditionHDT01'),c)({roomCode:'P.909',tenantId:'TEN-A',batchCode:'B',monthlyRent:3500000,depositAmount:3500000});
 assert.equal(res.isValid,false);assert.match(res.blockingErrors.join(' '),/P\.101/);
});
console.log(`TOTAL ${count} representative room safeguards`);
