# BÁO CÁO CHỈNH SỬA WEBSITE CHUNG CƯ MINI

Nguồn: file ZIP website do người dùng gửi, đặc tả 63 Use Case (bản có quy tắc đơn giản và màn hình áp dụng), biên bản nhận xét 17/10/2026. Mọi thay đổi nằm trực tiếp trong mã nguồn `src/` hiện có.

## Nội dung đã chỉnh trực tiếp

1. Sidebar: bỏ mục Quyết toán cọc; gỡ diễn giải luồng dài; tạo menu thu gọn trên thiết bị nhỏ.
2. Dashboard: bỏ thẻ dẫn trực tiếp đến Quyết toán cọc.
3. Quản lý hợp đồng: mặc định mở **Danh sách hợp đồng**, cho chọn hợp đồng và xem chi tiết; hiển thị cọc gốc xác nhận và kết quả nhận lại phòng; từ Chi tiết hợp đồng mở Quyết toán cọc của **đúng lần thuê**. Giữ các biểu mẫu/hàm hợp đồng cũ để tiếp tục sử dụng.
4. Quyết toán cọc: giới hạn danh sách/đối tượng tạo phiếu vào đúng mã lần thuê từ hợp đồng, không tự mở phiếu đầu tiên của phòng khác; bỏ mặc định 3.500.000đ; yêu cầu chứng cứ cọc và bản nhận lại; không điền sẵn tài khoản/giao dịch/chứng từ quyết toán giả; kiểm tra đầy đủ chứng từ khi giao dịch thực sự phát sinh.
5. Quản lý phòng: nút Xem hợp đồng, Xem khách thuê và Xem bàn giao trong Chi tiết phòng chuyển đến phân hệ tương ứng kèm mã hồ sơ; khi quay lại từ hợp đồng có thông tin mã phòng; cập nhật nhãn “Sắp trả phòng”; yêu cầu chọn đúng phòng trước khi ghi ngày dự kiến trả, không dùng phòng đang thuê đầu tiên; thay tiền cọc cố định bằng nguồn thanh toán; trạng thái biên bản căn cứ chữ ký thực tế.
6. Bàn giao/tài sản: nhận phòng từ đường dẫn ngoài và đồng bộ lựa chọn phòng, bỏ P.103 cố định; trường hợp chưa có bằng chứng nhận lại không mặc định “Đã nhận lại”.
7. Ghi nhận điều kiện thuê: đặt điều kiện ở trạng thái đã thống nhất ngoài hệ thống và bỏ diễn giải “quản lý thương lượng”.
8. Tính tiền theo kỳ: xác định khoảng ngày đúng kỳ MM/YYYY, đơn giá theo kỳ hiệu lực và mã lần thuê, không dùng giá thuê dự phòng 3.500.000đ; không tạo tiền thuê kỳ sau cho phòng đã trả/chỉ số kỳ cuối; từ chối số liệu chỉ số chưa được xác nhận và bảng tính trùng đã chốt.
9. Thông báo thanh toán: yêu cầu có đối chiếu đã xác nhận khớp bảng tính/phòng/lần thuê/kỳ; không lấy tài khoản ngân hàng mẫu thay tài khoản đang áp dụng; dùng hình ảnh VietQR thanh toán trực tiếp thay vì tạo QR chứa đường dẫn ảnh hoặc chuỗi tự tạo.
10. Thu tiền: để trống mã giao dịch và chứng từ chờ chủ nhà nhập theo giao dịch thực.
11. Công nợ: không tự xếp loại nợ kéo dài từ ngưỡng 15 ngày; chỉ trình bày căn cứ; đối trừ cọc theo đúng mã thông báo và lần thuê, không trừ một khoản cọc lặp cho nhiều thông báo; loại thông báo đã thay thế khỏi số dư quá hạn.
12. Báo cáo: dùng số tiền thuê/dịch vụ từ các dòng của thông báo nguồn thay cho số ước lượng, tính quá hạn theo ngày lịch; bỏ chênh lệch 3.500.000đ viết cố định.
13. Tài khoản: không tự cấp phiên quản trị khi mở ứng dụng. Bỏ nút reset dữ liệu mẫu khỏi Header; có cảnh báo đây là bản demo chưa có backend bảo mật.

## Phần chưa hoàn tất / cần kiểm thử

- **Chưa có backend thực:** tài khoản, dữ liệu khách thuê và giao dịch vẫn tồn tại dưới dạng dữ liệu mẫu/localStorage của bản cũ. Mật khẩu mẫu trong seed không phải cơ chế lưu mật khẩu an toàn. Tuyệt đối không sử dụng dữ liệu thật khi chưa thay thế bằng backend có xác thực và phân quyền an toàn.
- **Chưa kiểm chứng được build/runtime:** không tải được các thư viện npm trong môi trường hiện tại (`npm install --offline` báo `ENOTCACHED` cho `@google/genai`, `npm install` trực tuyến không hoàn tất). Đã kiểm tra phân tích cú pháp toàn bộ các file TypeScript/TSX bằng TypeScript 5.8.3, không có lỗi cú pháp. Vẫn phải chạy `npm install`, `npm run lint`, `npm run build` trên máy có mạng.
- **Chưa kiểm thử 63 UC end-to-end:** các nhánh phụ/ngoại lệ và nhiều biểu mẫu kế thừa của website vẫn có dữ liệu demo. Chưa chứng minh đúng đầy đủ với đặc tả. Không coi đây là website đã sẵn sàng vận hành thật.
- **VietQR:** ảnh lấy từ dịch vụ bên ngoài `img.vietqr.io`. Phải kiểm thử quét bằng app ngân hàng, độ đúng của ngân hàng, tài khoản, số tiền, nội dung; chức năng xuất ảnh canvas phụ thuộc chính sách CORS của dịch vụ.
- **Hai lượt thuê trong cùng kỳ:** cần kiểm thử thêm và có thể cần mở rộng giao diện chọn lần thuê trong nghiệp vụ tính tiền.
- **Điều hướng đa bước:** các nút chính đã có liên kết hồ sơ, nhưng các đường dẫn phụ trong những popup cũ cần rà soát thêm.

## Hướng dẫn chạy trên máy có mạng

```bash
npm install
npm run lint
npm run build
npm run dev
```

Kiểm tra đầu tiên: Đăng nhập → Quản lý hợp đồng → Danh sách → Chi tiết → Quyết toán cọc; Quản lý phòng → Chi tiết phòng → Xem hợp đồng/bàn giao; sau đó kiểm tra các luồng tiền theo đúng đặc tả.

**Đây là bản mã nguồn đã chỉnh sửa một phần đáng kể, không phải cam kết hoàn tất và kiểm thử toàn bộ 63 Use Case.**
