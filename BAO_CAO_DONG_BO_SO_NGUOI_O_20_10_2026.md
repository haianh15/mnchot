# Báo cáo chỉnh sửa – Đồng bộ số người ở (20/10/2026)

## Lỗi gốc

`RoomsView.tsx` hiển thị `room.totalOccupants` (giá trị có thể bị cũ) trong khi Hồ sơ khách thuê hiển thị toàn bộ người ở cùng của khách chính bất kể trạng thái và lần thuê. Thao tác cập nhật người ở cùng cũng không đồng bộ lại tổng người trong phòng.

## Thay đổi

1. Thêm `src/utils/occupancy.ts`: thống nhất cách tính số người ở theo `roomCode` + `currentLeaseId` + khách thuê chính đã nhận phòng + người ở cùng `Đang cư trú`.
2. `RoomsView.tsx`: danh sách phòng, Chi tiết phòng và thông tin khách đều sử dụng cùng kết quả; phòng Trống là 0; thiếu mã khách/lần thuê hiển thị “Chưa xác định”, không lấy giá trị cũ.
3. `TenantsView.tsx`: thống kê cùng nguồn với Chi tiết phòng; tab Người ở cùng phân biệt số người **đang cư trú** với hồ sơ Nháp/Dự kiến/Đã kết thúc, ưu tiên đúng phòng và lần thuê khi đi từ Chi tiết phòng.
4. `HSKT02CoTenants.tsx`: truyền đúng ngữ cảnh phòng/lần thuê, mặc định lọc người đang cư trú khi được mở từ phòng.
5. `AppContext.tsx`: tự hiệu chỉnh `totalOccupants` cũ trong localStorage khi số người hoặc nguồn thay đổi; cập nhật số ngay khi nhận phòng; kiểm tra đúng phòng, khách chính, lần thuê trước khi thêm hoặc xác nhận người ở cùng `Đang cư trú`.
6. `tests/occupancyCount.test.cjs`: bổ sung 12 kiểm tra các tình huống hiện hành, đã chuyển đi, chưa nhận, khác phòng, khác lần thuê.

## Định nghĩa số đếm

- Phòng Trống = **0 đang ở**, kể cả đã ký hợp đồng chờ nhận.
- Đang thuê/Sắp trả: **1 khách thuê chính + số người ở cùng có trạng thái Đang cư trú**, cùng mã phòng, mã lần thuê, mã khách chính.
- Nháp/Dự kiến/Đã kết thúc, lịch sử cư trú của khách trước và hợp đồng khác không tính.
- Phòng đang thuê mà mất liên kết mã khách hoặc mã lần thuê: hiển thị **Chưa xác định** để người quản lý đối chiếu, không tự đoán.

## Kiểm thử

12/12 kiểm tra số người mới đạt; các bài kiểm thử liên kết phòng, trả phòng, bàn giao, quyết toán cọc, hợp đồng đều đạt. Kiểm tra cú pháp 41 TS/TSX đạt; 118 import tương đối không thiếu. **Chưa chạy Vite build hoặc kiểm thử tương tác trong trình duyệt** do thiếu package cài đặt.

## Lưu ý triển khai

Đây vẫn là ứng dụng demo lưu dữ liệu trong trình duyệt, không có cơ sở dữ liệu đồng bộ nhiều thiết bị. Trước khi cập nhật, lưu lại bản ZIP đang dùng. Upload phần nội dung giải nén vào gốc `mnchot`, không kéo thư mục bao ngoài. GitHub web có thể hạn chế ghi đè file trùng; khi có thông báo xung đột cần xử lý bằng GitHub Desktop hoặc commit code.
