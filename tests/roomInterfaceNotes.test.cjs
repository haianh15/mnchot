const assert = require('node:assert/strict');
const fs = require('node:fs');
const rooms = fs.readFileSync('src/components/views/RoomsView.tsx', 'utf8');
const contracts = fs.readFileSync('src/components/views/ContractsView.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const checks = [
  ['Không hiện banner đối chiếu hồ sơ ở đầu Quản lý phòng', !rooms.includes('phòng đang thuê/sắp trả cần đối chiếu hồ sơ nhận phòng:')],
  ['Không hiện banner nút bổ sung hồ sơ demo', !rooms.includes('Bổ sung hồ sơ DEMO') && !rooms.includes('phòng mẫu cần bổ sung hồ sơ demo')],
  ['Không hiện nhãn hồ sơ demo trong bảng phòng', !rooms.includes('Hồ sơ DEMO · không phải biên bản thật')],
  ['Cọc và thuê đầu dùng nhãn giống P.101', (rooms.match(/verifiedPayment \? 'Đã đối chiếu' : 'Chưa xác nhận'/g)||[]).length === 2],
  ['Không còn nhãn Tình trạng quyết toán cọc cạnh dropdown', !contracts.includes('>Tình trạng quyết toán cọc</label>')],
  ['Bộ lọc hợp đồng vẫn hoạt động', contracts.includes('onChange={e=>setSettlementFilter(e.target.value')],
  ['Không hiện cảnh báo chạy thử ở trang chính', !app.includes('Bản chạy thử: dữ liệu hiện lưu trên trình duyệt')],
  ['Giữ kiểm soát nghiệp vụ ở tầng dữ liệu', fs.readFileSync('src/context/AppContext.tsx', 'utf8').includes('auditOccupiedRoom(room, contracts, tenants, initialPaymentRecords, handoverReports)')]
];
for (const [label, ok] of checks) { assert.ok(ok, label); console.log('PASS', label); }
console.log(`UI cleanup: ${checks.length}/${checks.length} checks passed.`);
