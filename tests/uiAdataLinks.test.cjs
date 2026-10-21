const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');const assert=require('node:assert/strict');const {test}=require('node:test');
const source=fs.readFileSync(path.join(__dirname,'../src/context/AppContext.tsx'),'utf8');
const ast=ts.createSourceFile('AppContext.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function extract(name){let found;function visit(node){if(ts.isVariableDeclaration(node) && node.name.getText(ast)===name)found=node.initializer;ts.forEachChild(node,visit);}visit(ast);assert.ok(found,`no ${name}`);return '(() => { '+ts.transpileModule('const f='+found.getText(ast)+';', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText+'\nreturn f; })()';}
const prepared=['performReconciliationUC07_1','generatePaymentNotice07_2','issuePeriodNoticeFromA'].map(n=>[n,extract(n)]);
const bank={id:'bank-b',bankName:'VCB',accountNumber:'123',accountHolder:'Owner',status:'Đang sử dụng'};
const alternate={...bank,id:'bank-second',bankName:'MB Bank',accountNumber:'456'};
const due=()=>{let d=new Date();d.setDate(d.getDate()+3);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const baseBill=()=>({id:'bill-1',roomCode:'P.501',leaseId:'L-501-1',periodCode:'Kỳ 10/2026',servicePeriodFrom:'2026-09-01',servicePeriodTo:'2026-09-30',nextRentPeriodFrom:'2026-10-01',nextRentPeriodTo:'2026-10-31',nextMonthRentAmount:3500000,electricityAmount:420000,electricityUsage:120,electricityRate:3500,waterAmount:180000,waterUsage:6,waterRate:30000,serviceFees:[{name:'Dịch vụ',amount:250000}],totalAmount:4350000,isConfirmed:true,version:1});
function envMaker({bills=[baseBill()],contracts=[{id:'c501',roomCode:'P.501',leaseId:'L-501-1',tenantName:'A',firstMonthRentPaid:false,isSignedPaper:true}],rooms=[{roomCode:'P.501',status:'Đang thuê'}]}={}){
 let notices=[],recs=[];const trace=[];const ctx={Date,Math,Number,String,Set,
  periodBills:bills,contracts,rooms,bankAccounts:[bank,alternate],activeBankAccount:bank,currentUser:{fullName:'Chủ nhà'},
  get paymentNotices(){return notices},get reconciliations(){return recs},
  setPaymentNotices:fn=>{notices=fn(notices)},setReconciliations:fn=>{recs=fn(recs)},logSecurity:(...x)=>trace.push(x)};
 const methods={};for(const [n,code] of prepared)methods[n]=vm.runInNewContext(code,ctx);
 Object.assign(ctx,methods);
 return {methods,notices:()=>notices,recs:()=>recs,trace,ctx};
}
test('Lập thông báo với giao diện A tạo từ hóa đơn B và gắn phòng/lượt thuê/kỳ/đối chiếu B',()=>{
 const e=envMaker(),r=e.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-second');assert.equal(r.success,true,r.message);
 const n=e.notices()[0],re=e.recs()[0];assert.equal(n.totalAmount,4350000);assert.equal(n.roomCode,'P.501');assert.equal(n.leaseId,'L-501-1');assert.equal(n.periodCode,'Kỳ 10/2026');assert.equal(n.reconciliationId,re.id);assert.equal(re.billId,'bill-1');assert.equal(re.isReconciled,true);assert.equal(n.qrBankSnapshot.accountNumber,'456');assert.equal(n.qrBankSnapshot.amount,n.totalAmount);
});
test('Không lập chồng cùng phòng/kỳ/lượt thuê và không lập khi hợp đồng không khớp',()=>{
 const e=envMaker();assert.equal(e.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-b').success,true);
 assert.equal(e.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-b').success,false);
 const e2=envMaker({contracts:[{id:'other',roomCode:'P.502',leaseId:'L-501-1'}]});assert.equal(e2.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-b').success,false);
});
test('Hợp đồng đã thu thuê kỳ đầu không phát hành thu lại tiền thuê',()=>{
 const bill=baseBill(); const e=envMaker({bills:[bill],contracts:[{id:'c501',roomCode:'P.501',leaseId:'L-501-1',tenantName:'A',startDate:'2026-10-01',firstMonthRentPaid:true,isSignedPaper:true}]});
 const result=e.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-b');assert.equal(result.success,true,result.message);
 assert.equal(e.notices()[0].totalAmount,850000);assert.equal(e.notices()[0].breakdown.nextRentAmount,0);assert.equal(e.recs()[0].nextRentStatus,'Đã thu');
});
test('Bảng tính chưa xác nhận, không có ngân hàng đúng hoặc nguồn không hợp lệ sẽ bị từ chối',()=>{
 const bill=baseBill();bill.isConfirmed=false;const e=envMaker({bills:[bill]});assert.equal(e.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-b').success,false);
 const f=envMaker();assert.equal(f.methods.issuePeriodNoticeFromA('bill-1',due(),'unknown-bank').success,false);
});
test('Giao diện A chọn công nợ theo cả roomCode và leaseId, không gộp hai khách thuê cùng phòng',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../src/components/views/PaymentNoticesView.tsx'),'utf8');
 assert.ok(text.includes('groupKey = `${n.roomCode}::${n.leaseId}`'));
 assert.ok(text.includes('r.leaseId === selectedDebtLeaseId'));
 const ctx=fs.readFileSync(path.join(__dirname,'../src/context/AppContext.tsx'),'utf8');
 assert.ok(ctx.includes('new Set(sources.map(n => n.leaseId)).size !== 1'));
});
test('Không phát hành thông báo từ bảng tính thiếu hợp đồng đã ký',()=>{
 const e=envMaker({contracts:[{id:'draft501',roomCode:'P.501',leaseId:'L-501-1',isSignedPaper:false,status:'Nháp'}]});
 const r=e.methods.issuePeriodNoticeFromA('bill-1',due(),'bank-b');
 assert.equal(r.success,false);assert.equal(e.notices().length,0);
});
test('Hai lượt thuê khác nhau của cùng phòng/kỳ có mã thông báo và nội dung chuyển khoản riêng',()=>{
 const oldBill={...baseBill(),id:'bill-old',leaseId:'L-501-OLD',isRentPeriodEnded:true};
 const newBill={...baseBill(),id:'bill-new',leaseId:'L-501-NEW'};
 const e=envMaker({bills:[oldBill,newBill],contracts:[
  {id:'old',roomCode:'P.501',leaseId:'L-501-OLD',tenantName:'Khách trước',isSignedPaper:true},
  {id:'new',roomCode:'P.501',leaseId:'L-501-NEW',tenantName:'Khách sau',isSignedPaper:true}
 ]});
 assert.equal(e.methods.issuePeriodNoticeFromA('bill-old',due(),'bank-b').success,true);
 assert.equal(e.methods.issuePeriodNoticeFromA('bill-new',due(),'bank-b').success,true);
 const notices=e.notices();
 assert.equal(notices.length,2);
 assert.notEqual(notices[0].noticeCode,notices[1].noticeCode);
 assert.notEqual(notices[0].qrBankSnapshot.transferContent,notices[1].qrBankSnapshot.transferContent);
});
