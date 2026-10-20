const assert = require('node:assert/strict');
const fs = require('node:fs');
const rooms = fs.readFileSync('src/components/views/RoomsView.tsx', 'utf8');
const contracts = fs.readFileSync('src/components/views/ContractsView.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const checks = [
  ['Bỏ banner phòng cần đối chiếu ở đầu Danh sách phòng', !rooms.includes('roomsNeedingReconciliation')],
  ['Bỏ banner bổ sung hồ sơ DEMO', !rooms.includes('demoMissingRooms') && !rooms.includes('handleCompleteDemo')],
  ['Bỏ nhãn hồ sơ DEMO trong bảng phòng', !rooms.includes('Hồ sơ DEMO')],
  ['Bỏ nhãn demo ở các cột thanh toán', !rooms.includes('DEMO - giả lập')],
  ['Giữ các bản ghi mẫu phân biệt với chứng từ đối chiếu thực', rooms.includes('isSamplePayment') && rooms.includes('Có bản ghi')],
  ['Bỏ cảnh báo tổng quát dạng banner đầu trang', !app.includes('Bản chạy thử: dữ liệu hiện lưu trên trình duyệt')],
  ['Bỏ nhãn tình trạng quyết toán cạnh dropdown', !contracts.includes('<label htmlFor="settlement-contract-filter"')],
  ['Giữ bộ lọc quyết toán hai lựa chọn', contracts.includes('<option value="all">Tất cả hợp đồng</option>') && contracts.includes('<option value="pending">Cần hoàn tất quyết toán cọc</option>')],
  ['Bộ lọc có nhãn hỗ trợ truy cập', contracts.includes('aria-label="Lọc danh sách hợp đồng"')],
  ['Giữ kiểm tra hồ sơ chi tiết khi nguồn thiếu', rooms.includes('selectedRoomAudit?.missing.map(')],
];
checks.forEach(([label, good]) => { assert(good, label); console.log('PASS ' + label); });
console.log('UI cleanup: ' + checks.length + '/' + checks.length + ' passed');
