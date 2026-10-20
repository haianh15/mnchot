# Cập nhật giao diện Quản lý hợp đồng – Gộp theo dõi hạn hợp đồng và trả phòng

Nguồn cập nhật: `CCMN_MNCHOT_XAC_NHAN_COC_THANH_TOAN_NGOAI_HE_THONG_FULL.zip`.

## Nội dung đã sửa

1. Giữ Danh sách hợp đồng là màn hình mặc định; bố cục công cụ theo ảnh: Tìm kiếm, **Lịch hợp đồng chung**, **Theo dõi hạn hợp đồng**, **Quản lý quyết toán cọc**, **+ Lập hợp đồng**. Giữ bộ lọc Tất cả hợp đồng / Cần hoàn tất quyết toán cọc.
2. **Theo dõi hạn hợp đồng** nay là **một màn hình hợp nhất** với danh sách có hai cột độc lập:
   - **Ngày hết hạn hợp đồng**: lấy từ ngày kết thúc của hợp đồng đã lưu.
   - **Ngày dự kiến trả phòng**: chỉ có khi có kế hoạch trả đang theo dõi, trùng mã phòng/lần thuê hiện tại và ngày đã ghi nhận.
3. Cho lọc theo hợp đồng/phòng/khách thuê, trạng thái phòng, hợp đồng còn tối đa 15 ngày, có/chưa có kế hoạch trả, khoảng ngày với lựa chọn loại ngày.
4. Giữ thao tác **Ghi/Cập nhật ngày trả**, **Liên hệ**, **Xem hợp đồng**, **Xem phòng** đối với lần thuê hiện hành; không mở các thao tác cập nhật từ hợp đồng/lần thuê cũ.
5. Nút **Xem kế hoạch trả** từ Chi tiết phòng tiếp tục chuyển kèm mã phòng, mã hợp đồng, mã lần thuê đến cùng màn hình hợp nhất, không tự chọn hồ sơ khác.
6. Không thay đổi nghiệp vụ quản lý phòng, bàn giao, cọc, ghi chỉ số và quy tắc tiền đã đối chiếu ngoài hệ thống.

## File mã nguồn thay đổi

- `src/components/views/ContractsView.tsx`
- `src/components/views/contracts/ContractReturnTracking.tsx`
- `tests/returnTracking.test.cjs` (cập nhật bài kiểm tra cho luồng gộp)

## Phạm vi kiểm tra

- Các bài kiểm tra `test:handover`, `test:returns`, `test:meters`, `test:settlement`, `test:contract`, `test:pre-sign-payment` chạy đạt (các bài kiểm tra hiện có, không tương đương kiểm thử E2E).
- Kiểm tra cú pháp 45 file TypeScript/TSX: không phát hiện lỗi cú pháp.
- 131 đường dẫn import tương đối: không thiếu.
- Chưa chạy build Vite vì môi trường thiếu phụ thuộc `vite` (`vite: not found`). Cần chạy `npm install && npm run build` tại máy có thể cài thư viện và kiểm tra thực tế trên trình duyệt.

## Cập nhật GitHub

Giải nén ZIP, chọn trực tiếp `src`, `tests`, các file cấu hình và báo cáo ở **thư mục gốc** (không chọn thư mục bao ngoài), tải lên repository `haianh15/mnchot` nhánh `main`, rồi Commit. Không cần xóa repository. Các file cũ không còn được tham chiếu (như `HDT05ContractExpiry.tsx`) không tham gia giao diện; GitHub không tự xóa chúng.
