# Bàn giao cập nhật liên kết đúng phòng – 19/10/2026

## Phạm vi thay đổi

Bản sửa dựa trên ZIP website đã chỉnh phòng, khách thuê và hợp đồng gần nhất. Mục tiêu: mỗi thao tác từ Chi tiết phòng chỉ dẫn tới bản ghi **đúng phòng**, **đúng khách** và **đúng lần thuê**; không lấy dữ liệu cũ chỉ vì cùng mã phòng.

### 1. Chi tiết phòng
- Phòng Trống: không trình bày khu vực bàn giao, ngày dự kiến trả, các khoản thuê đã thu, hoặc nút Xem hồ sơ khách thuê. Giữ các thao tác cần thiết để bắt đầu thuê như Lập hợp đồng, Kiểm tra khả năng cho thuê.
- Phòng Trống chưa có hợp đồng đã ký: không hiển thị sẵn Thu tiền cọc/thuê đầu hoặc Nhận phòng.
- Phòng có khách: Hồ sơ khách thuê mở theo đúng `currentTenantId` đã xác minh; nếu hợp đồng nguồn thiếu trong dữ liệu mẫu, không được tự mở hợp đồng phòng khác hoặc hợp đồng cũ.
- Hợp đồng: chỉ mở hợp đồng cùng `roomCode` và `currentLeaseId`. Không dùng điều kiện 'cùng mã phòng là được'. Phòng Trống dẫn tới Lập hợp đồng với mã phòng được chọn.
- Bàn giao: nút Xem chỉ xuất hiện nếu tồn tại biên bản của **lần thuê hiện tại**. Không tạo số biên bản giả hoặc tự mở biên bản từ lượt thuê cũ.
- Kế hoạch trả: chỉ cho xem khi phòng đang thuê và có ngày dự kiến trả; khi mở từ phòng, danh sách được lọc theo mã phòng và lần thuê. Những dữ liệu mẫu đã có ngày dự kiến trả nhưng chưa có nhật ký chi tiết vẫn hiển thị ngày đó từ bản ghi phòng, không bịa nhật ký.
- Thông tin người ở cùng và tiền cọc: tách theo mã khách / lần thuê, không lấy các bản ghi khác trong cùng phòng.

### 2. Màn hình đích
- App.tsx truyền cả `roomCode`, `contractId`, `tenantId`, `leaseId` khi mở liên kết.
- HandoverAssetsView đối chiếu `roomCode` và `leaseId` ở biên bản nhận, biên bản trả, kiểm tra nhận lại, đối chiếu tài sản và quyết toán. Khi vào từ một hồ sơ cụ thể, không cho chọn nhầm phòng trên dropdown. Nếu hồ sơ đã đổi lần thuê, thông báo cần chọn lại thay vì tự hiển thị dữ liệu không liên quan.
- TenantsView + HSKT01RegisterTenant giữ hành vi đánh dấu xanh, in đậm và cuộn đến mã khách được truyền từ Quản lý phòng.
- ContractsView giữ hợp đồng đã chọn ở Chi tiết hợp đồng; phòng Trống khởi tạo luồng lập hợp đồng với mã phòng định sẵn.

### 3. Kiểm tra tại tầng xử lý dữ liệu (AppContext)
- Xác nhận tiền cọc/thuê đầu đòi hợp đồng đã ký khớp mã phòng, mã hợp đồng và mã lần thuê.
- Xác nhận nhận phòng đòi hợp đồng cùng mã phòng và lần thuê; biên bản cùng hồ sơ, hai chữ ký giấy và chứng từ thanh toán đúng lần thuê.
- Ghi ngày dự kiến trả và ghi nhận liên hệ không chấp nhận phòng Trống hoặc mã lần thuê khác.
- Xác nhận trả phòng phải dùng kết quả nhận lại của đúng phòng–lần thuê; không lấy biên bản khác thuộc cùng phòng.

## Kiểm tra đã thực hiện
- Phân tích cú pháp các file TypeScript/TSX: không có lỗi cú pháp.
- Đối chiếu dữ liệu mẫu: P.103/P.202 Trống; P.101 có hợp đồng, khách thuê và biên bản; P.102 có ngày dự kiến trả; một số phòng khác có tên khách nhưng thiếu bản ghi hợp đồng trong dữ liệu mẫu, được xử lý thận trọng (không lấy bản ghi thay thế).
- Cấu trúc ZIP: các file `src`, `package.json`, `index.html`, `vite.config.ts` ở gốc.

## Hạn chế kiểm thử
- Không cài xong dependency trong môi trường hiện tại, do đó chưa xác nhận `npm run build` và chưa thao tác trực tiếp trên bản Vercel.
- Đây vẫn là bản demo lưu thông tin trên trình duyệt, chưa có backend bảo mật để dùng dữ liệu thật.

## Cập nhật
Tải toàn bộ nội dung ZIP vào gốc repository `haianh15/mnchot` (thay thế file trùng đường dẫn). Không xóa repository hay tự xóa các file dữ liệu. Kiểm tra Vercel sau khi đẩy commit mới.
