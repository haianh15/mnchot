# Hệ thống quản lý chung cư mini – Bản mã nguồn hợp nhất

Đây là **toàn bộ mã nguồn website** React + TypeScript + Vite, hợp nhất bản sửa nghiệp vụ trước đó và bản cập nhật đăng nhập một tác nhân **Quản lý/Chủ nhà**. Thư mục `src` được đặt ngay tại gốc dự án, cùng cấp với `package.json`, `index.html`, `vite.config.ts`.

## Chạy trên máy

Yêu cầu Node.js và kết nối npm.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trên Terminal (dự án thiết lập cổng 3000 khi còn trống).

## Đăng nhập bản xem thử

- Tài khoản thử nghiệm duy nhất: `chunha`.
- Mật khẩu được cấp phải được người bàn giao cung cấp riêng.
- Lần đăng nhập đầu yêu cầu đổi mật khẩu (ít nhất 12 ký tự) trước khi sử dụng website.
- Không còn các nút tài khoản mẫu Chủ nhà / Quản lý / Kế toán.
- Nếu đã kiểm thử phiên bản trước, nên dùng cửa sổ ẩn danh để tránh dữ liệu cục bộ lưu từ trước.

**CẢNH BÁO:** Đây là prototype trình duyệt; mật khẩu có hash ở máy người dùng, chưa có backend xác thực hay hệ thống email khôi phục thật. Không nhập thông tin khách thuê, tài khoản ngân hàng hay giao dịch thực tế. Chức năng quên mật khẩu chỉ báo chưa được triển khai, không giả lập gửi email thành công.

## Đưa lên GitHub và Vercel

Đọc `HUONG_DAN_GITHUB_WEB.md` để tải **toàn bộ mã nguồn** lên một repo GitHub mới mà không tạo thư mục lồng nhau. Trên Vercel: Preset Vite, Root Directory `./`, Build `npm run build`, Output `dist`.

## Mức độ kiểm tra

- Đã kiểm tra cú pháp 34 file `.ts`/`.tsx` bằng TypeScript parser và xác nhận hash mật khẩu được cấp cho bản demo khớp với dữ liệu mã nguồn.
- Chưa chạy được build (`npm install` bị hạn chế kết nối tới npm registry trong môi trường đóng gói).
- Chưa thể xác nhận tất cả luồng nghiệp vụ của 63 Use Case đã đạt do chưa chạy kiểm thử end-to-end.

Đọc `BAO_CAO_CHINH_SUA.md` và `HUONG_DAN_DANG_NHAP_LAN_DAU.md` để biết thêm các điều kiện và giới hạn.
