# Bàn giao mã nguồn sửa theo biên bản họp 17/10/2026

Nguồn đối chiếu: `Bien_ban_hop_nhom_Quan_ly_chung_cu_mini_17-10-2026(1).docx`, bản đặc tả 63 UC được cung cấp, và mã nguồn ZIP `CCMN_DA_SUA_LOI_CHI_TIET_PHONG_FULL.zip`.

## Thay đổi đã thực hiện

| Nhóm góp ý trong biên bản | Thay đổi trong mã nguồn |
|---|---|
| Quản lý phòng (Hải Anh) | Hiển thị thống nhất tên **Sắp trả phòng** (không đổi mã trạng thái lưu nội bộ); bộ lọc kế hoạch trả gắn nhãn rõ “Ngày dự kiến trả phòng”, nêu mối liên hệ với thời hạn 15 ngày và phân biệt hạn hợp đồng; lịch sử kế hoạch trả có nút mở/ẩn và diễn giải ý nghĩa, chỉ đọc. Bỏ nút kiểm tra hủy kế hoạch trả thủ công tại trang kế hoạch, vì khi kích hoạt hợp đồng nối tiếp hệ thống đã có logic tự cập nhật. |
| Hợp đồng thuê (Hà Anh) | Giữ **Danh sách hợp đồng** làm điểm truy cập; điều kiện thuê được ghi nhận sau khi đã thống nhất ngoài hệ thống. Bỏ nút `Đổi ý`, `Xác nhận đã thống nhất` kiểu quản lý trạng thái thương lượng; sửa tiêu đề, hướng dẫn của danh sách dự thảo. Các hồ sơ cũ từng mang trạng thái “Đang trao đổi” hiển thị trung tính “Chưa hoàn tất hồ sơ”, không tự kết luận là đã đồng ý. |
| Quyết toán cọc (Lan Anh) | Quyết toán cọc tiếp tục nằm trong **Chi tiết hợp đồng**, không đưa lại lên Sidebar. Danh sách hợp đồng cảnh báo **Cần hoàn tất quyết toán cọc** khi có hồ sơ nhận lại phòng nhưng chưa có quyết toán hoàn tất; chi tiết hợp đồng có cảnh báo và nút mở đúng lần thuê. Không tạo nghiệp vụ “Thanh lý hợp đồng” mới ngoài đặc tả. |
| Phiếu tính tiền/thông báo (Mai Anh) | Cách gọi thống nhất **Tiền thuê kỳ tiếp theo (thu trước)** và **Tiền điện, nước, dịch vụ kỳ vừa sử dụng (thu sau)**; nợ cũ tra cứu riêng. Nút lập thông báo mới đưa người dùng vào đối chiếu thay vì mở ngay mẫu lập; gắn kết quả đối chiếu với phiên bản bảng tính, kiểm tra đúng tổng tiền, phòng, lần thuê trước khi phát hành. Sau khi phát hành/thay thế, tự mở đúng thông báo mới khi trạng thái đã cập nhật. Bổ sung tên khách, hạn và ngày lập trong ảnh thông báo; giới hạn phần thông tin ngân hàng để không bị hình QR che khuất. |
| Công nợ (Diệu) | Giải thích trực tiếp nguồn hình thành: bảng tính xác nhận → thông báo hiệu lực → đối chiếu thu tiền, bù cọc → số dư quá hạn. Phần chi tiết hiển thị mã thông báo nguồn, mã bảng tính, khoản đã thu, bù cọc và số dư. Giữ việc chỉ liệt kê khoản đã quá hạn và không tự phân loại nợ kéo dài. |
| Góp ý chung | Hạn chế câu chữ mã UC/BR, tên thao tác theo tài liệu ở các điểm đã sửa; giữ những điều kiện kiểm tra dữ liệu trước khi xác nhận. Không hiển thị đồng thời lịch sử/nhánh xử lý không cần thiết ở trang kế hoạch trả. |

## Ranh giới đối chiếu / phần chưa hoàn tất

- Biên bản yêu cầu tìm hiểu cấu hình đặc thù chung cư mini, **chưa chốt tính năng hay quy tắc cụ thể**; không tự thêm cấu hình mới.
- Biên bản có yêu cầu chỉnh sửa sơ đồ **BPMN**, nhưng trong ZIP mã nguồn website không có tệp BPMN; bản bàn giao này **chưa chỉnh BPMN**.
- Lịch sử các bản ghi từng ghi “Đang trao đổi” vẫn được giữ trong dữ liệu cũ để không làm sai audit; giao diện không cung cấp thao tác thương lượng trên hệ thống.
- Việc phát hành/thay thế QR, số dư và quyết toán cần kiểm thử tương tác với dữ liệu thực tế trước khi sử dụng, nhất là các trường hợp thông báo cập nhật trong kỳ.
- Bản ứng dụng hiện là demo chạy trên trình duyệt; **chưa có backend xác thực và lưu trữ đạt yêu cầu vận hành dữ liệu thật**.

## Kiểm tra kỹ thuật

- Phân tích cú pháp **35 file TS/TSX**: không phát hiện lỗi cú pháp.
- Kiểm tra đường dẫn import nội bộ: không phát hiện đường dẫn thiếu.
- Đã kiểm tra cấu trúc ZIP, `src/`, `package.json` nằm ngay thư mục gốc.
- Đã thử `npm install` nhưng bị timeout vì không truy cập được nguồn package trong môi trường. **Chưa thể xác nhận `npm run build`, kiểm thử trên trình duyệt hay toàn bộ 63 UC**.

## Cập nhật GitHub `mnchot`

Dùng ZIP **bản vá** nếu repo đang có bản website mới nhất: giải nén, **mở bên trong thư mục giải nén**, kéo chính `src` và tệp báo cáo vào trang `https://github.com/haianh15/mnchot/upload/main` rồi Commit. GitHub phải hiển thị đường dẫn `src/components/views/RoomsView.tsx`, không được có tên ZIP hoặc tên thư mục bao ngoài phía trước.

Hoặc dùng ZIP **toàn bộ mã nguồn** để cập nhật cả dự án. Không xóa repo. Sau khi Commit, kiểm tra Vercel có build và triển khai thành công hay không.
