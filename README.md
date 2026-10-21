# BẢN B LÀM GỐC – GIAO DIỆN A CHO THÔNG BÁO / THU TIỀN / CÔNG NỢ

Ba phân hệ Thông báo thanh toán, Thu tiền và Công nợ hiển thị theo giao diện A; tất cả sử dụng chung `AppContext`, dữ liệu phòng, lượt thuê, hợp đồng, tính tiền và nguyên tắc kiểm soát của B. Không còn tab chọn giao diện A/B nằm ngoài màn hình. Đọc `BAO_CAO_GIAO_DIEN_A_DONG_BO_DU_LIEU_B_21_10.md` để xem chi tiết và giới hạn kiểm thử.

---

# Hệ thống quản lý chung cư mini

Ứng dụng dành cho một vai trò **Quản lý/Chủ nhà**, giao diện bằng tiếng Việt.

## Chạy dự án

```bash
npm install
npm run dev
```

Để triển khai lên Vercel: Framework `Vite`, Root Directory `./`, Build Command `npm run build`, Output Directory `dist`.

## Điều hướng theo hồ sơ

Ứng dụng mở **Quản lý phòng** sau khi đăng nhập. Menu bên trái chỉ chứa các nhóm chức năng chính. Để thực hiện công việc, chọn phòng, khách hoặc hợp đồng cụ thể; các màn hình tiếp theo chỉ mở khi bấm **Tiếp tục** hoặc hành động tương ứng và khi đủ điều kiện nghiệp vụ.

- Nhận phòng: kiểm tra hợp đồng và khoản thu → bàn giao đã ký → đối chiếu người nhận → xác nhận nhận phòng.
- Trả phòng: kiểm tra kết quả nhận lại → xác nhận ngày trả phòng.
- Ghi chỉ số: chọn phòng/kỳ → nhập chỉ số → xác minh bất thường (nếu có) và lưu.
- Bàn giao: chọn Nhận phòng / Trả phòng / Sự cố; chỉ hiện công việc đang xử lý.
- Quyết toán cọc chỉ mở từ Chi tiết hợp đồng.

Các tên, mã Use Case, mã quy tắc và ghi chú đặc tả chỉ phục vụ lập trình, **không hiển thị dưới dạng nhãn điều hướng hay đánh số thao tác trong giao diện**.

## Lưu ý bảo mật

Đây là phiên bản demo React có dữ liệu lưu cục bộ trong trình duyệt, **chưa có backend xác thực, cơ sở dữ liệu và email khôi phục mật khẩu thực tế**. Không sử dụng dữ liệu khách thuê hay giao dịch thật. Chưa được chứng nhận vượt qua toàn bộ kiểm thử tích hợp 63 Use Case.


## Cập nhật 19/10 – Theo dõi trả phòng

Danh sách theo dõi trả phòng đã chuyển vào **Quản lý hợp đồng**; Quản lý phòng chỉ giữ các thao tác chi tiết phòng, không có danh sách trùng. Xem `BAO_CAO_CHUYEN_THEO_DOI_TRA_PHONG.md`. Chạy `npm run test:returns` để kiểm tra liên kết.

## Cập nhật luồng phòng – bàn giao (20/10/2026)

Xem `BAO_CAO_SUA_LUONG_PHONG_BAN_GIAO_20_10_2026.md` để biết các sửa lỗi liên kết đúng hợp đồng/lần thuê, chứng cứ kiểm kê và trả phòng, đồng bộ quyết toán cọc. Chạy `npm run test:handover` để thực hiện các bài kiểm tra hồi quy sau khi cài dependencies.

**Giới hạn:** dự án là bản demo dùng localStorage. Không sử dụng như hệ thống thanh toán/hồ sơ nghiệp vụ thật trước khi hoàn thiện backend, sao lưu và kiểm thử end-to-end.

## Cập nhật liên kết Phòng – Bàn giao (20/10/2026)

Đã rà soát lại liên kết mã phòng/hợp đồng/lần thuê, hồ sơ nhận phòng kế thừa, kết quả trả phòng, xác nhận ký giấy, dữ liệu kiểm kê, hiện trạng và đối chiếu cọc. Xem `BAO_CAO_KIEM_TRA_SUA_LIEN_KET_PHONG_BAN_GIAO_20_10.md`.

Sau khi `npm install`, chạy `npm run test:handover` (có thêm 29 trường hợp kiểm tra), cùng `npm run test:occupancy`, `npm run test:settlement` và `npm run test:contract`.

## Đồng bộ vòng đời phòng toàn hệ thống (21/10/2026)

Quy trình ký hợp đồng → bàn giao → nhận phòng → đang thuê → trả phòng → lập lần thuê mới/gia hạn dùng chung bộ xử lý `src/utils/roomLifecycle.ts`. Tất cả phòng và hợp đồng được đối chiếu theo mã phòng, mã hợp đồng, `leaseId`, chứng từ và sự kiện nhận/trả thực tế. Không có nhánh điều kiện riêng cho mã phòng P.101, P.909 hoặc phòng mẫu khác. Xem báo cáo `BAO_CAO_DONG_BO_LOGIC_TOAN_BO_PHONG_21_10_2026.md` và chạy `node tests/globalRoomWorkflow.test.cjs` để kiểm tra.

## Quy tắc người đại diện một phòng (21/10/2026)
- Một hồ sơ khách đại diện chỉ được liên kết với **một phòng chưa kết thúc thuê**; hệ thống chặn tạo/ký hợp đồng ở phòng thứ hai nếu trùng hồ sơ/CCCD (hoặc trùng cả họ tên + SĐT khi thiếu CCCD).
- Có thể ký hợp đồng nối tiếp cho **chính phòng đó** theo đúng điều kiện gia hạn, hoặc đại diện phòng mới sau khi **phòng trước đã hoàn tất trả**.
- Chi tiết thay đổi và kiểm thử: `BAO_CAO_RANG_BUOC_MOT_NGUOI_DAI_DIEN_MOT_PHONG_21_10.md`.

## Bản hợp nhất chức năng thanh toán/thu tiền/công nợ từ A (21/10/2026)

Giữ nguyên bản B làm nền và bổ sung hai module từ A: `PaymentNoticesAView.tsx` (lập thông báo thu công nợ theo phòng/kỳ) và `DebtsAView.tsx` (công nợ xem theo kỳ hoặc gom phòng). Luồng Thu tiền của B được bổ sung thông tin ngày hẹn từ A và chống thu trùng theo QR gộp. **Xem `BAO_CAO_HOP_NHAT_CHUC_NANG_A_VAO_B_21_10_2026.md` để biết chức năng, nguyên tắc tránh cộng trùng và giới hạn kiểm thử.**

Chạy kiểm thử: `node --test tests/*.test.cjs`.


## Cập nhật 21/10/2026 — Đồng bộ Thanh toán Công nợ với Thông báo thu công nợ

- Tại Công nợ, bấm **Thanh toán** ở một kỳ, nhiều kỳ được chọn, nhóm phòng/lượt thuê hoặc trang căn cứ nợ: mở **Thông báo thanh toán → Thu công nợ**.
- Nếu khoản đã thuộc **một thông báo thu công nợ đang hiệu lực**: vào thẳng **Chi tiết** của đúng thông báo, dùng QR, tài khoản và tổng tiền đã phát hành.
- Nếu chưa có thông báo gộp: mở bước **Chọn tháng nợ** trong chức năng Lập thông báo thu công nợ đã điền đúng phòng, lượt thuê, kỳ nợ; Chủ nhà xác nhận lập thông báo và mới được vào Chi tiết. Không tự phát hành QR ở Công nợ.
- Nếu nhiều khoản đang nằm ở **nhiều thông báo gộp khác nhau**: yêu cầu xử lý riêng từng kỳ, không tạo thu trùng.
- Danh sách công nợ gộp theo **phòng + mã lượt thuê** để không lẫn nợ của khách cũ với khách mới cùng phòng.
- Trang Chi tiết thu công nợ hiện mã thông báo kỳ nguồn, số tiền, trạng thái và các ngày hẹn trả ghi nhận trong Công nợ; cùng đọc một kho `paymentNotices`/`debtPromises`.
- Xác nhận thu tiền và hoàn tác thu nhầm tiếp tục dùng **một** `PaymentReceipt`/`noticeId` và logic B; cập nhật đồng thời trạng thái chứng từ nợ gộp và các kỳ nợ gốc. Hiện nghiệp vụ B yêu cầu nhận **đúng đủ** số tiền QR, chưa hỗ trợ thu một phần.
- QR nhắc nợ trong Công nợ không tạo mã chuyển khoản mới; chỉ hiện mã từ một thông báo thu công nợ tương ứng, còn hiệu lực và khớp đầy đủ các kỳ đang chọn. Lịch sử nhắc nợ vẫn được giữ; QR cũ đã thanh toán/thay thế sẽ không được dùng làm QR thanh toán mới.

**Kiểm thử:** `node --test tests/*.test.cjs` — 45/45 đạt, gồm 11 ca cho điều hướng liên kết công nợ. Kiểm tra cú pháp 53/53 tệp TS/TSX đạt. Chưa xác minh được bản build và trình duyệt trực tiếp do môi trường thiếu thư viện npm; cần chạy `npm install && npm run build` trước triển khai.

### Cập nhật 21/10: Nhắc nợ mở QR Thu công nợ
Khi lưu lịch sử nhắc nợ trong Công nợ, hệ thống mở thẳng Chi tiết thanh toán của thông báo **Thu công nợ** còn hiệu lực. Nếu chưa có thông báo, hệ thống mở trình lập thông báo đã chọn đúng kỳ nợ. Nhật ký cũ cũng mở cùng màn hình chính thức, không dùng QR tạo riêng. Xem `BAO_CAO_CHUYEN_NHAC_NO_SANG_CHI_TIET_QR_21_10.md`.

### Cập nhật 21/10/2026 – lập hợp đồng trực tiếp và theo dõi trả phòng

- Bỏ màn hình trung gian “Ghi nhận điều kiện thuê” khỏi luồng lập hợp đồng; chọn **Lập hợp đồng** ở Quản lý hợp đồng / Quản lý phòng để tới dự thảo ngay.
- Hai nút “Ghi/Cập nhật ngày trả” và “Liên hệ” trong Theo dõi hạn hợp đồng mở form ngay trong hộp thoại.
- Các kiểm tra phòng, người đại diện và hợp đồng vẫn hoạt động tại bước tạo dự thảo.
- Xem `BAO_CAO_SUA_LAP_HOP_DONG_VA_GHI_NGAY_TRA_21_10.md`.

---

## Kiểm tra chuẩn bị chốt 21/10/2026

Xem **`BAO_CAO_NGHIEM_THU_CUOI_21_10_2026.md`** trước khi triển khai. Bản này bổ sung kiểm tra tính nhất quán chuỗi phòng → hợp đồng → bàn giao → tính tiền → thông báo → thu tiền → công nợ; khắc phục các điều kiện xác nhận/hoàn tác và hiển thị cảnh báo bảng tính lịch sử thiếu hợp đồng nguồn. Chạy kiểm thử: `node --test tests/*.test.cjs`. Không tự động sửa hoặc xóa chứng từ lịch sử; cần đối chiếu thủ công dữ liệu P.202 lượt `THUE-202-L1`. Chưa xác minh được bản build và thao tác E2E trên trình duyệt trong môi trường biên soạn.
