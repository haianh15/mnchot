# Hệ thống quản lý chung cư mini

Ứng dụng dành cho một vai trò **Quản lý/Chủ nhà**, giao diện bằng tiếng Việt.

## Chạy dự án

```bash
npm install
npm run dev
```

Để triển khai lên Vercel: Framework `Vite`, Root Directory `./`, Build Command `npm run build`, Output Directory `dist`.

## Điều hướng theo hồ sơ

Ứng dụng mở **Quản lý phòng** sau khi đăng nhập. Menu bên trái chỉ chứa các nhóm chức năng chính. Để thực hiện công việc, chọn phòng, khách hoặc hợp đồng cụ thể; các màn hình tiếp theo chỉ mở khi bấm **Tiếp tục** hoặc hành động tương ứng và khi đủ điều kiện nghiệp vụ.

- Nhận phòng: kiểm tra hợp đồng và khoản thu → bàn giao đã ký → đối chiếu người nhận → xác nhận nhận phòng.
- Trả phòng: kiểm tra kết quả nhận lại → xác nhận ngày trả phòng.
- Ghi chỉ số: chọn phòng/kỳ → nhập chỉ số → xác minh bất thường (nếu có) và lưu.
- Bàn giao: chọn Nhận phòng / Trả phòng / Sự cố; chỉ hiện công việc đang xử lý.
- Quyết toán cọc chỉ mở từ Chi tiết hợp đồng.

Các tên, mã Use Case, mã quy tắc và ghi chú đặc tả chỉ phục vụ lập trình, **không hiển thị dưới dạng nhãn điều hướng hay đánh số thao tác trong giao diện**.

## Lưu ý bảo mật

Đây là phiên bản demo React có dữ liệu lưu cục bộ trong trình duyệt, **chưa có backend xác thực, cơ sở dữ liệu và email khôi phục mật khẩu thực tế**. Không sử dụng dữ liệu khách thuê hay giao dịch thật. Chưa được chứng nhận vượt qua toàn bộ kiểm thử tích hợp 63 Use Case.
