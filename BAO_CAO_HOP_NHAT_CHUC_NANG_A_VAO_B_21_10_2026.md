# BÁO CÁO HỢP NHẤT PHẦN MỀM QUẢN LÝ CHUNG CƯ MINI

**Ngày:** 21/10/2026  
**Nền chính:** B — `CCMN_MNCHOT_DONG_BO_MOT_DAI_DIEN_MOT_PHONG_21_10_FULL.zip`  
**Nguồn chức năng chuyển sang:** A — `remix-hệ-thống-quản-lý-chung-cư-mini.zip`

## 1. Nguyên tắc hợp nhất

- **B là gốc**. Giữ nguyên các tệp quan trọng quản lý phòng, hợp đồng, bàn giao, kiểm soát một người đại diện chỉ một phòng, đồng bộ các luồng nhận/trả phòng và điều kiện ký/gia hạn.
- **Thông báo thanh toán theo kỳ:** giữ quy trình đối chiếu kỳ và phát hành thông báo/QR của B.
- **Thông báo thu công nợ:** khôi phục giao diện A, gồm danh sách thông báo, lọc theo kỳ nợ, xem chi tiết và quy trình 3 bước chọn phòng → chọn khoản nợ gốc → hạn thanh toán, tài khoản ngân hàng, xuất QR.
- **Thu tiền:** giữ quy trình thu đủ theo QR, chứng từ và hoàn tác có lý do của B; chuyển thông tin ngày hẹn thanh toán và cách trình bày hạn trả từ A.
- **Công nợ:** bổ sung giao diện A cho cả xem theo từng kỳ và gộp theo phòng, quản lý liên hệ/nhắc nợ, phản hồi và lịch hẹn; giữ giao diện và tính cấn trừ cọc đúng khoản của B để đối chiếu. Có thể chuyển giữa hai cách xem.

## 2. Các quy tắc chống sai số đã bổ sung khi hợp nhất

1. Thông báo công nợ gộp (`noticeType=DEBT`) là **phương tiện thu lại các khoản gốc**, không phải nghĩa vụ mới; báo cáo, dashboard, công nợ và số tiền phải thu phải tránh cộng trùng.
2. Chỉ chọn khoản quá hạn chưa thu của **cùng một phòng, cùng lượt thuê**, không thêm một khoản vào hai thông báo công nợ hiệu lực.
3. Không phát hành QR công nợ trên số tiền gốc nếu đã xử lý cấn trừ cọc; nếu cấn trừ cọc xảy ra sau khi lập QR thì chặn xác nhận thu theo QR không còn đúng số tiền.
4. Khi xác nhận đủ tiền thông báo công nợ, đánh dấu các khoản gốc tương ứng đã thu. Không cho thu trực tiếp thông báo gốc đang thuộc QR thu công nợ hiệu lực.
5. Khi hủy chứng từ thu nhầm (bắt buộc lý do), phục hồi trạng thái nợ đúng khoản, **không xóa mã giao dịch nguồn hoặc lịch sử**.
6. Khi xem báo cáo theo kỳ, một biên lai thu nợ gộp được phân bổ theo đúng các khoản/kỳ gốc, không nhân đôi số tiền thực nhận.
7. Việc ghi nhận lịch hẹn có thể thay đổi ngày đến hạn hiển thị; **hạn gốc `originalDueDate` được giữ** để kiểm tra tình trạng quá hạn. Ngân hàng chưa nhận diện mã VietQR thì không giả định là MB.

## 3. Bố cục sau hợp nhất

**Thông báo thanh toán:** hai tab `Thanh toán theo kỳ` và `Thu công nợ`.

**Thu tiền:** danh sách thông báo / chứng từ / lịch sử sửa thu nhầm; khi khoản gốc thuộc QR công nợ, giao diện chỉ cho thu qua QR gộp.

**Công nợ:** hai tab `Từng kỳ / Theo phòng` (giao diện A) và `Theo dõi và đối chiếu` (giao diện B). Trong chế độ A vẫn đối chiếu cấn trừ tiền cọc theo chứng từ gốc từ B.

## 4. Mã nguồn thay đổi

- `src/App.tsx` — điều hướng giữa các chức năng B và A.
- `src/components/views/PaymentNoticesAView.tsx` — màn hình thu công nợ từ A (bổ sung).
- `src/components/views/DebtsAView.tsx` — công nợ theo kỳ/gộp phòng từ A (bổ sung).
- `src/components/views/PaymentNoticesView.tsx` — giữ thông báo kỳ B, không lẫn thông báo nợ gộp.
- `src/components/views/PaymentReceiptsView.tsx` — thông tin ngày hẹn, hiển thị đúng khoản thu gộp, không xác nhận thu nhầm nguồn.
- `src/components/views/DebtsView.tsx` — không tính trùng nợ gộp, giữ hạn gốc.
- `src/components/views/ReportsView.tsx`, `DashboardView.tsx`, `DepositSettlementView.tsx` — bảo toàn phép cộng và danh sách nợ gốc.
- `src/context/AppContext.tsx`, `src/types/index.ts` — API, dữ liệu, giao dịch và xử lý thu công nợ.
- `tests/mergedAccounting.test.cjs` — kiểm thử bổ sung.

**Không thay đổi so với B:** `RoomsView.tsx`, `ContractsView.tsx`, `HandoverAssetsView.tsx`, `roomLifecycle.ts`, `representativeRoom.ts`.

## 5. Kiểm thử và giới hạn

- Chạy `node --test tests/*.test.cjs`: **29/29 bài/bộ kiểm thử đạt**. Trong đó có **10 bài kiểm tra trực tiếp logic hợp nhất kế toán** (gồm thu gộp, chặn thu trùng, cấn trừ cọc trước/sau phát hành QR, hoàn tác thu nhầm).
- Kiểm tra cú pháp/transpile **52 tệp TypeScript/TSX**: 0 lỗi cú pháp.
- **Chưa chạy được Vite build và kiểm thử E2E trên trình duyệt** vì môi trường thực thi không cài đặt được các gói npm cần thiết. Việc chạy được kiểm thử không phải xác nhận môi trường production.
- Cả A và B đều lưu dữ liệu ở `localStorage` trình duyệt. ZIP chỉ chứa mã nguồn và dữ liệu khởi tạo, **không chứa dữ liệu thực tế** đã nhập ở máy người dùng. Hãy sao lưu dữ liệu trước khi triển khai.

## 6. Hướng dẫn cập nhật GitHub

Repository: https://github.com/haianh15/mnchot  
Upload: https://github.com/haianh15/mnchot/upload/main

1. Sao lưu branch hoặc tải ZIP mã nguồn hiện tại trên GitHub.
2. Giải nén ZIP bàn giao, đưa **nội dung bên trong** lên repository (không upload file ZIP làm mã nguồn).
3. Kiểm tra các tệp trùng tên đã được ghi đè đúng; commit vào nhánh `main` hoặc tạo nhánh thử trước.
4. Cài dependencies `npm install`, chạy `npm run lint`, `npm run build`, `node --test tests/*.test.cjs` tại máy có kết nối npm; kiểm thử thao tác lập thông báo kỳ, công nợ, thu và hoàn tác trên bản sao dữ liệu thực.
