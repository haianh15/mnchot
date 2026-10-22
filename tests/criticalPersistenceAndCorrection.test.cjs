const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const code=fs.readFileSync('src/context/AppContext.tsx','utf8');
const ast=ts.createSourceFile('AppContext.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function extract(name){let target;function walk(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name)target=node.initializer?.getText(ast);ts.forEachChild(node,walk)}walk(ast);assert(target,name);return ts.transpileModule(`(${target})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText}
let pass=0;function check(label,fn){fn();console.log('PASS',label);pass++}
for(const n of ['recordInitialPaymentPH07','confirmCheckInPH05','confirmReturnStep305AndVacantPH08','saveHandoverReportBG03','confirmHandoverSignaturesBG03','recordReturnInspectionBG09','confirmReturnInspectionStep305','saveAssetComparisonResultBG07','saveHandoverReturnReportBG11','confirmFinalReturnReportBG11','saveSettlementSlipQTC01','updateSettlementFeedbackQTC02','confirmSettlementTransferReceiptQTC03']){
 check(n+' uses checked storage before success',()=>{
 const src=extract(n);assert(src.includes('persistCritical('),n+' must pre-commit');
 });
}
function instance(){const i={roomCode:'P.101',contractId:'hd1',leaseId:'L1',step304Status:'Đã nhận lại',step305Confirmed:true,step305ConfirmedAt:'2026-10-20T00:00:00Z',step305Evidence:'Bản gốc',version:1};
 const c={rooms:[{roomCode:'P.101',currentLeaseId:'L1'}],contracts:[{id:'hd1',roomCode:'P.101',leaseId:'L1'}],returnInspections:[i],settlementSlips:[],currentUser:{fullName:'Chủ nhà'},logSecurity:()=>{}};
 c.persistCritical=()=>({success:true});c.setReturnInspections=next=>{c.returnInspections=next};return c;
}
const proposal=extract('correctReturnInspectionStep305'),approve=extract('confirmReturnCorrectionBG09');
const invoke=(source,c,...args)=>vm.runInNewContext(source,c)(...args);
check('Gửi đề nghị đính chính không tự đảo trạng thái đã xác nhận',()=>{
 let c=instance();assert.equal(invoke(proposal,c,'P.101','L1','Chưa nhận lại','Nhập nhầm','Ảnh chụp').success,true);
 assert.equal(c.returnInspections[0].step304Status,'Đã nhận lại');assert.equal(c.returnInspections[0].step305Confirmed,true);
 assert.equal(c.returnInspections[0].correctionStatus,'Đính chính chờ xác nhận');
 assert.equal(invoke(approve,c,'P.101','L1').success,true);
 assert.equal(c.returnInspections[0].step304Status,'Chưa nhận lại');assert.equal(c.returnInspections[0].version,2);
 assert.equal(c.returnInspections[0].correctionHistory[0].status,'Đã nhận lại');
});
check('Đề nghị đính chính bị từ chối nếu trình duyệt ghi thất bại',()=>{
 let c=instance();c.persistCritical=()=>({success:false,message:'Lỗi bộ nhớ'});
 assert.equal(invoke(proposal,c,'P.101','L1','Chưa nhận lại','Lý do','Chứng cứ').success,false);
 assert.equal(c.returnInspections[0].correctionProposal,undefined);
});
check('Không duyệt đảo kết quả khách cũ khi phòng có khách mới',()=>{
 let c=instance();invoke(proposal,c,'P.101','L1','Chưa nhận lại','Lý do','Chứng cứ');
 c.rooms[0].currentLeaseId='L2';assert.equal(invoke(approve,c,'P.101','L1').success,false);
});
console.log(`TOTAL ${pass} critical business and correction tests`);
