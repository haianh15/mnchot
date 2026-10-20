# Báo cáo sửa liên kết khách thuê sau khi ký hợp đồng

Bản nền: CCMN_MNCHOT_LAP_PHIEU_TRA_NGAY_KHI_BAT_DAU_BAN_GIAO_FULL.zip

## Các thay đổi

1. Form dự thảo không tự chọn hồ sơ khách đầu tiên; người quản lý phải chọn rõ khách thuê trước khi lưu. Đổi điều kiện thuê sẽ xóa lựa chọn khách cũ khi điều kiện mới chưa gắn khách.
2. Hàm tạo dự thảo và ghi nhận hợp đồng đã ký kiểm tra hồ sơ thật theo mã khách, đối chiếu họ tên và CCCD nếu cả hai phía có số. Không chấp nhận ký khi thiếu hồ sơ hoặc đã xác minh không hợp lệ.
3. Ghi nhận ký hợp đồng phòng trống liên kết `pendingContractId` và `pendingLeaseId`, giữ trạng thái Trống và số người cư trú bằng 0. Chỉ xác nhận nhận phòng mới chuyển Đang thuê.
4. Chi tiết hợp đồng hiển thị hồ sơ khách đứng tên, mã hồ sơ, phân biệt đã ký/chưa nhận phòng; nút Xem hồ sơ khách thuê mở đúng mã khách/phòng/hợp đồng/lần thuê.
5. Chi tiết phòng thể hiện tên và mã hồ sơ của khách đã ký, và cảnh báo khi hợp đồng đã ký nhưng không tìm thấy hồ sơ nguồn.
6. Hồ sơ khách thuê hiển thị liên kết ký hợp đồng và trạng thái nhận phòng, không đếm khách chờ nhận thành cư dân.
7. Thêm `contractTenantLink.ts` và `signedTenantBinding.test.cjs` để kiểm tra chống liên kết sai người, thiếu hồ sơ và điều hướng.

## Phạm vi xác nhận

- 15/15 kiểm tra riêng mới đạt; 10/10 bộ kiểm thử cũ chạy đạt.
- 44 tệp TypeScript/TSX được kiểm tra cú pháp thành công.
- Chưa build Vite / kiểm thử trình duyệt do chưa cài đủ gói thư viện dự án trong môi trường hiện tại.
- Bản demo lưu localStorage; hợp đồng cũ hỏng liên kết hoặc hồ sơ đã bị xóa không được tự bịa hồ sơ mới. Phải đối chiếu hồ sơ thật và xử lý nguồn dữ liệu trước khi vận hành.
- Chưa sửa các nghiệp vụ không liên quan đến liên kết hợp đồng và hồ sơ khách thuê.
