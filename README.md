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


## Cập nhật 19/10 – Theo dõi trả phòng

Danh sách theo dõi trả phòng đã chuyển vào **Quản lý hợp đồng**; Quản lý phòng chỉ giữ các thao tác chi tiết phòng, không có danh sách trùng. Xem `BAO_CAO_CHUYEN_THEO_DOI_TRA_PHONG.md`. Chạy `npm run test:returns` để kiểm tra liên kết.

## Cập nhật luồng phòng – bàn giao (20/10/2026)

Xem `BAO_CAO_SUA_LUONG_PHONG_BAN_GIAO_20_10_2026.md` để biết các sửa lỗi liên kết đúng hợp đồng/lần thuê, chứng cứ kiểm kê và trả phòng, đồng bộ quyết toán cọc. Chạy `npm run test:handover` để thực hiện các bài kiểm tra hồi quy sau khi cài dependencies.

**Giới hạn:** dự án là bản demo dùng localStorage. Không sử dụng như hệ thống thanh toán/hồ sơ nghiệp vụ thật trước khi hoàn thiện backend, sao lưu và kiểm thử end-to-end.

## Cập nhật liên kết Phòng – Bàn giao (20/10/2026)

Đã rà soát lại liên kết mã phòng/hợp đồng/lần thuê, hồ sơ nhận phòng kế thừa, kết quả trả phòng, xác nhận ký giấy, dữ liệu kiểm kê, hiện trạng và đối chiếu cọc. Xem `BAO_CAO_KIEM_TRA_SUA_LIEN_KET_PHONG_BAN_GIAO_20_10.md`.

Sau khi `npm install`, chạy `npm run test:handover` (có thêm 29 trường hợp kiểm tra), cùng `npm run test:occupancy`, `npm run test:settlement` và `npm run test:contract`.

## Bổ sung 21/10/2026 – Biên bản trả phòng
Biên bản trả phòng ở Bàn giao → Hoàn thiện biên bản đã có đủ nội dung và bảng kiểm kê/công tơ, được điền từ hồ sơ đã lưu theo phòng, hợp đồng, lần thuê. Ghi nhận chữ ký nằm sau nội dung. Từ biên bản nhận phòng đã xác nhận có liên kết về Chi tiết phòng để chủ nhà xác nhận nhận phòng trước khi chuyển trạng thái Đang thuê.

**Lưu ý:** Các bản ghi mẫu được tạo để phát triển/kiểm thử và không phải chứng cứ tiền chuyển khoản hoặc chữ ký thực tế. Giao diện được giản lược nhãn mẫu theo yêu cầu nhưng bản chất dữ liệu vẫn là mô phỏng. Đây vẫn là bản ứng dụng lưu trong trình duyệt, không nên nhập dữ liệu nhạy cảm/thanh toán thật.
