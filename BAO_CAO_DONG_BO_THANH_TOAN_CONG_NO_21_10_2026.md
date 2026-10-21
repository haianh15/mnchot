# BÁO CÁO SỬA LIÊN KẾT CÔNG NỢ – THÔNG BÁO THU CÔNG NỢ

Ngày 21/10/2026

## Yêu cầu
Sử dụng bản B và các giao diện tài chính A đã đồng bộ làm gốc. Khi người quản lý bấm Thanh toán tại Công nợ, đi vào Chi tiết của chính thông báo ở Thông báo thanh toán > Thu công nợ, không hình thành luồng thu tiền/QR riêng biệt.

## Thực hiện
1. `src/components/views/DebtsView.tsx`: tạo hành động Thanh toán cho từng kỳ, nhóm phòng/lượt thuê, vùng chọn nhiều kỳ, và trang căn cứ; tất cả đều dùng chung hàm điều hướng; nợ hai lượt thuê cùng phòng được tách rõ. QR nhắc nợ không còn tạo thông tin chuyển khoản khác nguồn chính thức. Dữ liệu nhắc nợ/hẹn trả vẫn giữ.
2. `src/components/views/PaymentNoticesView.tsx`: tiếp nhận đích từ Công nợ; có thông báo thì mở Chi tiết, chưa có thì mở wizard đúng bước/kỳ/lượt thuê, sau phát hành mở Chi tiết; cập nhật bản ghi đang xem theo `paymentNotices` mới nhất. Chi tiết thu công nợ đọc số tiền, trạng thái và ngày hẹn trả của từng thông báo kỳ nợ gốc.
3. `src/App.tsx`: truyền định danh khoản nợ nguồn trong bộ tham số điều hướng; không thay dữ liệu hoặc nghiệp vụ Quản lý phòng, Hợp đồng, Bàn giao, Quyết toán cọc.
4. `src/utils/debtPaymentRouting.ts`: bộ định tuyến chung, kiểm tra khoản đang hiệu lực/chưa thu, cùng phòng, cùng lượt thuê, hạn gốc và tránh thu gộp nhiều thông báo không tương thích.
5. `tests/debtPaymentRouting.test.cjs`: 11 ca kiểm thử mới (có thông báo, chưa có, nhiều kỳ, khoản gộp chồng, phòng/lượt thuê khác, khoản đã thu, chưa quá hạn, điểm nối giao diện).

## Trạng thái khi thanh toán
- Có QR thu công nợ gộp hợp lệ: Công nợ → Chi tiết thông báo Thu công nợ → Xác nhận thu tại Thu tiền.
- Chưa có QR gộp: Công nợ → Chọn tháng nợ (đã chọn đúng kỳ) → Chủ nhà xác nhận lập → Chi tiết → Thu tiền.
- Đã thu đủ: thông báo gộp và các kỳ nguồn chuyển Đã thu; không còn trong Công nợ quá hạn.
- Hoàn tác thu nhầm có lý do: thông báo gộp và kỳ nguồn khôi phục Chưa thu; lưu nguyên lịch sử giao dịch.
- Không thu trùng từ QR kỳ nguồn đang thuộc QR gộp; không trộn dữ liệu hai lượt thuê của cùng phòng.

## Kiểm tra
- Toàn bộ 45/45 bài kiểm thử Node đạt, gồm 34 ca/bộ trước đó và 11 ca/bộ mới.
- Phân tích cú pháp TypeScript/TSX đạt 53/53 tệp, không phát hiện lỗi cú pháp.
- Chưa thực thi được `npm run build`/`npm run lint` đầy đủ vì máy làm việc chưa có phụ thuộc npm (`vite/client`, React...). Chưa kiểm thử thao tác trực tiếp trên trình duyệt của người dùng.
- Chưa can thiệp dữ liệu `localStorage` hiện đang lưu trong trình duyệt. Nên sao lưu và thử trên dữ liệu bản sao trước khi triển khai.

GitHub: https://github.com/haianh15/mnchot/upload/main
