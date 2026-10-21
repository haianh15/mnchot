# Báo cáo cập nhật: Lưu lịch sử nhắc nợ → Chi tiết thanh toán Thu công nợ

Ngày cập nhật: 21/10/2026

## Nền áp dụng

Cập nhật trực tiếp từ bản `CCMN_MNCHOT_DONG_BO_THANH_TOAN_CONG_NO_VOI_THONG_BAO_21_10_FULL.zip`, không quay lại bản A hay mất các thay đổi liên kết B.

## Thay đổi giao diện và nghiệp vụ

1. Trong Công nợ → Ghi nhận lịch sử nhắc nợ, nút lưu đổi thành **Lưu lịch sử nhắc & mở mã QR**. Sau khi ghi nhận các kỳ thành công, hệ thống tự đóng form và mở `Thông báo thanh toán → Thu công nợ → Chi tiết thanh toán` của thông báo gộp đang hiệu lực, chứa đúng khoản nợ theo phòng và lượt thuê. Không còn ở lại modal tạo QR trong Công nợ.
2. Nếu kỳ nợ chưa có thông báo Thu công nợ, mở trình lập thông báo ở bước chọn các kỳ nguồn cho đúng phòng/lượt thuê; QR chính thức chỉ có sau khi Chủ nhà xác nhận phát hành.
3. Trong lịch sử các lần nhắc nợ, nút **Mở chi tiết Thu công nợ** dẫn đến cùng màn hình thanh toán chính thức. Trường hợp thông báo đã thu có thể xem lịch sử và trạng thái, nhưng QR không còn có hiệu lực.
4. Không dẫn nhầm khi khoản nợ thuộc nhiều thông báo còn hiệu lực hoặc phòng/lượt thuê khác. Không phát sinh thêm thông báo thanh toán hoặc QR ở màn Công nợ.
5. Mã bản ghi nhắc nợ được tạo duy nhất hơn khi lưu nhiều kỳ trong cùng một thao tác, tránh trùng khóa danh sách lịch sử.

## Tệp chỉnh sửa

- `src/components/views/DebtsView.tsx`
- `src/context/AppContext.tsx`
- Thêm `tests/reminderToDebtNotice.test.cjs`

## Kiểm tra

- `node --test tests/*.test.cjs`: **50/50 đạt** (gồm 5 tình huống mới cho điều hướng nhắc nợ đến QR chính thức).
- Phân tích cú pháp 53 tệp TS/TSX: không lỗi.
- Chưa xác nhận `vite build` hoặc giao diện thực tế trong trình duyệt: môi trường thiếu `vite/client` và các thư viện npm, không thể chạy biên dịch toàn phần.

## Ghi chú dữ liệu

Để xem QR phải có thông báo Thu công nợ hợp lệ. Thông báo đã thu hoặc đã thay thế không còn QR dùng để chuyển khoản. Mã nguồn không tự đồng bộ dữ liệu lưu cục bộ trên trình duyệt của từng thiết bị.
