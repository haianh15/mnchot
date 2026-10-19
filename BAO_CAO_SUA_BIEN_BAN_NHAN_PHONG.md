# Cập nhật tính nhất quán biên bản nhận phòng

## Nguyên tắc
- `Đang thuê` / `Sắp trả` chỉ được phát sinh theo luồng nhận phòng khi có biên bản nhận phòng của đúng hợp đồng/lần thuê, đã xác nhận và đủ chữ ký bản giấy hai bên.
- Hợp đồng nối tiếp kế thừa biên bản nhận phòng đã ký của hợp đồng trước theo chuỗi liên kết hợp lệ; không lập biên bản ký mới giả.
- Hồ sơ đã tồn tại nhưng không có biên bản được ghi rõ là **Thiếu biên bản đã xác nhận – cần đối chiếu**, không tự tạo chữ ký, ngày nhận phòng hoặc chứng từ giả.
- Nếu phòng mới chỉ ký hợp đồng mà chưa nhận khách, có thể lập biên bản nhận phòng đúng hợp đồng và lần thuê để hoàn tất điều kiện nhận phòng; chưa chuyển sang Đang thuê.

## Các sửa đổi
1. `src/utils/roomLinks.ts`: bộ kiểm tra biên bản đã xác nhận, hỗ trợ chuỗi hợp đồng nối tiếp, không lấy báo cáo phòng/lease khác.
2. `src/components/views/RoomsView.tsx`: hiển thị trạng thái giấy tờ chính xác, bổ sung đường dẫn xem/bổ sung biên bản theo hợp đồng và lần thuê, không tự coi phòng Đang thuê là đã có bản giấy.
3. `src/components/views/HandoverAssetsView.tsx`: mở đúng form bàn giao kể cả khi chưa có biên bản; cho phép hợp đồng ký chờ nhận phòng; mã biên bản phân biệt theo lần thuê; không kéo chữ ký của phòng khác. Bỏ Gắn dấu tra cứu và dấu kiểm tra giả, bỏ điều kiện phụ thuộc dấu tra cứu khi ghi kết quả đối chiếu.
4. `src/context/AppContext.tsx`: chặn cập nhật kế hoạch trả hoặc gia hạn làm chuyển trạng thái sử dụng nếu thiếu biên bản đã xác nhận; bỏ khả năng giữ trạng thái Đã xác nhận khi gỡ chữ ký; cho phép lưu tham chiếu scan đã xác thực nếu người quản lý nhập.
5. `tests/handoverIntegrity.test.cjs`: các kiểm thử liên kết và trạng thái giấy tờ.

## Dữ liệu cũ cần kiểm tra
Dữ liệu demo cũ có nhiều phòng ở trạng thái Đang thuê/Sắp trả nhưng **chưa có biên bản nhận phòng đủ chữ ký** được lưu. Phần mềm không thể tự suy ra rằng bản giấy đã ký. Những hồ sơ này sẽ hiện cảnh báo; Chủ nhà cần đối chiếu bản giấy thực tế và cập nhật vào đúng mã phòng/lần thuê.

## Phạm vi kiểm tra
- Đã chạy kiểm thử mã nguồn `tests/handoverIntegrity.test.cjs`, `tests/roomLinks.test.cjs`, `tests/returnTracking.test.cjs`.
- Đã kiểm tra cú pháp TypeScript/TSX và đường dẫn import tương đối.
- Chưa build Vite hoặc kiểm thử luồng tương tác thực tế trên trình duyệt do môi trường chưa có gói thư viện Vite/npm của dự án.
