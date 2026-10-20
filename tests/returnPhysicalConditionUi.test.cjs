const fs = require('fs');
const assert = require('assert');
const src = fs.readFileSync('src/components/views/HandoverAssetsView.tsx', 'utf8');
assert(src.includes('<option value="" disabled>Chọn tình trạng</option>'), 'Phải hiển thị lựa chọn chưa chọn thật sự');
assert(src.includes('!item.condition?.trim()'), 'Phải kiểm tra tình trạng còn thiếu');
assert(src.includes('returnMissingFields.push(`${item.name}: chưa chọn tình trạng vật lý.`)'), 'Phải báo tên tài sản còn thiếu');
assert(src.includes('bg09Items.length > 0 && bg09Items.every(i =>'), 'Không được báo hoàn tất khi thiếu dữ liệu kiểm kê');
assert(src.includes('returnMissingFields.map((reason, i)'), 'Phải liệt kê cụ thể lý do khóa xác nhận');
console.log('PASS: Trường tình trạng vật lý không được tự hiển thị như đã chọn, có thông báo thiếu dữ liệu.');
