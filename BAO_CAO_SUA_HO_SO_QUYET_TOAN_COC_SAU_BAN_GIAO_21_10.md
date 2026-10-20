# Sửa luồng Bàn giao → Quyết toán cọc (21/10/2026)

**Nền mã nguồn:** bản liên kết P999 và đối soát cọc đã sửa, giữ nguyên các phân hệ khác.

- Khi từ Bàn giao mở Quyết toán cọc, hiển thị ngay thông tin của đúng **mã phòng, hợp đồng, lần thuê** dù chưa lập phiếu.
- Trên màn hình có tiền cọc gốc và mã chứng từ, ngày xác nhận nhận lại phòng, kết quả đối chiếu tài sản và tình trạng bảng tính tiền kỳ cuối.
- Nếu đã xác nhận nhận lại và chưa có phiếu: hiển thị nút lập phiếu đúng phòng. Nếu đã có phiếu: chỉ dẫn mở phiếu đã tồn tại, không tạo trùng.
- Nếu chỉ bàn giao **nhận phòng** cho khách mới, hoặc chưa xác nhận **nhận lại phòng** khi khách trả: giải thích vì sao chưa thể quyết toán cọc.
- Nếu thiếu nguồn cọc: cảnh báo kiểm tra chứng từ đối chiếu, **không tự tạo tiền đã nhận**.
- Điều kiện nghiệp vụ hoàn tất: giữ nguyên bắt buộc đối chiếu, tính lại và xác nhận đủ theo phiên bản; không tự hoàn tiền hoặc tự chốt quyết toán.

**Giới hạn:** mã nguồn và kiểm tra tĩnh/chạy bài thử hiện có chưa thay thế kiểm thử end-to-end thực tế trên trình duyệt. Website đang lưu localStorage, không dùng dữ liệu cá nhân hay giao dịch thật.
