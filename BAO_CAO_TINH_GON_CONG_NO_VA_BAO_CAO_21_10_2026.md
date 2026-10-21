# Biên bản chỉnh sửa giao diện Công nợ và Báo cáo – 21/10/2026

**Bản nền:** CCMN_MNCHOT_BAN_CHOT_KIEM_TRA_TOAN_BO_LUONG_21_10_2026.zip.

## Thay đổi

1. **Công nợ:** bỏ 5 nút **Thanh toán** (tại thanh công cụ chọn nhiều kỳ, mỗi dòng công nợ, nhóm theo phòng, dòng kỳ trong nhóm, trang căn cứ). Giữ lại **Nhắc nợ**, **Hẹn trả**, **Lưu lịch sử nhắc & mở mã QR**, và đường dẫn đến QR chính thức từ lịch sử nhắc. Không thay đổi cơ chế hạch toán hoặc chứng từ thu tiền.
2. **Lập báo cáo tổng hợp:** bỏ hậu tố mã **BC-04** trên nút và các thông báo điều hướng liên quan; giữ nguyên màn hình và chức năng lập/lưu/xuất báo cáo.
3. **Báo cáo:** bỏ **Khoản nợ bù cọc** khỏi KPI, bảng đối soát, báo cáo tổng hợp, cột bảng tài chính, phần tra cứu nguồn có khoản bù nợ và nội dung CSV xuất ra. **Không bỏ số liệu/khấu trừ nội bộ**: số dư chưa thu vẫn trừ khoản đã xử lý bằng tiền cọc và snapshot cũ vẫn giữ trường tương thích.
4. **Khoản thu / Nguồn:** thay mã tài liệu bằng nhãn: **Tiền thuê kỳ đầu**, **Tiền thuê kỳ tiếp theo**, **Điện nước & dịch vụ** (kể cả file CSV). Không tự tạo mã giao dịch bắt đầu bằng PH07 khi thông tin giao dịch bị thiếu.

## Phạm vi thay đổi

- `src/components/views/DebtsView.tsx`
- `src/components/views/ReportsView.tsx`
- Cập nhật `tests/debtPaymentRouting.test.cjs` theo yêu cầu mới, thêm `tests/reportAndDebtUiCleanup.test.cjs`.

## Kiểm thử

- Chạy 26 file kiểm thử với **43 ca đạt, 0 ca thất bại**.
- Kiểm tra cú pháp độc lập **53 file TypeScript/TSX**, **0 lỗi cú pháp**.
- Chưa xác nhận build Vite hoàn chỉnh hoặc thao tác người dùng trên trang đang triển khai (môi trường chưa có đủ các thư viện dự án).

## Cần nhớ

Đây là thay đổi giao diện/thông tin hiển thị; không thay đổi dữ liệu lưu trong trình duyệt và không gỡ quy tắc cấn trừ tiền cọc của nghiệp vụ quyết toán.
