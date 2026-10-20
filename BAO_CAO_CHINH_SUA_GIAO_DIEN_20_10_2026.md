# Báo cáo chỉnh sửa giao diện trên bản người dùng gửi

## Phạm vi
- Nguồn: file `CCMN_MNCHOT_BO_SUNG_DAY_DU_HO_SO_DEMO_PHONG_DANG_THUE_FULL (1)(1).zip`.
- `src/App.tsx`: bỏ banner vàng toàn cục “Bản chạy thử...”.
- `src/components/views/RoomsView.tsx`: bỏ banner “phòng đang thuê/sắp trả cần đối chiếu”, bỏ khối “phòng mẫu cần bổ sung hồ sơ demo”, bỏ nút “Bổ sung hồ sơ DEMO”, bỏ nhãn “Hồ sơ DEMO” và chỉ báo cảnh báo ở dòng danh sách. Mẫu giao dịch được hiển thị là “Có bản ghi” (trung tính), không hiển thị sai là đã đối chiếu giao dịch có thật.
- `src/components/views/ContractsView.tsx`: bỏ nhãn “Tình trạng quyết toán cọc”, giữ dropdown và 2 lựa chọn; có `aria-label` hỗ trợ truy cập.
- `tests/occupiedRoomReadiness.test.cjs`: sửa kiểm tra giao diện vốn cố định chuỗi cảnh báo cũ; giữ nguyên mọi kiểm tra nghiệp vụ.
- Thêm `tests/uiCleanup.test.cjs`: kiểm tra những thay đổi hiển thị theo yêu cầu.

## Không thay đổi
- Không xóa dữ liệu mẫu hoặc bản ghi chứng từ đang lưu.
- Không thay đổi luật hợp đồng, kiểm kê tài sản, tiền cọc, trạng thái phòng, luồng xác nhận nhận/trả phòng.
- Cảnh báo thiếu hồ sơ **bên trong Chi tiết phòng** vẫn được giữ để người quản lý không vô tình coi chứng từ chưa hợp lệ là đã xác nhận.

## Lưu ý
- Hồ sơ và chứng từ giả lập vẫn chỉ để thử nghiệm, không có giá trị chứng minh giao dịch hoặc chữ ký.
- Hệ thống chưa có backend và cơ chế lưu trữ bảo mật cho dữ liệu thật.
