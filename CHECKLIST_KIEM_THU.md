# Checklist kiểm thử sau khi chạy bản web

Kiểm tra bằng bản demo (không sử dụng thông tin khách thuê hay giao dịch thực tế). Đây là các ca **chưa được xác nhận chạy thành công**, đánh dấu sau khi tự thử.

- [ ] Đăng nhập `chunha` bằng mật khẩu được cấp → yêu cầu đổi mật khẩu lần đầu; chưa đổi xong không vào được hệ thống.
- [ ] Đăng nhập xong vào ngay **Quản lý phòng**; không xuất hiện **Tổng quan** ở menu hoặc route.
- [ ] Sidebar chỉ hiển thị 10 nhóm chính; không có mục Quyết toán cọc độc lập; màn hình điện thoại 360–428px không tràn ngang bất thường.
- [ ] Phòng: tìm, lọc, mở chi tiết, xem đúng hợp đồng/khách/bàn giao; lịch sử ngày dự kiến trả đúng lần thuê.
- [ ] Hợp đồng: mặc định danh sách; bấm mã hợp đồng hiện chi tiết đúng; Quyết toán cọc chỉ xuất hiện trong chi tiết hợp đồng đủ điều kiện.
- [ ] Hợp đồng nối tiếp không thu lại tiền cọc; hợp đồng đã ký không cho sửa/hủy/ký lại.
- [ ] Hồ sơ khách: tìm khách → Chi tiết → Thông tin/Người ở cùng/Lịch sử là của đúng khách; kiểm tra/cập nhật mở đúng hồ sơ.
- [ ] Bàn giao: vào từ menu yêu cầu chọn phòng; từ chi tiết phòng nhận đúng mã phòng; không ghi nhầm biên bản; chữ ký giấy ghi đúng kết quả.
- [ ] Tính tiền: chọn đúng phòng/kỳ; mã công tơ từ nguồn; chỉ số đầu/cuối đúng; tiền thuê tháng sau và dịch vụ tháng vừa qua; không tính trùng tiền thuê đầu.
- [ ] Đối chiếu: bảng tính nguồn đúng; chỉ lập thông báo sau khi đối chiếu đã xác nhận; bản QR thay thế bị vô hiệu; nợ cũ giữ riêng.
- [ ] Thu tiền: đúng thông báo, giao dịch ngân hàng và số tiền đã vào; không xác nhận một phần; sửa nhầm có lý do và lịch sử.
- [ ] Công nợ: đúng ngày hạn chưa quá hạn; nợ xử lý bằng cọc không trừ hai lần; nợ chưa bù đủ vẫn còn số dư.
- [ ] Báo cáo: tổng hợp khớp đúng nghĩa vụ đã xác nhận và khoản thu/cọc, không lấy số liệu ước lượng.
- [ ] `npm run lint` và `npm run build` chạy xong không lỗi; Vercel Deploy Ready; thử các chức năng bằng Chrome hoặc Edge.
