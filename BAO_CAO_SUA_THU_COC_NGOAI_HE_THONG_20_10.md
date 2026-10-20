# Đính chính nghiệp vụ: Tiền cọc được thanh toán ngoài hệ thống

- **Dòng tiền thực tế:** Khách chuyển trực tiếp cho Chủ nhà qua ngân hàng bên ngoài website trước khi ký hợp đồng. Website không thực hiện chuyển khoản, không tạo QR để thanh toán cọc, không tự xác nhận giao dịch.
- **Vai trò website:** Chủ nhà nhập **thông tin giao dịch đã xảy ra**, gồm ngày nhận, mã giao dịch, tài khoản nhận, bằng chứng và xác nhận đã đối chiếu ngân hàng. Hệ thống kiểm tra bản ghi có đủ căn cứ và khớp số tiền của hợp đồng/lần thuê.
- **Điều kiện ghi nhận hợp đồng đã ký:** Nếu thiếu đối chiếu cọc và tiền thuê kỳ đầu, giao diện chặn xác nhận ký theo quy tắc mới nhất của người dùng; ngoài thực tế giao dịch xảy ra trước trong ngân hàng, chỉ dữ liệu kết quả được đưa vào website.
- **Nhận phòng:** Chỉ khi đã có hợp đồng được ký và hoàn tất biên bản nhận phòng, đồng thời khoản tiền đầu đã đối chiếu.
- **Gia hạn:** Sử dụng cọc gốc, không thu cọc lần hai.
- **Tệp sửa:** `src/components/views/contracts/HDT04ReceiveSignedContract.tsx`, `src/components/views/RoomsView.tsx`, `src/components/views/ContractsView.tsx`, `src/context/AppContext.tsx`, `tests/preSignPayments.test.cjs`. Các thay đổi chủ yếu là làm rõ hình thức ghi nhận, không thêm cổng thanh toán.

**Giới hạn:** Ứng dụng vẫn lưu dữ liệu cục bộ, không liên kết ngân hàng để tự kiểm tra giao dịch. Trường hợp chưa có chứng từ không thể tự xác nhận đã đóng.
