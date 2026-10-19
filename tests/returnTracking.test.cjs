const fs = require('fs');
const assert = require('assert');
const root = __dirname + '/../src/components/views/';
const rooms = fs.readFileSync(root + 'RoomsView.tsx', 'utf8');
const contracts = fs.readFileSync(root + 'ContractsView.tsx', 'utf8');
const tracking = fs.readFileSync(root + 'contracts/ContractReturnTracking.tsx', 'utf8');
const app = fs.readFileSync(__dirname + '/../src/App.tsx', 'utf8');
const expiry = fs.readFileSync(root + 'contracts/HDT05ContractExpiry.tsx', 'utf8');
function check(title, ok) { assert.ok(ok, title); console.log('PASS ' + title); }
check('Quản lý phòng không còn tab danh sách hạn hợp đồng', !rooms.includes("subTab === 'expiry'") && !rooms.includes("setSubTab('expiry')"));
check('Quản lý phòng không còn danh sách theo dõi kế hoạch trả', !rooms.includes("subTab === 'plans'") && !rooms.includes("setSubTab('plans')"));
check('Quản lý hợp đồng chứa chức năng theo dõi trả phòng', contracts.includes('<ContractReturnTracking') && contracts.includes('Theo dõi trả phòng'));
check('Theo dõi thời hạn hợp đồng vẫn còn riêng', contracts.includes('<HDT05ContractExpiry') && expiry.includes('ngày hết hạn hợp đồng'));
check('Chi tiết phòng chuyển kèm phòng, hợp đồng, lần thuê', rooms.includes("action: 'return-plans'") && rooms.includes('leaseId: contract.leaseId') && rooms.includes('contractId: contract.id'));
check('Điều hướng toàn app truyền mã lần thuê', app.includes('initialLeaseId={target.leaseId}'));
check('Không tự chọn phòng đầu tiên trên danh sách chuyển tới', !tracking.includes('rooms[0]') && tracking.includes('focusLeaseId'));
check('Không hiển thị phòng trống như khách đang trả', tracking.includes("room.status === 'Trống'") && tracking.includes('room.currentLeaseId'));
check('Ghi ngày trả và phản hồi theo đúng mã lần thuê', tracking.includes('leaseId: selected.contract.leaseId') && tracking.includes('updateExpectedReturnDatePH11_12') && tracking.includes('recordTenantContactPH13'));
check('Kế hoạch trong chi tiết hợp đồng cần hồ sơ hiện hành', contracts.includes('hasCurrentReturnPlan') && contracts.includes("plan.status === 'Còn theo dõi'"));
