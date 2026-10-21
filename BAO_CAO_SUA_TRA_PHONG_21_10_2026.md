# Cập nhật luồng trả phòng (21/10/2026)

Nguồn: `CCMN_MNCHOT_BO_SUNG_DAY_DU_HO_SO_DEMO_PHONG_DANG_THUE_FULL (1)(1).zip` do người dùng cung cấp.

## Đã sửa

1. **Bỏ thao tác "Đính chính"** tại Bàn giao → Ghi nhận nhận lại phòng, gồm nút mở và form nhập lý do/chứng cứ. Không xóa dữ liệu đã ghi trước đó; chỉ bỏ chức năng giao diện này.
2. **Nút kết thúc thuê ngay tại Bàn giao**: `Xác nhận trả phòng – Chuyển về Trống`. Nút nằm trong nhóm Trả phòng, xuất hiện cùng thông tin đã/ chưa xác nhận bàn giao.
3. **Điều kiện cho bấm**: phòng chưa Trống, khớp phòng–hợp đồng–lần thuê hiện tại, có biên bản nhận phòng hợp lệ, có phiếu trả phòng của lần thuê, có kết quả nhận lại thực tế đã kiểm tra đầy đủ và được Chủ nhà xác nhận. Hàm xử lý nghiệp vụ xác minh lại các điều kiện; không chỉ dựa vào nút.
4. **Sau khi xác nhận thành công**, chuyển về Chi tiết phòng để thấy trạng thái `Trống`. Quyết toán cọc tiếp tục xử lý trong Hợp đồng và không cản cập nhật phòng Trống.
5. Thêm chú thích tại Bàn giao: **Lưu phiếu Nháp** hoặc **Lưu biên bản** không tự chuyển phòng Trống.

## Phạm vi

Chỉ sửa `src/components/views/HandoverAssetsView.tsx`, `src/App.tsx` và thêm bài kiểm tra `tests/returnRoomCompletionUI.test.cjs`. Giữ nguyên cấu trúc các phân hệ và dữ liệu mẫu của nguồn.

## Kiểm tra

- 47 file TypeScript/TSX parse được, không có lỗi cú pháp.
- Các bài kiểm thử nguồn `.cjs` đạt khi chạy độc lập.
- Bài kiểm tra mới xác minh nút xác nhận và điều kiện chuyển Trống.
- Chưa chạy được Vite build và kiểm tra trình duyệt vì môi trường hiện tại chưa có các dependency dự án.

**Chú ý:** Ứng dụng hiện dùng dữ liệu mẫu và localStorage, không nên nhập thông tin khách hoặc giao dịch thật cho tới khi có backend bảo mật và hệ thống chứng từ.
