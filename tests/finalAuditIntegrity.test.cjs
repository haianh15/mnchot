// Final acceptance regression checks for financial and meter-source integrity.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), 'utf8');
const ast = ts.createSourceFile('AppContext.tsx', src, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
function extract(name) {
  let initializer;
  const scan = n => { if(ts.isVariableDeclaration(n) && n.name.getText(ast)===name) initializer=n.initializer; ts.forEachChild(n,scan); };
  scan(ast); assert.ok(initializer, 'Missing '+name);
  const out = ts.transpileModule('const action = '+initializer.getText(ast)+';', { compilerOptions:{ target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.None }}).outputText;
  return '(() => { ' + out + '\nreturn action; })()';
}
const funcs = Object.fromEntries(['createDebtPaymentNotice','confirmPaymentReceipt08_2','revertPaymentReceipt08_2','updateMeterReadingTT02','recordDebtPromise09_3','updateNoticeDueDate','confirmPeriodBillTT03'].map(x=>[x,extract(x)]));
const iso = d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=iso(new Date()); const pastDate = new Date();pastDate.setDate(pastDate.getDate()-9); const past=iso(pastDate);
const account={id:'b1',status:'Đang sử dụng',bankName:'MB',accountNumber:'123',accountHolder:'Chủ nhà'};
const source={id:'orig1',noticeCode:'TB1',noticeType:undefined,roomCode:'P.101',leaseId:'L1',periodCode:'Kỳ 09/2026',dueDate:past,originalDueDate:past,status:'Đang hiệu lực',paymentStatus:'Chưa thu',totalAmount:1200000,qrBankSnapshot:{bankName:'MB',accountNumber:'123',accountHolder:'Chủ nhà',transferContent:'P101 09',amount:1200000}};
function env(data={}) {
  let notices = data.notices || [structuredClone(source)]; let receipts=[];let promises=[];let meterReadings=data.meterReadings || [];let bills=data.periodBills||[];const events=[];
  const vars={ Date,Math,Number,String,Set,Array,
    get paymentNotices(){return notices},get paymentReceipts(){return receipts},get debtPromises(){return promises},
    get meterReadings(){return meterReadings},get periodBills(){return bills},
    rooms:[{roomCode:'P.101',currentTenantName:'Trần A'}], contracts:[{roomCode:'P.101',leaseId:'L1',tenantName:'Trần A'}],
    settlementSlips:[], bankAccounts:data.bankAccounts || [account],activeBankAccount:data.activeBankAccount===undefined?account:data.activeBankAccount,currentUser:{fullName:'Chủ nhà'},
    setPaymentNotices:f=>notices=f(notices),setPaymentReceipts:f=>receipts=f(receipts),setDebtPromises:f=>promises=f(promises),
    setMeterReadings:f=>meterReadings=f(meterReadings),setPeriodBills:f=>bills=f(bills),logSecurity:(...args)=>events.push(args)
  };
  return {call:(name,...args)=>vm.runInNewContext(funcs[name],vars)(...args),notices:()=>notices,receipts:()=>receipts,promises:()=>promises,readings:()=>meterReadings,bills:()=>bills};
}
test('Invalid calendar dates and inactive accounts cannot produce a debt QR',()=>{
  const e=env();
  assert.equal(e.call('createDebtPaymentNotice','P.101',['orig1'],'2026-02-30').success,false);
  const f=env({bankAccounts:[{...account,status:'Lịch sử'}],activeBankAccount:{...account,status:'Lịch sử'}});
  assert.equal(f.call('createDebtPaymentNotice','P.101',['orig1'],today,'b1').success,false);
  assert.equal(e.call('createDebtPaymentNotice','P.101',['orig1'],today,'b1').success,true);
});
test('A receipt needs actual date/account/transaction and cannot reuse padded bank reference',()=>{
  const e=env();
  assert.equal(e.call('confirmPaymentReceipt08_2','orig1',1200000,today,' ','MB').success,false);
  assert.equal(e.call('confirmPaymentReceipt08_2','orig1',1200000,'2026-02-30','tx-01','MB').success,false);
  assert.equal(e.call('confirmPaymentReceipt08_2','orig1',1200000,today,'tx-01',' ').success,false);
  assert.equal(e.call('confirmPaymentReceipt08_2','orig1',1200000,today,' tx-01 ','MB').success,true);
  assert.equal(e.receipts()[0].transactionCode,'tx-01');
  // Receipt status changed from unpaid to paid; an attempted second collection fails.
  assert.equal(e.call('confirmPaymentReceipt08_2','orig1',1200000,today,'tx-02','MB').success,false);
  assert.equal(e.receipts().length,1);
});
test('Undo recorded only once; original notice and receipt history remain linked',()=>{
  const e=env();e.call('confirmPaymentReceipt08_2','orig1',1200000,today,'tx-R','MB');
  const id=e.receipts()[0].id;
  assert.equal(e.call('revertPaymentReceipt08_2',id,'nhầm giao dịch').success,true);
  assert.equal(e.call('revertPaymentReceipt08_2',id,'lặp thao tác').success,false);
  assert.equal(e.receipts()[0].auditHistory.length,2);
  assert.equal(e.notices()[0].paymentStatus,'Chưa thu');
});
test('Debt promises cannot be logged on another lease/paid notice and have unique IDs',()=>{
  const e=env();
  const p={noticeId:'orig1',roomCode:'P.101',leaseId:'L1',contactTime:today,channel:'điện thoại',content:'Khách hẹn 2 ngày',hasPromiseDate:false};
  assert.equal(e.call('recordDebtPromise09_3',{...p,roomCode:'P.909'}).success,false);
  assert.equal(e.call('recordDebtPromise09_3',p).success,true);
  assert.equal(e.call('recordDebtPromise09_3',p).success,true);
  assert.notEqual(e.promises()[0].id,e.promises()[1].id);
  e.call('confirmPaymentReceipt08_2','orig1',1200000,today,'tx-P','MB');
  assert.equal(e.call('recordDebtPromise09_3',p).success,false);
});
test('Changing a debt promise date cannot turn invalid day into a payment deadline',()=>{
  const e=env();
  assert.equal(e.call('updateNoticeDueDate','orig1','2026-02-30').success,false);
  assert.equal(e.notices()[0].dueDate,past);
  assert.equal(e.call('updateNoticeDueDate','orig1',today).success,true);
  assert.equal(e.notices()[0].originalDueDate,past);
});
test('Meter edits reject confirmed bills, altered lease and backwards/invalid counters',()=>{
  const reading={id:'mr01',roomCode:'P.101',leaseId:'L1',periodCode:'Kỳ 09/2026',status:'Đã xác nhận',initialElectricKwh:100,finalElectricKwh:140,initialWaterM3:20,finalWaterM3:25};
  const blocked=env({meterReadings:[reading],periodBills:[{id:'bill1',roomCode:'P.101',leaseId:'L1',periodCode:'Kỳ 09/2026',isConfirmed:true}]});
  assert.equal(blocked.call('updateMeterReadingTT02','mr01',{finalElectricKwh:150},'đo lại').success,false);
  assert.equal(blocked.readings()[0].finalElectricKwh,140);
  const e=env({meterReadings:[reading]});
  assert.equal(e.call('updateMeterReadingTT02','mr01',{leaseId:'DIFFERENT'},'đổi nhầm').success,false);
  assert.equal(e.call('updateMeterReadingTT02','mr01',{finalElectricKwh:99},'chốt lại').success,false);
  assert.equal(e.call('updateMeterReadingTT02','mr01',{finalElectricKwh:160,finalWaterM3:30},'đo kiểm').success,true);
  assert.equal(e.readings()[0].status,'Nháp – điều chỉnh');
  assert.equal(e.readings()[0].needsRecalculateFlag,true);
});
test('A confirmed bill cannot be confirmed again',()=>{
 const reading={id:'mr01',roomCode:'P.101',leaseId:'L1',periodCode:'Kỳ 09/2026',status:'Đã xác nhận'};
 const e=env({meterReadings:[reading],periodBills:[{id:'b01',roomCode:'P.101',leaseId:'L1',periodCode:'Kỳ 09/2026',isConfirmed:true}]});
 assert.equal(e.call('confirmPeriodBillTT03','b01').success,false);
});
