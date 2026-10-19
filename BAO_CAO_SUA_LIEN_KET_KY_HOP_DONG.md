# Bàn giao chỉnh sửa liên kết hợp đồng – phòng – khách – cọc

## Nguyên nhân xác nhận từ mã nguồn cũ

- Hàm `confirmContractSignedHDT04` tự chuyển phòng thành **Đang thuê** khi ký giấy, nhưng không lưu `currentContractId`, `currentLeaseId`, `currentTenantId`. Trong khi Chi tiết phòng lại tìm hợp đồng theo các mã này, gây mất liên kết ngay sau khi ký.
- `RoomsView` coi phòng **Trống** là không có hợp đồng nào; trong khi có thể đã ký hợp đồng nhưng chưa nhận phòng.
- Màn hình Nhận phòng tìm hồ sơ theo `currentContractId/currentLeaseId` của khách *đang cư trú* nên không tìm được hợp đồng **đang chờ nhận phòng**.
- Biểu mẫu cọc/thuê đầu có chỗ sinh mã hợp đồng/mã lần thuê tạm hoặc chọn giá mặc định, có nguy cơ ghi sai hồ sơ.

## Các thay đổi đã thực hiện

1. `src/context/AppContext.tsx`: ký hợp đồng chỉ ghi liên kết chờ nhận phòng (`pendingContractId`, `pendingLeaseId`), **không** chuyển phòng thành Đang thuê. Không cho ký trùng hoặc ký chồng hợp đồng đang chờ giao phòng; kiểm tra phòng và khách có thật. Có chuyển đổi dữ liệu lỗi của bản trước trong trường hợp xác định được hợp đồng ký nhưng chưa có người ở thực tế.
2. `src/types/index.ts`: khai báo riêng 2 trường liên kết hợp đồng đã ký chờ nhận phòng; không trộn vào dữ liệu người đang cư trú.
3. `src/utils/roomLinks.ts`: tra cứu đúng hồ sơ theo `roomCode + leaseId + contractId` của lần thuê hiện tại; với phòng Trống chỉ lấy hợp đồng giấy đã ký **chưa từng nhận phòng**. Không lấy hợp đồng đã kết thúc/lần thuê cũ/phòng khác.
4. `src/components/views/RoomsView.tsx`: phòng Trống chưa ký hiển thị **Lập hợp đồng**; phòng Trống đã ký hiển thị **Xem hợp đồng đã ký**, **Xem hồ sơ khách ký hợp đồng** và tiền đã thu của đúng chứng từ. Số người ở vẫn là 0. Chức năng nhận phòng lấy đúng hợp đồng và chứng từ thanh toán của lần thuê đang chờ nhận. Thao tác bàn giao, kế hoạch trả, trả phòng chỉ hiện theo hồ sơ và trạng thái phù hợp.
5. `src/components/views/contracts/HDT04ReceiveSignedContract.tsx`, `src/components/views/ContractsView.tsx`: sau khi ghi nhận ký thành công, trở về Chi tiết của **đúng hợp đồng** để xem hồ sơ hoặc mở phòng tương ứng.
6. `src/context/AppContext.tsx`: đối với hợp đồng đầu, chỉ ghi nhận chứng từ cọc và thuê đầu một lần, đúng số tiền trên hợp đồng. Khi nhận phòng đủ điều kiện, chuyển phòng sang Đang thuê, lưu các ID đang cư trú và xóa liên kết chờ nhận. Gia hạn cập nhật ID hợp đồng hiện tại mà không tạo khoản cọc mới; trả phòng xóa liên kết hiện tại nhưng giữ lịch sử nghiệp vụ.

## Đã kiểm tra

- Kiểm tra cú pháp 36 file `.ts/.tsx`: không phát hiện lỗi cú pháp.
- 99 import nội bộ đều trỏ tới file tồn tại.
- 8 kịch bản ở `tests/roomLinks.test.cjs`: **đạt 8/8** (phòng trống, ký mới, hồ sơ cũ, phòng khác, sai lần thuê, người khác, hợp đồng chờ nhận...)
- ZIP có cấu trúc gốc chứa `src`, `package.json`, `index.html`.

## Chưa được kiểm chứng

**Chưa build/test tương tác trình duyệt**: môi trường không có `vite` trong `node_modules`; `npm run build` trả `vite: not found`. Vì vậy sau khi đẩy GitHub và Vercel Ready, cần kiểm thử UI thực tế theo luồng dưới đây.

### Luồng kiểm thử thủ công ưu tiên

1. Phòng mới Trống: không có hợp đồng, hồ sơ khách và khoản cọc; có Lập hợp đồng.
2. Lập dự thảo gắn đúng phòng, đúng khách; Ghi nhận ký. Quay lại phòng: **Trống**, có Xem hợp đồng đã ký, Xem hồ sơ khách ký hợp đồng (nếu có hồ sơ), số người ở **0**.
3. Thu cọc + 1 tháng thuê theo đúng hợp đồng: Chi tiết phòng hiển thị số thu đúng, không ghi thành Đã thu nếu chưa có chứng từ.
4. Mở Nhận phòng: nhận đúng hợp đồng và tiền đã xác nhận; chỉ hoàn tất khi có biên bản bàn giao giấy đã xác nhận. Sau hoàn tất mới chuyển Đang thuê.
5. Ký hợp đồng phòng A không được làm Chi tiết phòng B xuất hiện khách, cọc hoặc hợp đồng của A.
6. Trả phòng xong, phòng Trống không liên kết nhầm hợp đồng/lần thuê cũ thành hiện tại.
7. Đăng nhập và thử lại trên một tab riêng hoặc cửa sổ ẩn danh nếu dữ liệu mẫu của trình duyệt đang chứa hồ sơ mâu thuẫn từ bản cũ. Không xóa `localStorage` nếu đang cần giữ dữ liệu đã nhập.

**Lưu ý:** Bản demo vẫn lưu dữ liệu trong trình duyệt, chưa có backend xác thực và lưu trữ an toàn để sử dụng với dữ liệu thật.
