# Báo cáo cập nhật: Một người đại diện chỉ được phụ trách một phòng
Ngày cập nhật: 21/10/2026

## Quy tắc áp dụng đồng bộ
- Một người không được đứng tên đại diện hai phòng chưa kết thúc thuê cùng lúc (phòng đã có người, phòng sắp trả, hợp đồng đã ký chờ nhận phòng, hoặc dự thảo hợp đồng phòng khác).
- Xác định trùng theo ID hồ sơ, hoặc CCCD. Khi không đủ CCCD, chỉ sử dụng cặp họ tên + điện thoại để phát hiện nghi trùng, không chặn chỉ vì trùng họ tên.
- Phòng đã xác nhận trả, hợp đồng đã kết thúc/hủy không làm mất quyền đại diện ở một phòng mới. Hợp đồng nối tiếp ở *cùng phòng* vẫn hợp lệ theo quy trình cũ.
- Với hồ sơ đang trùng, không tự ý xóa/chỉnh sửa lịch sử hợp đồng/nhận phòng.

## Các điểm kiểm tra (tại lớp lưu dữ liệu và giao diện)
1. HDT01: Kiểm tra điều kiện và lưu điều kiện thuê (cả hồ sơ đã gắn và khách chưa gắn hồ sơ).
2. HDT02: Lập dự thảo hợp đồng. Nếu người đại diện đã có phòng khác, hiển thị lỗi rõ mã phòng và không tạo dữ liệu.
3. HDT03: Điều chỉnh dự thảo, gửi ký hợp đồng.
4. HDT04: Ghi nhận hợp đồng giấy đã ký; đối chiếu CCCD được nhập khi xác minh.
5. PH05/BG03: Xác nhận nhận phòng.
6. HDT06/HDT07: Lập và kích hoạt hợp đồng nối tiếp.
7. HSKT04: Không được sửa CCCD để trùng với hồ sơ định danh đã tồn tại.
8. Trình chọn khách đại diện ở HDT01/HDT02: vô hiệu hóa hồ sơ đang đại diện phòng khác, ghi rõ phòng đó.

## Kiểm thử
- 19 bộ kiểm thử, 351 kiểm tra đều đạt.
- 40 kiểm tra chuyên biệt quy tắc người đại diện một phòng, bao gồm các phòng P.101, P.909, P.999 và phòng mới; kiểm tra trực tiếp hàm lưu/ký thực tế.
- 50 tệp TypeScript/TSX đã kiểm tra cú pháp, không có lỗi cú pháp.
- Không xác nhận build ứng dụng hoàn chỉnh vì môi trường không có đủ thư viện npm/Vite.

## Lưu ý
- Quy tắc mới ngăn tạo dữ liệu trùng về sau; hồ sơ lưu sẵn bị trùng (nếu có) vẫn cần chủ nhà đối chiếu thủ công, không xóa tự động.
- Hệ thống hiện chạy localStorage trên trình duyệt, không cung cấp khóa giao dịch nhiều người dùng trong một máy chủ riêng.
