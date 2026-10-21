const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.join(__dirname,'../src');
const debt = fs.readFileSync(path.join(root,'components/views/DebtsView.tsx'),'utf8');
const notices = fs.readFileSync(path.join(root,'components/views/PaymentNoticesView.tsx'),'utf8');
const app = fs.readFileSync(path.join(root,'App.tsx'),'utf8');

test('Lưu lịch sử nhắc nợ gọi trực tiếp luồng mở chi tiết Thu công nợ',()=>{
 const handler = debt.slice(debt.indexOf('const handleSaveReminder ='),debt.indexOf('// Đóng form nhắc nợ và đặt lại trạng thái'));
 assert.match(handler,/recordDebtReminder09_2\(/);
 assert.match(handler,/if \(!lastResult\.success\)/);
 assert.match(handler,/handleCloseReminderModal\(\);\s*openDebtPayment\(targetItems\);/);
 assert.doesNotMatch(handler,/setRemSavedSuccess|setSavedReminderDetails/);
 assert.match(debt,/Lưu lịch sử nhắc & mở mã QR/);
});
test('Không dùng QR riêng hoặc modal sau lưu trong Công nợ',()=>{
 const modal=debt.slice(debt.indexOf('{showReminderModal && activeSelectedDebt'),debt.indexOf('{showPromiseModal && activeSelectedDebt'));
 assert.doesNotMatch(modal,/remSavedSuccess|Mã VietQR của thông báo thu công nợ đang hiệu lực|VietQR_No_Phong_/);
 assert.match(modal,/onSubmit=\{handleSaveReminder\}/);
});
test('Xem QR từ lịch sử nhắc nợ chuyển đến màn hình Thông báo thanh toán',()=>{
 assert.match(debt,/onClick=\{\(\) => openSavedReminderPayment\(r\)\}/);
 assert.match(debt,/Mở chi tiết Thu công nợ/);
 const fn=debt.slice(debt.indexOf('const openSavedReminderPayment ='),debt.indexOf('// Danh sách các kỳ công nợ QUÁ HẠN'));
 assert.match(fn,/n\.roomCode === reminder\.roomCode && n\.leaseId === reminder\.leaseId/);
 assert.match(fn,/n\.debtNoticeIds\?\.includes\(reminder\.noticeId\)/);
 assert.match(fn,/onNavigate\?\.\('notices', \{ noticeId: payable\[0\]\.id \}\)/);
 assert.match(fn,/openDebtPayment\(\[item\]\)/);
 assert.doesNotMatch(fn,/historyQrModalReminder|setHistoryQrModalReminder/);
});
test('Nếu chưa có thông báo, sử dụng bước tạo rồi tự mở chi tiết chính thức',()=>{
 assert.match(debt,/onNavigate\('notices', \{ roomCode: route\.roomCode, leaseId: route\.leaseId, debtSourceNoticeIds: route\.sourceNoticeIds \}\)/);
 assert.match(notices,/setDebtWizardStep\(2\)/);
 assert.match(notices,/setPendingOpenNoticeId\(res\.noticeId\)/);
 assert.match(notices,/setActiveView\('detail'\)/);
 assert.match(app,/initialDebtRequest=\{target\.debtSourceNoticeIds/);
});
test('Không hiển thị QR cũ khi đã thu hoặc thông báo đã thay thế',()=>{
 assert.match(notices,/selectedNotice\.status !== 'Đang hiệu lực' \|\| selectedNotice\.paymentStatus === 'Đã thu'/);
 assert.match(debt,/n\.status === 'Đang hiệu lực' && n\.paymentStatus === 'Chưa thu'/);
});
