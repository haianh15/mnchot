# Điều chỉnh thao tác phòng Trống khi hợp đồng đã ký – 21/10/2026

- Phòng chưa có hợp đồng giấy đã ký: nút chính **Lập hợp đồng**, vào quản lý hợp đồng mới.
- Phòng đã có hợp đồng giấy đã ký nhưng chưa nhận phòng: nút chính **Lập biên bản nhận phòng**, vào Bàn giao của **đúng mã phòng / mã hợp đồng / mã lần thuê**.
- Khi đã có biên bản xác nhận đủ hai chữ ký nhưng vẫn chưa hoàn tất bước ghi nhận nhận phòng: nút chính **Xác nhận nhận phòng**, mở cùng hồ sơ bàn giao.
- Giữ liên kết **Xem hợp đồng đã ký** tại chi tiết phòng và kiểm tra khả năng cho thuê.
- Không tự chuyển phòng sang Đang thuê chỉ vì hợp đồng đã ký hoặc biên bản đang nháp/đã lập. Trạng thái phòng chỉ chuyển Đang thuê khi luồng xác nhận nhận phòng thành công.

Áp dụng tại: Danh sách Quản lý phòng, Chi tiết phòng (thông tin bàn giao), và Kiểm tra khả năng cho thuê.

Bộ kiểm tra mới: `node tests/vacantRoomNextStep.test.cjs` (7 trường hợp). Các bộ kiểm tra hồi quy của dự án hiện chạy đạt bằng Node.js. Chưa xác nhận được build toàn ứng dụng do môi trường chưa hoàn tất cài thư viện npm.
