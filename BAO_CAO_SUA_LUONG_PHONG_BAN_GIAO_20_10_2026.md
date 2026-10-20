# BÁO CÁO CẬP NHẬT QUẢN LÝ PHÒNG – BÀN GIAO

Ngày cập nhật: 20/10/2026. Cơ sở: bản website `CCMN_MNCHOT_DA_SUA_BIEN_BAN_NHAN_PHONG_VA_BO_DAU_TRA_CUU_FULL.zip`, báo cáo rà soát ngày 19/10, biên bản họp 17/10 và các quy tắc nghiệp vụ đã chốt.

## Các thay đổi đã triển khai

1. **P0-01 – Kiểm kê/hiện trạng:** đọc và lưu theo bộ ba mã phòng – hợp đồng – lần thuê; không ghi đè bản ghi của khách khác chỉ vì trùng phòng. Có xác nhận kiểm kê thực tế trước khi lưu hoàn tất.
2. **P0-02 – Biên bản nhận phòng kế thừa:** chỉ đi theo chuỗi hợp đồng nối tiếp của cùng **một mã lần thuê**, không lấy biên bản của lần thuê cũ. Thêm kiểm thử hồi quy cho trường hợp tham chiếu hợp đồng trước sai.
3. **P0-03 – Nhận lại phòng:** xác nhận độc lập chỉ được phép khi đã lưu một kết quả **Đã nhận lại** chính thức, đúng lần thuê, đủ kiểm tra tài sản, chỉ số điện/nước và mô tả chứng cứ. Hàm trả kết quả thành công/thất bại, nút bấm hiển thị đúng kết quả thực.
4. **P0-04 – Chứng cứ giả:** bỏ chỉ số điện nước cuối kỳ, ảnh, lời xác nhận và danh mục kiểm tra được điền sẵn. Chỉ số 0 vẫn là giá trị hợp lệ nếu chủ nhà thực sự nhập 0. Ba nút Thêm ảnh sử dụng tệp ảnh do người thao tác chọn (JPG/PNG/WEBP, <=5 MB), không chèn ảnh kho stock.
5. **P0-05 – Mã nghiệp vụ giả:** bỏ các mã lần thuê/hợp đồng cố định dự phòng ở biểu mẫu ghi nhận trả. Các hàm lưu từ chối trường hợp không khớp với hợp đồng đã ký thật của phòng và lần thuê.
6. **P1-06 – Hoàn tất biên bản trả:** bắt buộc kết quả nhận lại đã xác nhận, kết quả đối chiếu tài sản không có phần chờ xử lý và kết quả quyết toán cọc đúng phiên bản, đã có căn cứ thống nhất.
7. **P1-07 – Tiền cọc:** bỏ số tiền/mã QTC cố định, lấy trực tiếp từ hồ sơ quyết toán của đúng lần thuê. Không coi tình trạng đã gán mã bất kỳ là đã đồng bộ hợp lệ.
8. **P1-08 – Bàn giao từ menu:** phát hiện hợp đồng đã ký chờ nhận của phòng Trống; không lấy ngẫu nhiên hợp đồng lịch sử.
9. **P1-09 – Lưu nháp trả phòng:** kiểm tra tình trạng *biên bản trả phòng* thay vì tình trạng biên bản nhận phòng.
10. **P2-10 – Mô phỏng:** loại thao tác chèn dữ liệu giả và checkbox mô phỏng lỗi khỏi giao diện người dùng. Không tự xác nhận đã nhận lại khi chưa có biên bản.
11. **Đồng bộ nút bấm:** lưu kiểm kê, hiện trạng, kiểm tra nhận lại và biên bản trả phòng hiển thị phản hồi thực từ hàm lưu; không thông báo thành công giả nếu bị từ chối.

## Quy tắc luồng được giữ nguyên

- Phòng mới: Trống, tầng là số nguyên >=1; chưa có khách/hợp đồng sẽ không có hồ sơ nhận/trả để xem.
- Ký hợp đồng gắn hồ sơ phòng/hợp đồng/khách và lần thuê, **không** tự chuyển phòng thành Đang thuê.
- Chỉ nhận phòng khi đã đáp ứng điều kiện tiền đầu và biên bản nhận phòng có xác nhận ký giấy.
- Kế hoạch trả ở **Quản lý hợp đồng**, phân biệt hạn hợp đồng với ngày dự kiến trả.
- Nhận lại phòng thực tế đã xác nhận thì có thể chuyển phòng sang Trống; quyết toán cọc tiếp tục trong Chi tiết hợp đồng và không tự động bị coi là hoàn tất.
- Biên bản của lần thuê cũ không được mượn cho lần thuê mới cùng phòng.

## Kiểm tra thực hiện

- `node tests/roomLinks.test.cjs` – 8 trường hợp.
- `node tests/returnTracking.test.cjs` – 10 trường hợp.
- `node tests/handoverIntegrity.test.cjs` – 13 trường hợp.
- `node tests/handoverValidation.test.cjs` – 14 trường hợp.
- Phân tích cú pháp toàn bộ TS/TSX và kiểm tra đường dẫn các import tương đối.

**Giới hạn còn tồn tại:** chưa chạy được `npm run build` và kiểm thử trình duyệt end-to-end trong môi trường này (không cài được dependencies), do đó không thể tuyên bố 63 UC đã được nghiệm thu. Website vẫn là bản demo dùng localStorage, không có cơ sở dữ liệu tập trung hoặc xác minh giao dịch ngân hàng tự động. Ảnh lưu dạng dữ liệu trong trình duyệt có thể chạm giới hạn dung lượng; để sử dụng thật cần backend lưu tệp và cơ chế sao lưu. Dữ liệu demo cũ có thể thiếu biên bản/không khớp, ứng dụng không tự tạo chứng cứ giả và cần người dùng đối chiếu hồ sơ giấy.

## Cập nhật GitHub

Tải ZIP, giải nén, chọn **các mục nằm bên trong** và tải lên root repo `haianh15/mnchot`, giữ nguyên đường dẫn `src/...`, `tests/...`, `package.json`. Không tải nguyên thư mục bao ngoài. File cũ không còn trong ZIP sẽ không được tự xóa khi cập nhật qua giao diện GitHub web.
