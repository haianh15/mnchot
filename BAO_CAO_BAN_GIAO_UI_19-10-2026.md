# Báo cáo bàn giao – bản sửa cấu trúc giao diện và luồng sử dụng

Ngày: 19/10/2026. Dự án: **Quản lý chung cư mini**, 1 tác nhân **Chủ nhà/Quản lý**.

## 1. Đã chỉnh sửa trực tiếp mã nguồn

| Phần | Thay đổi đã đưa vào code |
| --- | --- |
| Ứng dụng và Sidebar | Bỏ màn hình Dashboard/Tổng quan và đường dẫn tới Dashboard; sau đăng nhập mở Quản lý phòng; Sidebar chỉ chứa các phân hệ chính, không có Quyết toán cọc riêng. |
| Quản lý phòng | Gộp những bước nghiệp vụ thành các hành động theo phòng, không trải tất cả lên tab ngang; giữ liên kết hồ sơ phòng sang Hợp đồng/Khách/Bàn giao. |
| Hợp đồng | Mặc định mở danh sách; chọn hợp đồng xem chi tiết; đặt Quyết toán cọc ngay trong Chi tiết hợp đồng, chỉ bật khi đã ghi nhận nhận lại phòng; có màn hình Theo dõi hạn hợp đồng tách kế hoạch trả phòng. |
| Hồ sơ khách thuê | Mặc định mở tra cứu/danh sách. Chọn khách → Chi tiết → Thông tin/Người ở cùng/Lịch sử; Kiểm tra thay đổi, Cập nhật là nút theo hồ sơ; sử dụng mã khách đang chọn. |
| Bàn giao và tài sản | Giảm điều hướng cao nhất về ba nhóm Nhận phòng/Trả phòng/Sự cố tài sản. Bước thao tác nằm bên trong nhóm; khi mở từ phòng sẽ chọn đúng phòng, khi mở từ menu chung phải chọn phòng. |
| Tính tiền kỳ | Giữ ghi chỉ số và bảng tính là nhóm chính; kết nối bảng tính đúng mã sang đối chiếu thông báo; không gán kỳ/mã phòng/mã lần thuê mặc định; yêu cầu người dùng ghi đúng mã công tơ thay vì tạo mã công tơ giả. |
| Thông báo | Mở danh sách thông báo mặc định, các bước đối chiếu/lập/gửi là hành động; nhận mã bảng tính từ Tính tiền, truyền mã thông báo sang Thu tiền. |
| Thu tiền | Mặc định theo dõi thanh toán, xác nhận là thao tác theo thông báo, liên kết đúng thông báo từ nơi khác. |
| Công nợ | Trình bày danh sách nợ quá hạn trước; nhắc nợ, phản hồi, căn cứ xử lý là các thao tác; giảm các tab ngang. |
| Báo cáo | Chỉ để các nhóm báo cáo chính, các bước đối soát/lập báo cáo là nút hành động. |
| Đăng nhập | Giữ một tác nhân Chủ nhà, yêu cầu đổi mật khẩu lần đầu, đổi nhãn luồng sang Quản lý phòng; không còn “Tài khoản mẫu” và ba lựa chọn vai trò. |
| Liên kết tài chính | Khi phiếu quyết toán sử dụng cọc bù nợ, chỉ khoản nợ được chỉ đích danh và được bù đủ mới được cập nhật trạng thái đã xử lý bằng cọc; không tự đánh dấu tất cả thông báo của phòng đã thanh toán. |

## 2. Những điều chưa thể khẳng định hoàn thành

- Chưa chạy được `npm install`, `npm run build` và kiểm thử giao diện bằng trình duyệt do môi trường không truy cập npm registry. Đã dùng TypeScript parser kiểm tra cú pháp **34** tệp TS/TSX và kiểm tra đường dẫn import tương đối, **không thay thế kiểm tra kiểu hoặc chạy thử**.
- Không thể tuyên bố mọi luồng thay thế, ngoại lệ, điều kiện của **63 UC** đã chạy đúng khi chưa thực hiện test tích hợp và rà soát dữ liệu mẫu trên trình duyệt.
- Bản này vẫn lưu trạng thái trên **localStorage**, xác thực phía client; chưa có backend xác thực, thu hồi phiên, email khôi phục mật khẩu hay cơ sở dữ liệu tài chính an toàn. **Không dùng dữ liệu khách/tiền thật**.
- Vẫn cần test cụ thể: cọc gia hạn/nhận trả phòng/đối trừ công nợ, không thu lại tháng đầu, tính dịch vụ mỗi lượt thuê, QR quét bằng app ngân hàng, xung đột cập nhật, luồng đóng hồ sơ và giao diện 360–428px.
- Nếu một khoản nợ được bù cọc chưa đủ, cần giữ nợ gốc và ghi rõ số dư; không coi thông báo hoặc QR cũ là thanh toán đủ.

## 3. Kiểm tra và chạy

Từ thư mục chứa `package.json`, chạy:

```bash
npm install
npm run lint
npm run build
npm run dev
```

Sau đó kiểm tra các kịch bản ở `CHECKLIST_KIEM_THU.md`.

## 4. Đưa lên GitHub

Giải nén gói ZIP **không có thư mục bao ngoài**. Trong thư mục giải nén phải thấy trực tiếp `src`, `package.json`, `index.html`. Khi upload GitHub Web, phải kéo **các mục bên trong** thư mục giải nén, không kéo chính thư mục chứa chúng. Nếu repo có file cũ, những file trùng tên cần được thay thế, không tạo thư mục `UPLOAD_...`.
