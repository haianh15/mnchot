# Cập nhật giao diện Quản lý phòng và Hợp đồng

Nguồn: CCMN_MNCHOT_BO_SUNG_DAY_DU_HO_SO_DEMO_PHONG_DANG_THUE_FULL (1)(1).zip do người dùng cung cấp.

## Nội dung chỉnh sửa

- Bỏ banner chạy thử ở đầu giao diện.
- Bỏ banner yêu cầu đối chiếu hồ sơ ở đầu Quản lý phòng.
- Bỏ banner cùng nút bổ sung hồ sơ DEMO ở Danh sách phòng.
- Bỏ nhãn Hồ sơ DEMO và cảnh báo đối chiếu hiển thị dưới trạng thái phòng.
- Cọc và tiền thuê kỳ đầu hiển thị nhất quán với P.101: Đã đối chiếu khi bản ghi được hàm kiểm tra xác định hợp lệ, Chưa xác nhận khi không hợp lệ; không còn nhãn DEMO - giả lập hoặc Có bản ghi.
- Bỏ khung note đối chiếu lặp ở Chi tiết phòng.
- Bỏ label Tình trạng quyết toán cọc; giữ dropdown và chức năng lọc ở Hợp đồng.

## Phạm vi

Chỉ thay hiển thị; không sửa hồ sơ hợp đồng, chứng từ, biên bản, dữ liệu seed hay hàm kiểm tra nghiệp vụ.
Dữ liệu được tạo từ bộ dữ liệu thử nghiệm vẫn là dữ liệu giả lập, không thay cho chứng từ thanh toán hoặc biên bản có chữ ký thực tế. Nếu trình duyệt đã lưu hồ sơ thiếu dữ liệu, code mới không tự dựng chứng từ hay biến trạng thái Chưa xác nhận thành Đã đối chiếu.

## Kiểm tra

- 15 bài kiểm thử .cjs và kiểm tra cú pháp TS/TSX đã chạy qua ở phiên làm việc này.
- Chưa xác nhận build Vite hay chạy end-to-end trên trình duyệt.
