const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTs } = require('./loadTs.cjs');
const { getReturnInspectionReadinessIssues } = loadTs('src/utils/handoverValidation.ts');
const valid = {
  items: [
    { name: 'Chìa khóa', inspected: true, quantity: 2, condition: 'Bình thường' },
    { name: 'Tủ lạnh', inspected: true, quantity: 1, condition: 'Bình thường' }
  ],
  finalElectricityKwh: 0,
  finalWaterM3: 0,
  evidence: 'Đã nhận đủ chìa khóa, phòng còn nguyên hiện trạng',
  validContractLease: true
};
const issues = changes => getReturnInspectionReadinessIssues({...valid, ...changes});
test('Tất cả tài sản kiểm tra đầy đủ, bằng chứng và chỉ số điện nước đều hợp lệ -> được lưu', () => {
  assert.deepEqual(issues({}), []);
});
test('Một dòng chưa kiểm tra -> hiện rõ tên tài sản bị thiếu', () => {
  assert.match(issues({items:[{...valid.items[0], inspected:false}, valid.items[1]]}).join(' '), /Chìa khóa/);
});
test('Tài sản kiểm tra đủ nhưng thiếu bằng chứng -> nêu rõ thiếu bằng chứng thay vì báo kiểm tra thiếu', () => {
  const result = issues({evidence:'   '});
  assert.equal(result.length, 1);
  assert.match(result[0], /mô tả bằng chứng/);
});
test('Thiếu số điện cuối kỳ báo riêng, số điện bằng 0 không bị báo thiếu', () => {
  assert.match(issues({finalElectricityKwh:''}).join(' '), /điện cuối kỳ/);
  assert.equal(issues({finalElectricityKwh:0}).length, 0);
});
test('Thiếu số nước cuối kỳ báo riêng', () => {
  assert.match(issues({finalWaterM3:''}).join(' '), /nước cuối kỳ/);
});
test('Số lượng âm và tình trạng rỗng báo riêng', () => {
  const result = issues({items:[{...valid.items[0], quantity:-1, condition:'  '},valid.items[1]]});
  assert.equal(result.length, 2);
  assert.match(result.join(' '), /Số lượng thực tế/);
  assert.match(result.join(' '), /tình trạng vật lý/);
  assert.match(result.join(' '), /Chìa khóa/);
});
test('Đã kiểm tra đủ nhưng liên kết hợp đồng thiếu không báo sai là thiếu tài sản', () => {
  const result = issues({validContractLease:false});
  assert.equal(result.length, 1);
  assert.match(result[0], /Hợp đồng đã ký/);
});
test('Màn hình nhận lại hiển thị danh sách thiếu và dùng chung logic với nút lưu', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/views/HandoverAssetsView.tsx'),'utf8');
  assert.match(source,/const canSaveOfficially304 = missingReturnRequirements.length === 0/);
  assert.match(source,/missingReturnRequirements\.map/);
  assert.match(source,/Chưa thể lưu kết quả: \$\{missingReturnRequirements\.join/);
  assert.doesNotMatch(source,/Bảng chưa kiểm tra đầy đủ hoặc thiếu mô tả chứng cứ nhận lại\. Vui lòng kiểm tra lại/);
});

test('Dữ liệu cũ: Đã kiểm tra nhưng condition rỗng phải báo rõ tên, không được ngầm xem là Bình thường', () => {
  const legacy = { ...valid.items[0], condition: '' };
  const result = issues({items: [legacy, valid.items[1]]});
  assert.equal(result.length, 1);
  assert.match(result[0], /Chìa khóa/);
  assert.match(result[0], /1 tài sản/);
});
test('Giao diện phải có trạng thái Chưa chọn, không hiển thị nhầm Bình thường khi condition rỗng', () => {
  const view = fs.readFileSync(path.join(__dirname, '../src/components/views/HandoverAssetsView.tsx'),'utf8');
  assert.match(view, /value=\{item\.condition \?\? ''\}/);
  assert.match(view, /<option value="">-- Chọn tình trạng --<\/option>/);
  assert.match(view, /Xác nhận các tài sản thiếu đều Bình thường/);
  assert.match(view, /item\.inspected && !item\.condition\?\.trim\(\)/);
});
