# BÁO CÁO – GIAO DIỆN A, DỮ LIỆU VÀ QUY TẮC B

Ngày: 21/10/2026

**Nguồn gốc**
- Bản B: `CCMN_MNCHOT_B_GOC_HOP_NHAT_THANH_TOAN_THU_TIEN_CONG_NO_A_21_10_FULL.zip` (nền ứng dụng, dữ liệu và nghiệp vụ)
- Bản A: `remix-hệ-thống-quản-lý-chung-cư-mini.zip` (giao diện Thông báo thanh toán, Thu tiền, Công nợ)

## 1. Giao diện

1. `PaymentNoticesView.tsx`: trở lại một màn hình **Thông báo thanh toán** như A, với hai tab nội bộ **Thanh toán theo kỳ** / **Thu công nợ**, tìm kiếm, lọc, chi tiết, QR và wizard thu nợ 3 bước. Bỏ các tab ghép ngoài của bản hợp nhất trước.
2. `PaymentReceiptsView.tsx`: giữ giao diện A gồm các tab **Theo dõi thanh toán**, **Chứng từ thu** và **Lịch sử sửa thu nhầm**, ngày hẹn thanh toán có nhãn, đồng thời không mở thao tác thu trực tiếp nếu khoản gốc đang thuộc QR thu nợ gộp.
3. `DebtsView.tsx`: dùng giao diện A gồm danh sách kỳ quá hạn, công nợ theo phòng, nhắc nợ, phản hồi/lịch hẹn, xem chi tiết, QR; tích hợp cấn trừ cọc đúng kỳ của B.
4. Giữ `src/index.css` của B (chỉ bổ sung chế độ in hợp đồng ngoài CSS chung, không thay bố cục A).
5. Giữ hai phiên bản giao diện B cũ tại `PaymentNoticesBView.tsx` và `DebtsBView.tsx` để lưu mã, nhưng không hiển thị đồng thời trong điều hướng.

## 2. Liên kết dữ liệu

- **Phòng – Hợp đồng – Lượt thuê:** sử dụng chính `rooms`, `contracts` từ AppContext B; ưu tiên ghép khách thuê bằng `roomCode + leaseId`, không gán khách thuê hiện tại vào thông báo của lượt thuê đã kết thúc.
- **Tính tiền:** danh sách tạo thông báo chỉ lấy `periodBills` được xác nhận. Nút **Lập thông báo →** trên mỗi bảng tính xác nhận mở đúng bảng tính bên A; sau khi đã phát hành, nút **Xem thông báo →** mở đúng thông báo hiệu lực.
- **QT07.1/07.2:** Khi Chủ nhà nhấn lập thông báo theo giao diện A, backend B đối chiếu hai nhóm tiền và ghi hồ sơ xác nhận đối chiếu trước khi phát hành; không phát hành từ bảng tính chưa xác nhận, thiếu hợp đồng cùng lần thuê, thiếu tài khoản ngân hàng đang sử dụng, hoặc tạo trùng thông báo đang hiệu lực.
- **Tiền phải thu:** xem trước trên A được tính theo đúng công thức B, loại trừ tiền thuê tháng đầu đã thu và tiền thuê kỳ tiếp theo của lượt thuê đã kết thúc, không cộng nợ cũ vào kỳ mới.
- **Tài khoản ngân hàng và QR:** lựa chọn tài khoản hoạt động trong A được phản ánh đúng trên chứng từ và QR B; không gán nhầm tài khoản mặc định. Mỗi QR lưu bản chụp ngân hàng và số tiền tại thời điểm tạo.
- **Thu tiền:** `paymentReceipts` của B tham chiếu `noticeId`, `roomCode`, `leaseId`, `periodCode`; chặn thanh toán trùng, chỉ chấp nhận thu đủ theo QR, hoàn tác yêu cầu lý do và giữ lịch sử.
- **Công nợ:** thông báo thu nợ gộp `DEBT` tham chiếu các `debtNoticeIds` kỳ gốc; không tính thành khoản phải thu mới, thu gộp đánh dấu đã thu cả kỳ nguồn, hoàn tác phục hồi trạng thái. Kết quả cấn trừ cọc đã hoàn tất được xét khi lập/thu QR nợ.
- **Lượt thuê cũ/mới cùng phòng:** chọn thu nợ theo cặp `roomCode + leaseId`, không trộn nghĩa vụ của hai người thuê khác nhau.
- **Trạng thái:** quá hạn tính bằng hạn gốc; lịch hẹn trả không tự làm mất công nợ quá hạn.

## 3. Phần B giữ nguyên tệp

`RoomsView.tsx`, `ContractsView.tsx`, `HandoverAssetsView.tsx`, `representativeRoom.ts`, `roomLifecycle.ts`, `contractEligibility.ts`, `DepositSettlementView.tsx`, `ReportsView.tsx`, `DashboardView.tsx` giữ nguyên nội dung so với bản B nền. Không sửa dữ liệu phòng/hợp đồng/cọc khởi tạo.

## 4. Kiểm thử

- `node --test tests/*.test.cjs`: **34/34 đạt** (bao gồm kiểm thử tạo thông báo A trên dữ liệu B, tiền đã trả trước, mã phòng/lượt thuê, tài khoản nhận, không tạo trùng, thu gộp, hoàn tác và tránh cộng trùng).
- Kiểm tra cú pháp TypeScript/TSX qua trình biên dịch TypeScript: **52/52 tệp parse/transpile thành công**.
- **Giới hạn:** chưa có đủ thư viện npm ở môi trường xử lý để chạy `npm run build`, `npm run lint` có đủ kiểu React hay kiểm thử tương tác thực tế trên trình duyệt. Kết quả kiểm thử chưa tương đương triển khai thực tế.

## 5. Hướng dẫn trước khi đưa vào dùng

1. Sao lưu repository và dữ liệu trình duyệt trước khi upload.
2. Giải nén ZIP, upload **nội dung bên trong** vào nhánh GitHub của bạn.
3. Trên máy có kết nối internet, `npm install`, `npm run lint`, `npm run build`, `node --test tests/*.test.cjs`.
4. Thử luồng trên bản sao dữ liệu: bảng tính xác nhận → lập thông báo → chọn ngân hàng → QR → xác nhận thu tiền → kiểm tra nợ kỳ gốc; thử nợ quá hạn → QR nợ gộp → thu và hoàn tác; thử các phòng có nhiều lượt thuê liên tiếp.

GitHub upload: https://github.com/haianh15/mnchot/upload/main

**Lưu ý an toàn dữ liệu:** ứng dụng hiện lưu trong localStorage, không phải hệ thống máy chủ/bank đối soát tự động; dữ liệu đã nhập trên trình duyệt người dùng không nằm trong ZIP.
