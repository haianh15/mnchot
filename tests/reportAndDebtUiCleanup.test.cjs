const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=(p)=>fs.readFileSync(path.join(__dirname,'../src/components/views',p),'utf8');
const debt=read('DebtsView.tsx'), report=read('ReportsView.tsx');
test('Công nợ không còn nút thanh toán ở mọi loại danh sách',()=>{
 assert.doesNotMatch(debt,/onClick=\{\(\) => openDebtPayment\(/);
 assert.doesNotMatch(debt,/Thanh toán tại Thông báo thu công nợ/);
 assert.match(debt,/openReminderModal\(/);
 assert.match(debt,/openSavedReminderPayment/);
 assert.match(debt,/setHistoryQrModalReminder\(null\); onNavigate\?\.\('notices', \{ noticeId: historyQrDetails\.officialNoticeId \}\)/);
});
test('Báo cáo chỉ dùng tên khoản thu dễ đọc, không in mã use case',()=>{
 for(const label of ['Tiền thuê kỳ đầu','Tiền thuê kỳ tiếp theo','Điện nước & dịch vụ']) assert.match(report,new RegExp(`sourceType: '${label}'`));
 assert.doesNotMatch(report, /sourceType:\s*'PH-07|sourceType:\s*'UC08\.2/);
 assert.doesNotMatch(report, /p\.transactionCode\s*\|\|\s*'PH07-/);
 assert.doesNotMatch(report, /Lập báo cáo tổng hợp \(BC-04\)/);
 assert.doesNotMatch(report, /Sang BC-04/);
});
test('Báo cáo và xuất CSV không hiển thị khoản nợ bù cọc; số dư vẫn tính đúng',()=>{
 assert.doesNotMatch(report, /Khoản nợ bù cọc:|3\. Khoản nợ bù cọc|Nợ đã khấu trừ bù cọc:/);
 assert.doesNotMatch(report, /Bù cọc \(đ\)|<th[^>]*>Bù cọc<\/th>|\$\{f\.handledByDeposit\}/);
 assert.match(report,/totalReceivableGross - totalCollectedBank - totalHandledByDeposit/);
 assert.match(report,/totalHandledByDeposit: totalHandledByDeposit/); // still retained in stored snapshot
 assert.match(report,/Nguồn thu,Mã thông báo\/GD/);
});
