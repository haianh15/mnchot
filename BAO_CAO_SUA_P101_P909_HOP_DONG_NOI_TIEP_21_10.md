# Báo cáo chỉnh sửa ngày 21/10/2026 – P101, P909 và hợp đồng nối tiếp

## 1. Phòng P101: phòng trống được lập hợp đồng mới

- Khi phòng đã **Trống** sau lượt thuê cũ, hợp đồng cũ đã có ngày nhận phòng thực tế chỉ còn là hồ sơ lịch sử, không được dùng để khóa việc kiểm tra trùng lịch hoặc ngăn ký hợp đồng của lượt thuê mới.
- Nút **Lập hợp đồng** trong Quản lý phòng mở điều kiện thuê cho lượt thuê mới; hợp đồng mới là **Hợp đồng lần đầu của lượt thuê mới**, không phải hợp đồng gia hạn của khách cũ.
- Mã `leaseId` của hợp đồng mới được cấp tăng dần và kiểm tra trùng, thay vì tạo ngẫu nhiên. Ví dụ nếu đã dùng `THUE-101-L1` thì lượt thuê mới nhận `THUE-101-L2`.
- Việc ghi nhận ký vẫn yêu cầu đúng hồ sơ khách, xác minh và chứng từ tiền đầu; không tự chuyển phòng sang Đang thuê khi mới ký.

## 2. Phòng P909: biên bản nhận phòng

- Với phòng Trống có hợp đồng giấy đã ký và **chưa nhận phòng**, mở đúng hợp đồng và mã lượt thuê đó trong phân hệ Bàn giao, kể cả khi các trường `pendingLeaseId`/`pendingContractId` được lưu trước đó chưa đồng bộ.
- Phòng không được mở nhầm biên bản của lượt thuê cũ. Bước lưu BG01/BG02/BG03 xác minh lại đúng mã phòng, hợp đồng, lượt thuê, chữ ký giấy và các chứng từ thực tế.
- Màn hình hiển thị cụ thể điều kiện còn thiếu (chứng từ cọc, tiền thuê kỳ đầu, kiểm kê BG01, hiện trạng/ảnh công tơ BG02). **Không vượt qua các điều kiện nghiệp vụ chỉ để cho phép xác nhận.**
- Chưa có dữ liệu localStorage thực tế của P909 trong ZIP nên không thể khẳng định trường cụ thể nào còn thiếu trên trình duyệt của người dùng.

## 3. Lập hợp đồng nối tiếp

- Chỉ được tạo khi **phòng Sắp trả** *hoặc* **ngày kết thúc hợp đồng cũ đã đến/qua**, đồng thời khách vẫn đang thuê đúng phòng và lượt thuê đó, có hợp đồng ký giấy hợp lệ và chưa có hợp đồng nối tiếp cho hợp đồng cũ.
- Với phòng Trống, khách mới hoặc hợp đồng chưa đến hạn mà phòng không Sắp trả, không hiện nút trong chi tiết Quản lý hợp đồng và không xuất hiện trong danh sách lựa chọn lập nối tiếp.
- Hàm xử lý tạo hợp đồng cũng kiểm tra điều kiện lại trước khi lưu, không phụ thuộc vào trạng thái ẩn/hiện nút.
- Hợp đồng nối tiếp giữ nguyên chuỗi lượt thuê và cọc gốc; khách mới sau trả phòng phải có lượt thuê mới và tiền cọc riêng.

## Kiểm thử

- Các bài thử hiện có chạy đạt và bổ sung `tests/renewalAndVacantFixes.test.cjs` với 16 kiểm thử mới, bao gồm trực tiếp hàm nghiệp vụ lập hợp đồng.
- Đã phân tích cú pháp toàn bộ tệp TS/TSX trong `src` không có lỗi parse.
- **Chưa kiểm chứng được `npm run build`/kiểm tra kiểu đầy đủ** do môi trường chưa cài các gói dependencies (ví dụ `vite/client`).

## Cập nhật GitHub

Repository: https://github.com/haianh15/mnchot

Upload files nhánh main: https://github.com/haianh15/mnchot/upload/main

Giải nén ZIP, upload tệp và các thư mục bên trong vào thư mục gốc của repository, sau đó chọn Commit changes. Không tải nguyên file ZIP như một tệp duy nhất lên repository.
