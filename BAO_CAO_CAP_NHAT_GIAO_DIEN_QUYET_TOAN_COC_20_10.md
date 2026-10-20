# BÁO CÁO CẬP NHẬT GIAO DIỆN QUYẾT TOÁN CỌC – 20/10/2026

## Cơ sở sửa
- Yêu cầu người dùng gửi trong chat ngày 20/10: Quy trình 05 là quy trình con của Quy trình 04; sửa sáu màn hình.
- Giữ mã nguồn website đầy đủ của bản `CCMN_MNCHOT_SUA_TOAN_BO_LUONG_PHONG_BAN_GIAO_20_10_FULL.zip` làm nền. Không ghi đè các phân hệ không liên quan.
- Yêu cầu người dùng trong cuộc hội thoại dừng giữa nội dung hướng dẫn chế độ Sửa (đến ký tự "X"). Chỉ những nội dung thực sự có trong tin nhắn đã được áp dụng; không giả định phần văn bản chưa được gửi.

## Sáu màn hình được cập nhật

1. **Danh sách hợp đồng:** thêm chọn lọc Tất cả / Cần hoàn tất quyết toán cọc; nhãn duy nhất Cần hoàn tất quyết toán cọc; chỉ liệt kê hợp đồng cuối cùng của lần thuê đã thực sự nhận lại phòng, không liệt kê hợp đồng cũ kết thúc do nối tiếp; thêm lối mở Danh sách phiếu quyết toán.
2. **Chi tiết hợp đồng:** nút Lập quyết toán cọc / Sửa / Ghi nhận kết quả quyết toán / Xem phiếu quyết toán theo đúng trạng thái. Mang theo mã hợp đồng, phòng, lần thuê và mã phiếu, không bắt chọn lại từ danh sách chung. Khi Tranh chấp, nút Sửa chỉ cho phép tác vụ Mở lại phiếu có điều kiện.
3. **Lập quyết toán cọc:** thêm nút Tính kết quả. Nhập điều khoản, lý do, số tiền, chứng cứ cho khoản trừ thủ công. Chưa tính thì không hiển thị kết quả hoàn/thu, không được Lưu. Thay đổi số tiền hoặc cơ sở tính sau khi tính thì phải bấm tính lại. Lưu thành trạng thái Đang lập.
4. **Chế độ Sửa:** tách nhóm tác vụ điều chỉnh khoản trừ, ghi nhận phản hồi, hủy phiếu, xác lập tranh chấp; không hiển thị các thao tác này thường trực khi chỉ xem. Chặn sửa phiếu đã phát hành hoặc đang tranh chấp (ngoại trừ mở lại có điều kiện).
5. **Ghi nhận kết quả:** mở form riêng từ đúng phiếu; hiển thị phiên bản và chứng cứ khách đã đồng ý; bắt nhập chứng từ giao dịch khi có tiền hoàn/thu thêm, không tự chèn ngày và chứng cứ mẫu; kiểm tra hợp lệ và phản hồi kết quả lưu.
6. **Danh sách phiếu quyết toán:** giữ danh sách trái – chi tiết phải; tìm theo mã phiếu/phòng/lần thuê/hợp đồng/tên khách; bổ sung bộ lọc trạng thái; không hiển thị chi tiết ngoài bộ lọc; không cho lập trùng phiếu hiệu lực.

## Tầng dữ liệu đã siết
- Không tạo phiếu khi không có hồ sơ nhận lại thực tế, hợp đồng đầu, chứng từ cọc gốc đúng phòng và lần thuê.
- Không tạo phiếu trùng hiệu lực hoặc mã phiếu trùng.
- Không cho khấu trừ âm hoặc khoản trừ theo điều khoản thiếu căn cứ.
- Nếu bảng tính kỳ cuối được xác nhận sau khi lập nháp, thao tác điều chỉnh phiếu có thể cập nhật căn cứ tính lại; khách phải đồng ý theo phiên bản mới.
- Chặn ghi nhận kết quả khi số tiền khách chấp thuận khác phiên bản, chưa có bảng kỳ cuối hoặc chứng từ bắt buộc thiếu.
- Đồng nhất xử lý các trạng thái kết quả 5.8 cũ đang tồn tại trong dữ liệu.

## Kiểm thử
- `npm run test:settlement` – 16 trường hợp.
- `npm run test:handover` – kiểm tra hồi quy các luồng Phòng và Bàn giao.
- Phân tích cú pháp bằng TypeScript cho toàn bộ mã nguồn; kiểm tra đường dẫn import nội bộ.
- **Chưa** chạy build Vite hoặc kiểm thử thao tác trong trình duyệt do môi trường chưa cài các dependency npm.
- Website vẫn lưu dữ liệu localStorage, chưa có backend/cơ sở dữ liệu chung; chưa thể coi là hệ thống vận hành thực tế.

## Cập nhật GitHub
Giải nén ZIP này, kéo **các mục bên trong** (`src`, `tests`, `package.json`...) lên thư mục gốc `haianh15/mnchot` để cập nhật các đường dẫn trùng tên. Không kéo thư mục bao ngoài; không xóa repo.
