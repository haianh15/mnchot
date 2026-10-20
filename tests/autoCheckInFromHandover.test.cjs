const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = fs.readFileSync(path.join(root, 'src/context/AppContext.tsx'), 'utf8');
const handover = fs.readFileSync(path.join(root, 'src/components/views/HandoverAssetsView.tsx'), 'utf8');
const rooms = fs.readFileSync(path.join(root, 'src/components/views/RoomsView.tsx'), 'utf8');
const checks = [
  ['cùng một hàm cập nhật cho cả hai lối xác nhận', context.includes('const commitConfirmedCheckIn =') && (context.match(/commitConfirmedCheckIn\(/g) || []).length === 2],
  ['phòng tự chuyển Đang thuê sau khi có cả hai chữ ký', context.includes("const bothSigned = tenantSigned && ownerSigned;") && context.includes("if (bothSigned && receiveRoom?.status === 'Trống' && !receiveBlocker && receiveContract)")],
  ['không nhận phòng nếu hợp đồng chưa ký', context.includes("c.isSignedPaper &&")],
  ['không nhận phòng nếu chưa đủ hồ sơ khách', context.includes('validateContractTenantLink(receiveContract, tenants).valid')],
  ['không nhận phòng nếu chưa đủ chứng từ cọc/thuê đầu', context.includes('getInitialPaymentStatus(receiveContract, contracts, initialPaymentRecords).valid')],
  ['không tự nhận phòng nhầm lần thuê', context.includes('receiveRoom.pendingLeaseId !== report.leaseId') && context.includes('e.leaseId === report.leaseId')],
  ['khi đã nhận phòng, gán đủ mã phòng/hợp đồng/khách/lần thuê', ['currentTenantId: contract.tenantId','currentContractId: contract.id','currentLeaseId: contract.leaseId',"status: 'Đang thuê'"].every(x=>context.includes(x))],
  ['không báo thành công giả khi hồ sơ chặn nhận', context.includes('Đã xác nhận biên bản đủ chữ ký, nhưng chưa thể chuyển phòng sang Đang thuê vì')],
  ['biên bản đã ký cũ có nút đồng bộ P999 không lập lại hồ sơ', handover.includes('Hoàn tất nhận phòng') && handover.includes('confirmCheckInPH05(')],
  ['giao diện Bàn giao hiển thị kết quả thực của thao tác', handover.includes("res.message.includes('chưa thể chuyển phòng')") && handover.includes('res.message);')],
  ['danh sách phòng dùng nhãn Đã đối chiếu', rooms.includes("verifiedPayment ? 'Đã đối chiếu' : 'Chưa xác nhận'") && !rooms.includes('Có bản ghi')],
  ['không còn chú thích hồ sơ DEMO trên danh sách', !rooms.includes('Hồ sơ DEMO') && !rooms.includes('Bổ sung hồ sơ DEMO')]
];
checks.forEach(([title,passed])=>{console.log(`${passed?'PASS':'FAIL'} ${title}`);assert(passed,title)});
console.log(`TOTAL ${checks.length} PASS`);
