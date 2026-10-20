# Cập nhật đồng bộ Bàn giao nhận phòng – Quản lý phòng

- Nền: phiên bản giao diện đã loại các banner Hồ sơ DEMO và nhãn không cần thiết, giữ code nghiệp vụ dựa trên ZIP do người dùng tải lên.
- Hai ô Đã cọc và Đã thanh toán tiền thuê kỳ đầu hiển thị **Đã đối chiếu** khi chứng từ hợp lệ (không dùng “Có bản ghi”).
- Sửa AppContext: sau khi xác nhận biên bản nhận phòng đủ chữ ký hai bên, nếu hợp đồng đã ký, đúng khách, đã đối chiếu cọc và thuê kỳ đầu, đúng phòng/lần thuê, phòng Trống tự chuyển **Đang thuê**. Đồng bộ currentContractId/currentLeaseId/currentTenantId, ngày nhận, số người và sự kiện bắt đầu lần thuê.
- Bản ghi biên bản mới lưu **Nháp/Đã lập** không phải là đã nhận phòng; không tự chuyển trạng thái.
- Bàn giao bổ sung **Hoàn tất nhận phòng** cho trường hợp đã có biên bản **Đã xác nhận** từ trước nhưng phòng vẫn Trống (ví dụ P999). Kiểm tra đủ điều kiện qua cùng hàm xác nhận của Quản lý phòng; không cần lập lại biên bản.
- Nếu hồ sơ nguồn chưa khớp, hiển thị lý do cụ thể thay vì báo đã chuyển Đang thuê.
- Giữ nguyên các phân hệ tính tiền, cọc, hợp đồng, quyết toán và dữ liệu người dùng hiện có.

## Phạm vi kiểm tra
- Kiểm tra nguồn TypeScript/TSX bằng parser, chạy tất cả các bài kiểm thử có sẵn và bài kiểm thử mới kiểm tra đường dẫn cập nhật.
- Chưa chạy Vite build và chưa kiểm thử tương tác trực tiếp Vercel.
- Dữ liệu đã lưu trên localStorage không tự bị ghi đè khi thay ZIP.
