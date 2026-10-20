# Báo cáo rà soát và sửa liên kết – Quản lý phòng và Bàn giao

**Cơ sở mã nguồn:** `CCMN_MNCHOT_DONG_BO_SO_NGUOI_O_CHI_TIET_PHONG_HO_SO_20_10_FULL.zip`, đã chứa các cập nhật về hợp đồng dạng văn bản, quyết toán cọc và số người ở. Những thay đổi dưới đây là bổ sung trên bản này; không thay thế bằng bản GitHub cũ.

## Các điểm đã kiểm tra và chỉnh

| Vấn đề trong mã nguồn | Cách xử lý |
|---|---|
| Từ luồng **Trả phòng** tại Quản lý phòng mở Bàn giao nhưng rơi vào **Nhận phòng/kiểm kê** | Truyền mã phòng, hợp đồng, lần thuê và `handoverMode='return'`; nếu chưa có biên bản trả thì vào lập, nếu đã có thì vào kết quả nhận lại. |
| Nút Xem bàn giao từ Chi tiết phòng mở nhầm dữ liệu hợp đồng/lần thuê | Dùng cùng mã liên kết và phân biệt chế độ xem biên bản nhận phòng, lập biên bản nhận và trả phòng. |
| Biên bản nhận phòng có thể bị lưu với mã hợp đồng khác, ghi đè ID hoặc lưu đè bản đã ký | Kiểm tra hợp đồng đã ký, mã phòng, mã lần thuê, ID đã tồn tại; khóa bản đã xác nhận; kiểm tra kết quả lưu và hiển thị lỗi thật. |
| Biên bản hợp đồng nối tiếp trỏ về biên bản gốc nhưng hiển thị kiểm kê/công tơ của hợp đồng mới | Dò chuỗi hợp đồng nối tiếp **cùng lần thuê**, đọc biên bản – kiểm kê – công tơ từ hợp đồng nguồn; bản kế thừa chỉ xem, không lập/ký đè. |
| Điều kiện lưu biên bản nhận phòng dựa vào cờ `hasDeposit`/`firstMonthRentPaid` của phòng, có thể thuộc khách trước | Chỉ đối chiếu giao dịch tiền cọc/thuê đầu của đúng hợp đồng/lần thuê và dữ liệu kiểm kê/công tơ đã lưu; phép kiểm tra lặp lại ở tầng lưu. |
| Xác nhận chữ ký không kiểm tra trạng thái phiếu, có thể báo thành công mà không tìm thấy đúng phiếu | Chỉ xác nhận biên bản `Đã lập` có nguồn hợp lệ; không ghi lại biên bản đã xác nhận; nếu hai bên đã ký, yêu cầu nơi lưu bản giấy. |
| Thông tin Bên A/Bên B trong biên bản có số điện thoại/CCCD ví dụ | Đọc thông tin đã lưu từ hợp đồng và hồ sơ khách; thiếu dữ liệu thì hiện `Chưa có dữ liệu`. |
| Đổi phòng trong Bàn giao có thể giữ dữ liệu sự cố, lựa chọn, modal của phòng trước | Xóa dữ liệu đang nhập chưa lưu và đóng modal khi đổi phòng; tải lại kiểm kê, hiện trạng, nhận lại theo hồ sơ phòng mới. |
| Một phòng có nhiều bảng hiện trạng, có thể lấy bản nháp thay bảng công tơ đã hoàn tất | Ưu tiên bản hiện trạng đã hoàn tất có ảnh công tơ trong cùng hợp đồng/lần thuê. |
| Phòng chưa có hợp đồng vẫn hiển thị biểu mẫu trống để thao tác | Hiển thị cảnh báo và không mở biểu mẫu nghiệp vụ khi thiếu hợp đồng nguồn; nhóm Trả phòng bị vô hiệu hóa với phòng Trống. |
| Sự cố tài sản và kết quả đối chiếu có thể ghi vào sai phòng/lần thuê hoặc dùng ID trùng | Kiểm tra nguồn ở hàm lưu; báo lỗi trước khi cập nhật dữ liệu. |
| Kết quả đối chiếu tạo sẵn trạng thái khách đã đồng ý | Bỏ mặc định Đồng ý/Đã phản hồi khi chưa ghi nhận phản hồi thật. |
| Lưu chờ quyết toán và đồng bộ cọc có thể thông báo thành công khi lưu bị từ chối | Chỉ báo lưu thành công khi hàm xử lý trả kết quả thành công; phải khớp mã phiếu, phòng, lần thuê, phiên bản. |
| Phòng đang thuê nhưng thiếu biên bản nhận phòng đủ chữ ký có thể được xác nhận nhận lại và chuyển Trống từ biên bản cũ | Bổ sung kiểm tra biên bản gốc đã xác nhận trước khi xác nhận nhận lại và cập nhật Trống. |
| Nút Thử lại đối chiếu gọi hàm `setBg07SimulateSaveFailure` không tồn tại | Loại bỏ lời gọi sai; nút thử lại thực hiện hàm lưu hiện có. |
| Một số số biên bản trả tự sinh dựa trên phòng/năm có nguy cơ trùng qua lần thuê | Bổ sung mã lần thuê vào số biên bản trả phòng mới. |

## Kiểm tra tự động

- `npm run test:handover`: các bài kiểm tra trước đó và **29 trường hợp liên kết mới** đạt, gồm kiểm thử trực tiếp các hàm nghiệp vụ được trích xuất từ mã nguồn.
- `npm run test:occupancy`: đạt; giữ đồng bộ số người ở.
- `npm run test:settlement`: đạt; giữ quy tắc phiếu quyết toán cọc.
- `npm run test:contract`: đạt; giữ mẫu hợp đồng dạng văn bản.
- 41 file TypeScript/TSX được kiểm tra cú pháp; không phát hiện lỗi cú pháp.
- Kiểm tra tham chiếu biến/hàm nội bộ bằng TypeScript: không thấy lỗi tên chưa định nghĩa trong các nhóm mã có thể kiểm tra khi chưa cài dependency.

## Giới hạn, chưa xác nhận

- **Chưa build thành công**: môi trường thiếu các gói npm (`vite: not found`). Do đó chưa kiểm thử thực tế các nút trên Vercel và chưa chứng minh toàn bộ 63 UC.
- Dữ liệu vẫn được lưu trên trình duyệt (`localStorage`), chưa có backend/dữ liệu chung, không thích hợp vận hành với hồ sơ và chứng từ thật.
- Dữ liệu mẫu cũ có phòng đang thuê nhưng không có biên bản giấy xác nhận. Bản sửa không tự tạo chứng cứ giả; những phòng đó sẽ cần đối chiếu và bổ sung hồ sơ thực tế.

**Cập nhật GitHub:** Giải nén ZIP đầy đủ; tải các file/thư mục *bên trong* vào gốc repository `mnchot`. Không cần xóa repository. Giữ ZIP gốc của bạn làm bản sao dự phòng.
