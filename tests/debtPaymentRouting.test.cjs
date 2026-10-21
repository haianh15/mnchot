const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let ts; try { ts=require('typescript'); } catch { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const assert=require('node:assert/strict');const {test}=require('node:test');
const src=fs.readFileSync(path.join(__dirname,'../src/utils/debtPaymentRouting.ts'),'utf8');
const compiled=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const moduleBox={exports:{}};
vm.runInNewContext(compiled,{module:moduleBox,exports:moduleBox.exports,Date,Set,String});
const {resolveDebtPaymentRoute: route}=moduleBox.exports;
const period=(id,roomCode='P101',leaseId='L1')=>({id,roomCode,leaseId,noticeType:'PERIOD',status:'Đang hiệu lực',paymentStatus:'Chưa thu',originalDueDate:'2026-01-03',dueDate:'2026-01-05'});
const bundle=(id,ids,roomCode='P101',leaseId='L1')=>({...period(id,roomCode,leaseId),noticeType:'DEBT',debtNoticeIds:ids});
test('Khoản nợ đã có thông báo gộp → Chi tiết Thu công nợ, không tạo QR trùng',()=>{
 const r=route([period('n1'),period('n2'),bundle('d1',['n1','n2'])],'P101','L1',['n1']);
 assert.equal(r.mode,'detail');assert.equal(r.noticeId,'d1');
});
test('Nhiều kỳ cùng thông báo gộp → mở đúng một chi tiết',()=>{
 const r=route([period('n1'),period('n2'),bundle('d1',['n1','n2'])],'P101','L1',['n1','n2']);
 assert.equal(r.noticeId,'d1');
});
test('Chưa có thông báo → lập thông báo từ các kỳ nợ gốc của cùng lượt thuê',()=>{
 const r=route([period('n1'),period('n2')],'P101','L1',['n1','n2','n1']);
 assert.equal(r.mode,'create');assert.deepEqual(Array.from(r.sourceNoticeIds),['n1','n2']);
});
test('Không gom khi một kỳ đã có thông báo còn kỳ kia chưa có',()=>{
 const r=route([period('n1'),period('n2'),bundle('d1',['n1'])],'P101','L1',['n1','n2']);
 assert.equal(r.mode,'split');
});
test('Không gom nhiều thông báo thu công nợ khác nhau',()=>{
 const r=route([period('n1'),period('n2'),bundle('d1',['n1']),bundle('d2',['n2'])],'P101','L1',['n1','n2']);
 assert.equal(r.mode,'split');
});
test('Không chuyển nợ qua phòng hoặc lượt thuê khác',()=>{
 for(const n of [period('n1','P909','L1'),period('n1','P101','L-OLD')]){
  assert.equal(route([n],'P101','L1',['n1']).mode,'unavailable');
 }
});
test('Không thanh toán khoản đã thu hoặc không còn hiệu lực',()=>{
 assert.equal(route([{...period('n1'),paymentStatus:'Đã thu'}],'P101','L1',['n1']).mode,'unavailable');
 assert.equal(route([{...period('n1'),status:'Đã thay thế'}],'P101','L1',['n1']).mode,'unavailable');
});
test('Không lập thông báo thu công nợ cho khoản chưa quá hạn',()=>{
 assert.equal(route([{...period('n1'),originalDueDate:'2999-01-01'}],'P101','L1',['n1']).mode,'unavailable');
});
test('Thông báo gộp đã thu hoặc bị thay thế không được điều hướng thu trùng',()=>{
 const r=route([period('n1'),{...bundle('d1',['n1']),paymentStatus:'Đã thu'}],'P101','L1',['n1']);
 assert.equal(r.mode,'unavailable'); // Nguồn còn nợ nhưng thông báo gộp đã thu: cần đối chiếu trước
});
test('Công nợ không có nút Thanh toán; lịch sử nhắc vẫn mở thông báo thu công nợ chính thức',()=>{
 const read=p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8');
 const d=read('components/views/DebtsView.tsx'),n=read('components/views/PaymentNoticesView.tsx'),a=read('App.tsx');
 assert.doesNotMatch(d,/onClick=\{\(\) => openDebtPayment\(/);
 assert.doesNotMatch(d,/Thanh toán tại Thông báo thu công nợ/);
 assert.match(d,/openSavedReminderPayment/);
 assert.match(d,/onNavigate\?\.\('notices', \{ noticeId: historyQrDetails\.officialNoticeId \}\)/);
 assert.match(d,/onNavigate\('notices', \{ noticeId: route\.noticeId \}\)/);
 assert.match(n,/setMainTab\('debt'\)/);
 assert.match(n,/setDebtWizardStep\(2\)/);
 assert.match(n,/setPendingOpenNoticeId\(res\.noticeId\)/);
 assert.match(a,/initialDebtRequest=\{target\.debtSourceNoticeIds/);
});
test('B dùng cùng chứng từ thu và cập nhật đồng thời thông báo gộp và kỳ gốc',()=>{
 const ctx=fs.readFileSync(path.join(__dirname,'../src/context/AppContext.tsx'),'utf8');
 assert.match(ctx,/n\.id === noticeId \|\| belongsToDebtCollection \? \{\.\.\.n, paymentStatus: 'Đã thu'/);
 assert.match(ctx,/if \(n\.id !== receipt\.noticeId && !belongsToDebtCollection\) return n/);
 assert.match(ctx,/new Set\(sources\.map\(n => n\.leaseId\)\)\.size !== 1/);
});
