# Cập nhật Quản lý phòng – Bàn giao / Phiếu trả phòng

## Nguồn
Xuất phát từ bản `CCMN_MNCHOT_HOAN_THIEN_GHI_CHI_SO_DIEN_NUOC_20_10_FULL.zip` (79 tệp), bảo toàn phần Ghi chỉ số điện nước mới nhất.

## Đã sửa
1. **Quản lý phòng:** Xóa nút “Chưa BG” trên danh sách, xóa thao tác “Ghi nhận chưa bàn giao xong” ở Chi tiết phòng, xóa toàn bộ form nhập riêng. Không xóa nhật ký cũ đã tồn tại trong dữ liệu để tránh mất hồ sơ cũ.
2. **Luồng trả phòng:** Khi chưa xác nhận nhận lại phòng, nút thao tác mở đúng **Bàn giao trả phòng** để kiểm kê/chụp chứng cứ/ghi nhận kết quả thực tế. Không cho mở form tạo phiếu trả từ điểm vào này.
3. **Điều kiện lập phiếu:** Chỉ mở/lưu phiếu trả phòng khi đúng phòng–hợp đồng–lần thuê, có **biên bản nhận phòng đã xác nhận**, kết quả kiểm tra trả phòng đã lưu chính thức, tài sản đã kiểm tra đủ, kết quả là **Đã nhận lại**, và **Chủ nhà đã xác nhận**. Phiếu mới lưu ở trạng thái **Nháp**, không tự coi là bản ký thật.
4. **Hàm lưu `initHandoverReturnReportDraftBG08`:** kiểm tra điều kiện nói trên trước khi tạo phiếu, chặn lập sớm dù gọi hàm trực tiếp; không lập trùng phiếu cho một lần thuê.
5. **Hoàn tất trả phòng:** Nút đưa phòng về Trống yêu cầu đã xác nhận bàn giao và có phiếu trả phòng liên kết đúng mã phòng, hợp đồng, lần thuê. Giữ quyết toán cọc là quy trình riêng trong Chi tiết hợp đồng.
6. **Thông báo trên giao diện:** không còn dẫn sang form “chưa bàn giao”; khi chưa đủ điều kiện chỉ hướng dẫn tiếp tục ghi nhận bàn giao.

## Các trường hợp kiểm tra
- Chưa có kết quả nhận lại → không lập phiếu.
- Chưa có xác nhận của Chủ nhà → không lập phiếu.
- Tài sản kiểm kê chưa đầy đủ → không lập phiếu.
- Hồ sơ khác hợp đồng/lần thuê → không lập phiếu.
- Đã hoàn tất bàn giao đúng nguồn → được lập một phiếu Nháp.
- Lập lại cùng lần thuê → mở phiếu hiện có, không tạo trùng.
- Chưa có phiếu → không chuyển phòng Trống.
- Phiếu của lần thuê khác → không chuyển phòng Trống.
- Có phiếu đúng và bàn giao đủ → cho chuyển phòng Trống.
- Nút và form “Chưa bàn giao” đã được bỏ.

## Kỹ thuật & giới hạn
- Chạy đạt tất cả 9 bộ kiểm thử trong thư mục `tests` (bao gồm 11 tình huống mới cho phiếu trả phòng).
- Kiểm tra cú pháp 43 file TS/TSX và 126 đường dẫn import tương đối: không phát hiện lỗi.
- Chưa chạy build Vite hoặc kiểm thử thao tác trên trình duyệt (môi trường thiếu gói `vite/client`).
- Website là bản demo lưu cục bộ, chưa xác thực hệ thống backend và dữ liệu liên thiết bị.
- Phiếu trả phòng ở đây là **biên bản/phiếu ghi nhận trả phòng**, không phải phiếu hoàn trả tiền cọc. Tiền cọc tiếp tục xử lý qua Quản lý hợp đồng.
