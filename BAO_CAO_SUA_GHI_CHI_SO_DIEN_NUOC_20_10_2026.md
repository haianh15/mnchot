# Báo cáo cập nhật chỉ số điện, nước — 20/10/2026

## Nguồn
- Dùng trực tiếp `mnchot-main-meter-readings-updated.zip` mà người dùng vừa gửi làm nền.
- Các chỉnh sửa cũ ở Quản lý phòng, Bàn giao, Hồ sơ khách, Hợp đồng, Quyết toán cọc và giao diện Bảng tính tiền được giữ nguyên theo mã nguồn trong ZIP nguồn.

## Các sửa đổi
1. **Chỉ số đầu kỳ**: tự lấy từ chỉ số kỳ trước **đã xác nhận**, đúng mã phòng, mã lần thuê và ngày trước ngày ghi; nếu chưa có thì tra cứu **biên bản nhận phòng đã xác nhận đủ chữ ký**, kể cả hợp đồng gia hạn cùng lần thuê. Đối chiếu chỉ số điện/nước trên biên bản và hồ sơ hiện trạng nếu cả hai có dữ liệu. Không tự điền 0 khi thiếu hồ sơ.
2. **Ngoài kỳ chung**: chọn phòng không còn ép loại ghi về "Theo kỳ chung". Với phòng đã trả nhưng đang chốt kỳ cuối, hệ thống vẫn chọn "Ngoài kỳ chung".
3. **Chống ghi trùng tại hàm lưu**: kiểm tra phòng, lần thuê, kỳ, ngày, ID bản ghi, trạng thái đã xác nhận và các bảng tính đã tồn tại. Trả về thông báo thành công/thất bại thực tế cho giao diện; không tự đóng form khi thao tác bị từ chối. Kiểm tra chỉ số đầu so với nguồn ngay tại tầng lưu.
4. **Giao diện**: chỉ số đầu kỳ hiện chỉ đọc; hiển thị nguồn chỉ số. Không cho tiếp tục nếu không tìm thấy nguồn đã xác minh. Số 0 vẫn hợp lệ nếu có nguồn xác nhận thực sự là 0. Mã công tơ lấy từ hiện trạng/biên bản, nếu chưa có mã thì yêu cầu nhập mã thực tế.
5. **Bài kiểm thử mới**: `tests/meterReadings.test.cjs` và lệnh `npm run test:meters`.

## Kết quả xác minh
- 8 bộ kiểm thử gốc đạt và 26 kiểm tra mới trong `tests/meterReadings.test.cjs` đạt.
- 43 file TypeScript/TSX được phân tích cú pháp, không có lỗi cú pháp; riêng module tiện ích mới kiểm tra kiểu TypeScript thành công.
- Các đường dẫn import tương đối đến tệp mã nguồn đã được rà soát.
- **Chưa build Vite và chưa kiểm thử trên trình duyệt**, do môi trường không có các thư viện npm của dự án. Chưa thể kết luận toàn bộ 63 Use Case đạt.

## Cần lưu ý
- Các phòng dữ liệu mẫu thiếu biên bản nhận phòng đã ký và không có chỉ số kỳ trước được xác nhận sẽ bị chặn khi tạo chỉ số đầu kỳ. Đây là chặn nghiệp vụ có chủ đích; cần cập nhật hồ sơ thực tế, không tạo chứng từ giả.
- Nếu dữ liệu lưu trên trình duyệt từ các bản demo cũ đã có bản ghi trùng hoặc sai nguồn, bản sửa sẽ chặn tạo mới nhưng không tự ý xóa/sửa các bản ghi cũ. Cần đối chiếu từng trường hợp.
- Website vẫn lưu dữ liệu trên trình duyệt, không phải hệ thống backend dùng chung; cần hệ thống dữ liệu và kiểm thử bảo mật riêng trước khi vận hành thực tế.

## Cập nhật GitHub
- Giải nén ZIP thành phẩm; chọn toàn bộ nội dung ở cấp gốc (thấy `src`, `package.json`, `index.html`, `tests`).
- Tải lên repo `haianh15/mnchot` tại thư mục gốc của nhánh main, không tải nguyên ZIP hay thư mục bao ngoài.
- Giữ bản sao ZIP cũ trước khi Commit. Các tệp không còn trong ZIP sẽ không tự được xóa trên GitHub.
