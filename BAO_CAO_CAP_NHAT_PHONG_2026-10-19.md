# Bàn giao sửa chức năng Quản lý phòng và liên kết hồ sơ

## Yêu cầu và thay đổi đã thực hiện

1. **Tầng phải là số nguyên lớn hơn 0.** Đã chỉnh cả biểu mẫu Thêm phòng, Sửa phòng (`min=1`, nhãn và thông báo lỗi), và quy tắc từ chối nhập ở `addRoom` / `updateRoom` trong AppContext. Mức 0, số âm và số thập phân không hợp lệ. Quy định này được **thay đổi theo yêu cầu mới nhất của người dùng**; phiên bản đặc tả đính kèm trước đó quy định tầng >=0.
2. **Bỏ các mục Lịch sử thay đổi khỏi giao diện làm việc.** Đã gỡ nút/popup/bảng lịch sử thay đổi thông tin phòng, lịch sử chỉnh kế hoạch trả, lịch sử chỉnh nội dung vướng mắc, tab lịch sử khách thuê, popup nhật ký điều chỉnh điều kiện và dự thảo hợp đồng. Không xóa dữ liệu nhật ký đang lưu bên trong vì một số quy tắc nghiệp vụ còn yêu cầu lưu dấu vết đối soát và sửa sai. Các lịch sử chứng từ tài chính/lịch sử nhắc nợ không bị xóa.
3. **Phòng Trống không có nút Xem hồ sơ khách thuê.** Khu vực khách thuê chỉ hiển thị trạng thái Chưa có khách thuê và 0 người; không thể nhấn xem hồ sơ khách của lần thuê đã kết thúc. Ở phần đối chiếu điều kiện cho thuê cũng không mở hồ sơ khách cũ.
4. **Phòng có khách:** Khi bấm Xem hồ sơ khách thuê, hệ thống tìm theo `currentTenantId` hoặc `tenantId` trên hợp đồng của lần thuê hiện tại; có fallback theo tên chỉ khi tên duy nhất. Chuyển sang **Danh sách hồ sơ khách thuê**, tô nền xanh và chữ đậm cho đúng dòng, tự cuộn đến dòng; có thể bấm Xem chi tiết từ đây.
5. **Phòng Trống có nút Lập hợp đồng, không có nút Xem hợp đồng.** Khi bấm nút, chuyển sang Quản lý hợp đồng và mở biểu mẫu ghi nhận điều kiện thuê đã thống nhất, với mã phòng được chọn sẵn. Các phòng đã có hợp đồng hiện tại giữ nút Xem hợp đồng dẫn đúng hồ sơ. Nếu phòng trống đã có hợp đồng ký đang chờ bàn giao, phần kiểm tra khả năng cho thuê không tạo thêm hợp đồng khác.
6. **Không làm bật Chi tiết phòng khi sang màn hình khác.** Bảo lưu cơ chế popup tách khỏi `selectedRoom` đã sửa từ bản trước.

## Các tệp mã nguồn thay đổi
- `src/App.tsx`
- `src/context/AppContext.tsx`
- `src/components/views/RoomsView.tsx`
- `src/components/views/TenantsView.tsx`
- `src/components/views/tenants/HSKT01RegisterTenant.tsx`
- `src/components/views/ContractsView.tsx`
- `src/components/views/contracts/HDT01LeaseConditions.tsx`
- `src/components/views/contracts/HDT03SendAndNegotiate.tsx`

## Kiểm tra đã chạy
- Phân tích cú pháp 35 file TypeScript/TSX với bộ phân tích TypeScript: **không có lỗi cú pháp**.
- Rà soát 98 đường dẫn import tương đối: **không thiếu tệp nguồn được tham chiếu**.
- Kiểm tra tĩnh cho biểu mẫu `min=1`, hàm từ chối tầng <=0, đường chuyển sang lập hợp đồng, luồng tô đậm hồ sơ khách: **đạt**.
- Thử cài npm offline không được vì thiếu gói trong cache; thử tải gói từ mạng bị timeout. Vì vậy **chưa chạy build Vite hoặc kiểm thử tương tác trình duyệt**.

## Giới hạn và lưu ý
- Đây vẫn là dự án demo lưu dữ liệu trên trình duyệt, chưa có backend xác thực/lưu dữ liệu sản xuất.
- Nhật ký nghiệp vụ được giữ bên trong để bảo vệ khả năng truy vết tiền và chứng từ, dù không còn hiển thị các phần lịch sử thay đổi yêu cầu ẩn.
- Việc tải ZIP lên GitHub phải chọn **nội dung** bên trong ZIP, không kéo cả thư mục giải nén bao ngoài.
