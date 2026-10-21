# BÁO CÁO SỬA LUỒNG LẬP HỢP ĐỒNG VÀ THEO DÕI TRẢ PHÒNG

Ngày 21/10/2026. Bản gốc: CCMN_MNCHOT_NHAC_NO_MO_CHI_TIET_QR_THU_CONG_NO_21_10_FULL.zip.

## 1. Thay đổi chức năng

1. Trong **Quản lý hợp đồng**, nút **+ Lập hợp đồng** mở trực tiếp form **Lập dự thảo hợp đồng thuê phòng**. Màn hình ghi nhận điều kiện thuê (HDT-01) không còn nằm trong luồng điều hướng.
2. Trong **Quản lý phòng**, nút **Lập hợp đồng** điều hướng trực tiếp đến form dự thảo hợp đồng, chọn đúng mã phòng xuất phát, xóa dữ liệu khách thuê/điều kiện cũ khỏi phần điền sẵn; không sinh phiếu điều kiện thuê bắt buộc.
3. Form dự thảo vẫn kiểm tra điều kiện phòng trống, đợt hợp đồng, tiền thuê, hợp đồng chờ nhận phòng và người đại diện không được trùng phòng. Sau khi lập dự thảo thành công vẫn chuyển sang bước gửi/ký theo luồng hiện có.
4. Trong **Theo dõi hạn hợp đồng & trả phòng**, các thao tác **Ghi/Cập nhật ngày trả** và **Liên hệ** mở hộp thoại ngay ở giữa màn hình, thay vì đặt form dưới cuối danh sách. Form có thể đóng, ghi nhận lịch sử và báo lỗi kiểm tra dữ liệu ngay trong hộp thoại.
5. Giữ nguyên xử lý dữ liệu ngày dự kiến trả và nhật ký liên hệ theo phòng và lượt thuê hiện tại (không tác động hợp đồng lịch sử).

## 2. Mã nguồn thay đổi

- `src/components/views/ContractsView.tsx` — thay điều hướng bắt đầu từ điều kiện thuê bằng dự thảo trực tiếp; bỏ hiển thị HDT-01.
- `src/components/views/contracts/HDT02DraftContract.tsx` — nhận mã phòng xuất phát và chạy kiểm tra điều kiện ngay tại bước lập dự thảo; ẩn phần chọn điều kiện thuê.
- `src/components/views/contracts/ContractReturnTracking.tsx` — mở hai biểu mẫu thao tác ở dạng hộp thoại.
- `src/components/views/contracts/HDT03SendAndNegotiate.tsx`, `HDT04ReceiveSignedContract.tsx`, `HDT06RenewalContract.tsx` — thống nhất kiểu tham số điều hướng sau khi bỏ tab điều kiện.
- `tests/directContractAndReturnActions.test.cjs` — 14 kiểm tra hồi quy mới.

Mã nguồn nghiệp vụ và dữ liệu lịch sử ghi nhận điều kiện thuê cũ vẫn được giữ (không xóa dữ liệu người dùng). Các phân hệ Thông báo thanh toán, Thu tiền, Công nợ giữ nguyên từ bản gốc.

## 3. Kiểm thử

- Đã chạy toàn bộ 24 tệp kiểm thử hiện có (kể cả tệp kiểm thử mới), các kiểm tra đều đạt: 365 dòng PASS và 31 tiểu kiểm thử TAP đạt.
- Đã phân tích cú pháp 53 tệp TS/TSX: 0 lỗi cú pháp.
- **Giới hạn:** Chưa kiểm thử build Vite, kiểm tra kiểu toàn dự án hoặc tương tác thực tế trên trình duyệt do môi trường chưa có các gói `node_modules` của dự án. Các bài kiểm thử mới kiểm tra luồng và mã nguồn, không thay thế cho test thao tác bằng trình duyệt.

## 4. Cách cập nhật

Giải nén ZIP, tải các tệp và thư mục bên trong lên repository GitHub `haianh15/mnchot` (nhánh main). Hãy sao lưu dữ liệu trình duyệt trước khi cập nhật và thử các nút trên môi trường chạy thực tế.
