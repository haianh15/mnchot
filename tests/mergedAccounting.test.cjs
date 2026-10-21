const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../src/context/AppContext.tsx'),'utf8');
const ast=ts.createSourceFile('AppContext.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function findFn(name){let found;function scan(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name)found=node.initializer;ts.forEachChild(node,scan)}scan(ast);assert.ok(found,`missing ${name}`);const out=ts.transpileModule('const f = '+found.getText(ast)+';', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;return '(() => { '+out+'\nreturn f; })()';}
const names=['createDebtPaymentNotice','confirmPaymentReceipt08_2','revertPaymentReceipt08_2','replacePaymentNotice07_2'];
const compiled=Object.fromEntries(names.map(n=>[n,findFn(n)]));
const today=new Date();const past=new Date(today);past.setDate(today.getDate()-8);const dateOf=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dayPast=dateOf(past);const dayToday=dateOf(today);
const bank={id:'b1',bankName:'MB Bank',accountNumber:'123456789',accountHolder:'CHU NHA'};
const baseNotice=(id,roomCode='P101',leaseId='lease_1',totalAmount=1000000)=>({id,noticeCode:id,roomCode,leaseId,periodCode:'Kỳ 09/2026',servicePeriod:'09/2026',nextRentPeriod:'10/2026',dueDate:dayPast,originalDueDate:dayPast,totalAmount,status:'Đang hiệu lực',paymentStatus:'Chưa thu',qrBankSnapshot:{bankName:'MB Bank',accountNumber:'123456789',accountHolder:'CHU NHA',transferContent:id,amount:totalAmount},createdAt:new Date().toISOString()});
function setup(data={}) {
  let notices=data.notices||[baseNotice('N1'),baseNotice('N2','P101','lease_1',1500000)]; let receipts=[]; const events=[];
  const env={Date,Math,Number,String,Set,
    get paymentNotices(){return notices},get paymentReceipts(){return receipts},
    rooms:[{roomCode:'P101',currentTenantName:'A'}],contracts:[{roomCode:'P101',leaseId:'lease_1',tenantName:'A'}],
    settlementSlips:data.settlements||[],bankAccounts:[bank],activeBankAccount:bank,currentUser:{fullName:'Chủ nhà'},
    setPaymentNotices:fn=>{notices=fn(notices)},setPaymentReceipts:fn=>{receipts=fn(receipts)},logSecurity:(...args)=>events.push(args),
    console
  };
  return {fn:n=>vm.runInNewContext(compiled[n],env),notices:()=>notices,receipts:()=>receipts,events};
}
const ids=['N1','N2'];
test('Khôi phục chức năng tạo thông báo thu nợ từ A trong context của B',()=>{
 const e=setup();const r=e.fn('createDebtPaymentNotice')('P101',ids,dayToday,'b1');assert.equal(r.success,true,r.message);
 const created=e.notices().find(n=>n.noticeType==='DEBT');assert.ok(created);assert.equal(created.totalAmount,2500000);assert.deepEqual(Array.from(created.debtNoticeIds),ids);assert.equal(created.qrBankSnapshot.amount,created.totalAmount);
});
test('Chặn kỳ nợ chưa quá hạn và không phát hành QR khác phòng',()=>{
 const e=setup({notices:[{...baseNotice('N1'),dueDate:dayToday,originalDueDate:dayToday}]});assert.equal(e.fn('createDebtPaymentNotice')('P101',['N1'],dayToday).success,false);
 const f=setup();assert.equal(f.fn('createDebtPaymentNotice')('P909',['N1'],dayToday).success,false);
});
test('Không gộp hai lượt thuê và không dùng trùng ID',()=>{
 const e=setup({notices:[baseNotice('N1'),baseNotice('N2','P101','lease_2')]});assert.equal(e.fn('createDebtPaymentNotice')('P101',ids,dayToday).success,false);
 const f=setup();assert.equal(f.fn('createDebtPaymentNotice')('P101',['N1','N1'],dayToday).success,false);
});
test('Đã chọn nợ gốc vào QR nợ gộp thì không lập thêm QR trùng',()=>{
 const e=setup();assert.equal(e.fn('createDebtPaymentNotice')('P101',ids,dayToday).success,true);
 assert.equal(e.fn('createDebtPaymentNotice')('P101',['N1'],dayToday).success,false);
});
test('Chặn phát hành QR trước khi trừ tiền cọc đã sử dụng',()=>{
 const settlement={roomCode:'P101',leaseId:'lease_1',step58Published:true,status:'Hoàn tất',deductions:[{id:'ded_overdue_N1',category:'Công nợ kỳ trước',description:'N1',amount:500000}]};
 const e=setup({settlements:[settlement]});assert.equal(e.fn('createDebtPaymentNotice')('P101',['N1'],dayToday).success,false);
});
test('Xác nhận thu theo thông báo công nợ sẽ tất toán nợ nguồn, không cho thu lần hai',()=>{
 const e=setup();assert.equal(e.fn('createDebtPaymentNotice')('P101',ids,dayToday).success,true);
 const debt=e.notices().find(n=>n.noticeType==='DEBT');
 assert.equal(e.fn('confirmPaymentReceipt08_2')('N1',1000000,dayToday,'tx-original','MB',undefined).success,false);
 const r=e.fn('confirmPaymentReceipt08_2')(debt.id,debt.totalAmount,dayToday,'tx-bundle','MB',undefined);assert.equal(r.success,true,r.message);
 assert.equal(e.notices().filter(n=>n.paymentStatus==='Đã thu').length,3);
 assert.equal(e.receipts().length,1);
 assert.equal(e.fn('confirmPaymentReceipt08_2')(debt.id,debt.totalAmount,dayToday,'tx-bundle2','MB').success,false);
});
test('Hủy xác nhận thu nhầm cần lý do và mở lại đúng nợ nguồn; giữ giao dịch gốc',()=>{
 const e=setup();e.fn('createDebtPaymentNotice')('P101',ids,dayToday);const debt=e.notices().find(n=>n.noticeType==='DEBT');
 e.fn('confirmPaymentReceipt08_2')(debt.id,debt.totalAmount,dayToday,'tx-bundle','MB');const rid=e.receipts()[0].id;
 assert.equal(e.fn('revertPaymentReceipt08_2')(rid,' ').success,false);
 assert.equal(e.fn('revertPaymentReceipt08_2')(rid,'Kiểm tra chuyển khoản nhầm').success,true);
 assert.equal(e.notices().filter(n=>n.paymentStatus==='Chưa thu').length,3);
 assert.equal(e.receipts()[0].status,'Không còn hiệu lực');assert.equal(e.receipts()[0].transactionCode,'tx-bundle');
});
test('Không thay thế thông báo nguồn khi đang chờ thu theo QR gộp',()=>{
 const e=setup();e.fn('createDebtPaymentNotice')('P101',ids,dayToday);
 assert.equal(e.fn('replacePaymentNotice07_2')('N1','đổi nội dung').success,false);
});

test('Nếu cấn trừ cọc sau khi phát hành QR, từ chối xác nhận thu theo QR cũ',()=>{
 const offsets=[];const e=setup({settlements:offsets});
 assert.equal(e.fn('createDebtPaymentNotice')('P101',['N1'],dayToday).success,true);
 const debt=e.notices().find(n=>n.noticeType==='DEBT');
 offsets.push({roomCode:'P101',leaseId:'lease_1',step58Published:true,status:'Hoàn tất',deductions:[{id:'ded_overdue_N1',description:'N1',category:'Công nợ kỳ trước',amount:500000}]});
 assert.equal(e.fn('confirmPaymentReceipt08_2')(debt.id,debt.totalAmount,dayToday,'tx-invalid','MB').success,false);
 assert.equal(e.receipts().length,0);
});
test('Dùng giao diện A nguyên dạng làm giao diện chính, không còn tab ghép A/B',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../src/App.tsx'),'utf8');
 assert.match(app,/<PaymentNoticesView[\s\S]*initialBillId=/);
 assert.match(app,/<PaymentReceiptsView initialNoticeId=/);
 assert.match(app,/<DebtsView onNavigate=/);
 assert.doesNotMatch(app,/PaymentNoticesAView|DebtsAView|setNoticeMode|setDebtMode/);
 const notice=fs.readFileSync(path.join(__dirname,'../src/components/views/PaymentNoticesView.tsx'),'utf8');
 assert.match(notice,/setMainTab\('debt'\)/);
 assert.match(notice,/Lập thông báo thu công nợ/);
 assert.match(notice,/issuePeriodNoticeFromA\(billId, dueDate, selectedBankAccountId\)/);
 const debt=fs.readFileSync(path.join(__dirname,'../src/components/views/DebtsView.tsx'),'utf8');
 assert.match(debt,/grouped_by_room/);
 assert.match(debt,/recordDebtReminder09_2/);
 assert.match(debt,/n\.leaseId === n\.leaseId|c\.leaseId === n\.leaseId/);
 const ctx=fs.readFileSync(path.join(__dirname,'../src/context/AppContext.tsx'),'utf8');
 assert.match(ctx,/findRepresentativeRoomConflict/);
 assert.match(ctx,/reconcileRoomWorkflowLinks/);
 const billing=fs.readFileSync(path.join(__dirname,'../src/components/views/BillingView.tsx'),'utf8');
 assert.match(billing,/onNavigateToNotices\(bill\.id\)/);
});
