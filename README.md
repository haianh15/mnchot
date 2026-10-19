# Quản lý chung cư mini – Bản thiết kế lại luồng giao diện

**Bản demo React + TypeScript + Vite, một vai trò Quản lý/Chủ nhà.**

Website **không có trang Tổng quan**: sau đăng nhập mở Quản lý phòng. Sidebar chỉ hiển thị các phân hệ chính. Danh sách → Chi tiết hồ sơ → Hành động, thay vì đưa tất cả Use Case lên thanh tab. **Quyết toán cọc chỉ truy cập từ Chi tiết hợp đồng.**

## Khởi chạy

Cài Node.js, trong thư mục chứa `package.json` chạy:

```bash
npm install
npm run lint
npm run build
npm run dev
```

Lệnh `npm run dev` chạy Vite ở cổng 3000 nếu chưa bị sử dụng; mở đường dẫn xuất hiện trong Terminal.

## Tài khoản để xem thử

Tên đăng nhập: `chunha`. Mật khẩu được cấp trong `HUONG_DAN_DANG_NHAP_LAN_DAU.md`; đăng nhập lần đầu bắt buộc đổi mật khẩu. Chỉ dùng trên dữ liệu demo.

## Triển khai

Giải nén ZIP, mở vào **bên trong** để thấy `src`, `package.json`, `index.html`, `vite.config.ts` ngay cấp gốc. Kéo các mục ấy lên GitHub Web. Trên Vercel: Framework `Vite`, Root Directory `./`, Build `npm run build`, Output `dist`.

## Giới hạn

Đã chỉnh mã nguồn, kiểm tra cú pháp TS/TSX và import tương đối nhưng **chưa xác nhận build**, chưa chạy test 63 UC. Bản này vẫn lưu dữ liệu và xác thực phía trình duyệt; **không an toàn cho thông tin khách, ngân hàng, tài chính thật**. Cần backend, kiểm thử nghiệp vụ và bảo mật trước khi vận hành.

Đọc `BAO_CAO_BAN_GIAO_UI_19-10-2026.md` và `CHECKLIST_KIEM_THU.md`.
