# Đăng nhập lần đầu — BẢN XEM THỬ TRÌNH DUYỆT

Theo UC-TK-01, tài khoản Quản lý/Chủ nhà được cấp trước khi truy cập, **không có tự đăng ký**.

- **Tên đăng nhập được cấp:** `chunha`
- **Mật khẩu được cấp cho bản demo:** người bàn giao cung cấp riêng; KHÔNG đưa mật khẩu demo vào repository công khai.
- Khi xác thực đúng, bắt buộc nhập mật khẩu đang dùng + mật khẩu mới tối thiểu 12 ký tự + xác nhận.
- Chỉ sau khi đổi thành công mới mở Tổng quan. Thoát ở bước đổi giữ nguyên trạng thái phải đổi.
- Sai 5 lần khóa 15 phút. Phiên demo không lưu qua tải lại trang; tự hết hạn sau 30 phút không hoạt động.
- Các tài khoản `chudautu`, `quanly`, `ketoan`, `admin` của bản cũ đều không dùng nữa.
- Bản hợp nhất dùng vùng lưu trữ tài khoản thử nghiệm v2, bỏ qua các tài khoản mẫu cũ, chỉ khởi tạo một tài khoản đúng vai trò.

**LƯU Ý:** Bản này vẫn là prototype cục bộ phía trình duyệt, không có backend, không lưu tài khoản tập trung, không có dịch vụ email thực. Hash PBKDF2 chỉ giảm rủi ro đọc mật khẩu lưu cục bộ; nó KHÔNG biến ứng dụng thành hệ thống xác thực an toàn. Với website public, không nhập dữ liệu khách hoặc thanh toán thật. UC-TK-02/03/04 cần bổ sung xác thực/thu hồi phiên trên máy chủ, email khôi phục được xác minh, phát token và ghi nhật ký máy chủ trước khi dùng thực tế.

Trước khi chạy production, phải bỏ tài khoản thử nghiệm đã cấp và tạo tài khoản/chứng thực bằng backend an toàn.
