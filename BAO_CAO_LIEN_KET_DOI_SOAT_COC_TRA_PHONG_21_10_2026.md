# BÁO CÁO CẬP NHẬT ĐIỀU HƯỚNG BÀN GIAO TRẢ PHÒNG → QUYẾT TOÁN CỌC

**Nền mã nguồn:** CCMN_MNCHOT_SUA_DONG_BO_BIEN_BAN_NHAN_PHONG_P999_FULL.zip (tiếp nối bản ZIP người dùng gửi và các thay đổi ẩn ghi chú demo, đổi nhãn và đồng bộ nhận phòng).

## Những thay đổi

1. Tại Bàn giao và tài sản → Ghi nhận nhận lại phòng, nút **Đối soát cọc** mở **Quản lý hợp đồng → Quyết toán cọc** thực sự, thay vì chỉ mở bảng theo dõi trong Bàn giao. Chuyển theo `roomCode`, `contractId`, `leaseId` và kiểm tra cả ba mã trước khi mở.
2. Quyết toán cọc từ Bàn giao có **đầu trang làm nổi bật phòng đang xử lý**, giới hạn danh sách phiếu theo hợp đồng/phòng/lần thuê và in đậm phòng trên dòng phiếu đang được chọn. Không tự chọn phiếu thuộc phòng khác, không lấy phiếu đã hủy khi có phiếu đang hiệu lực.
3. Nút **Tiếp tục bàn giao trả phòng** đưa về hồ sơ đúng phòng/lần thuê: nếu chưa xác nhận đã nhận lại thì đưa về bước nhận lại; nếu đã xác nhận thì đưa về bước cập nhật kết quả cọc vào biên bản trả phòng.
4. Sau khi Bàn giao xác nhận nhận lại, tự chuyển đến bước đối soát cọc để tiếp tục quy trình. Sau khi hoàn thiện và xác nhận biên bản trả phòng, hiển thị nút **Tiếp tục xác nhận trả phòng** đến Quản lý phòng, chọn đúng phòng và vào luồng xác nhận kết thúc thuê.
5. Ngăn mở luồng kết thúc thuê cho một phòng đã Trống hoặc đã đổi hợp đồng/lần thuê khi chuyển giữa các phân hệ.
6. **Giữ nguyên điều kiện nghiệp vụ:** việc chuyển sang phần quyết toán cọc không có nghĩa đã hoàn tất giao dịch, không tự xác nhận biên bản, không tự chuyển phòng sang Trống, và không tự tạo khoản thu/hoàn mới. Quyết toán cọc chỉ được lập khi đã xác nhận nhận lại thực tế theo điều kiện sẵn có.

## Các bước thử giao diện

1. Mở phòng đang thuê → Bàn giao trả phòng → lập biên bản trả phòng Nháp.
2. Ghi nhận kiểm kê, xác nhận nhận lại phòng thực tế, đến mục đối soát cọc → bấm **Đối soát cọc tại Quản lý hợp đồng**.
3. Kiểm tra đúng phòng/mã hợp đồng/lần thuê được nhấn mạnh trong Quyết toán cọc; nếu có phiếu thì dòng tương ứng được chọn nổi bật, nếu chưa có thì chỉ tạo cho đúng lần thuê đủ điều kiện.
4. Đối chiếu/ghi nhận kết quả cọc theo điều kiện, bấm **Tiếp tục bàn giao trả phòng**.
5. Tại Bàn giao, ghi kết quả quyết toán đúng phiên bản vào biên bản; hoàn thiện biên bản, xác nhận và bấm **Tiếp tục xác nhận trả phòng**.
6. Quản lý phòng mở chính xác phòng đang xử lý, xác nhận ngày nhận lại và kết thúc thuê khi hợp lệ.
7. Thử với 2 phòng khác nhau và 2 lần thuê của cùng phòng để xác nhận không chuyển nhầm hồ sơ.

## Kiểm tra kỹ thuật

- Đã chạy toàn bộ bài kiểm tra trong `tests/*.cjs`, thêm `tests/returnDepositNavigation.test.cjs` (20 ràng buộc tích hợp/điều hướng).
- Đã kiểm tra cú pháp TS/TSX bằng TypeScript toàn dự án và rà các import tương đối.
- Chưa xác nhận build Vite hoặc kiểm thử end-to-end trên trình duyệt/Vercel. Cần thử thực tế trước nghiệm thu.
