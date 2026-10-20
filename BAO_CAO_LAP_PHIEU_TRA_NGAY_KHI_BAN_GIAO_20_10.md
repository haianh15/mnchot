# CẬP NHẬT LUỒNG LẬP PHIẾU TRẢ PHÒNG KHI BẮT ĐẦU BÀN GIAO

**Nền mã nguồn:** bản `CCMN_MNCHOT_BO_CHUA_BAN_GIAO_CHI_LAP_PHIEU_SAU_KHI_HOAN_TAT_20_10_FULL.zip`.

## 1. Thay đổi theo yêu cầu mới

- **Không phải chờ bàn giao xong mới được lập phiếu trả phòng.** Từ Quản lý phòng → Bàn giao trả phòng hoặc chọn Trả phòng tại phân hệ Bàn giao, hệ thống mở trực tiếp form **Lập phiếu trả phòng**.
- Phiếu được tạo ngay khi bắt đầu kiểm tra trả phòng ở trạng thái **Nháp**; phải ghi ngày lập, tên bên giao và bên nhận; liên kết đúng **phòng – hợp đồng đã ký – lần thuê đang ở**.
- Không lập phiếu nếu phòng Trống, sai hợp đồng/lần thuê hoặc chưa có biên bản **nhận phòng** đã xác nhận đủ điều kiện làm hồ sơ nguồn.
- Khi đã tồn tại phiếu cho lần thuê đó, mở lại phiếu hiện có; không tạo phiếu trùng.
- Sau khi lưu phiếu Nháp, giao diện chuyển đến **Ghi nhận nhận lại phòng** để kiểm kê tài sản, đối chiếu hiện trạng và lưu chứng cứ thực tế.
- **Lập Nháp không đồng nghĩa đã nhận lại phòng.** Phòng vẫn ở trạng thái Đang thuê/Sắp trả cho tới khi có kiểm tra tài sản đầy đủ, xác nhận đã nhận lại và thao tác kết thúc thuê hợp lệ.
- Việc hoàn thiện biên bản và quyết toán cọc tiếp tục tuân thủ điều kiện riêng của nghiệp vụ tương ứng; không bịa phiếu đã ký hoặc số tiền hoàn cọc.
- Giữ nguyên yêu cầu cũ là **không hiển thị nút và form “Chưa bàn giao”** trong Quản lý phòng.

## 2. Tệp đã sửa

- `src/context/AppContext.tsx`: thay điều kiện khởi tạo phiếu Nháp; giữ điều kiện xác nhận trả phòng và liên kết hiện tại.
- `src/components/views/HandoverAssetsView.tsx`: sửa điểm vào, nút lưu Nháp, thông báo và bước tiếp theo.
- `src/components/views/RoomsView.tsx`: cập nhật nhãn nút theo luồng mới.
- `tests/returnSlipAfterHandover.test.cjs`: cập nhật bài kiểm tra hồi quy phù hợp cách lập phiếu từ lúc bắt đầu bàn giao.

## 3. Kết quả kiểm tra

- **16/16** tình huống mới cho việc lập Nháp và xác nhận trả phòng đạt.
- Bộ `test:handover` và các nhóm `test:returns`, `test:contract`, `test:settlement`, `test:occupancy`, `test:meters` đã chạy đạt trong môi trường mã nguồn.
- **43 file TypeScript/TSX:** không có lỗi phân tích cú pháp; không thiếu import nội bộ.
- Chưa chạy build Vite hoặc kiểm thử toàn bộ UI trong trình duyệt vì chưa cài được các thư viện dự án.

## 4. Bàn giao

ZIP đặt `src/`, `tests/`, `package.json`, `index.html` ở **ngay thư mục gốc**; khi tải lên GitHub `haianh15/mnchot`, chọn tất cả **nội dung bên trong**, không thêm thư mục bao ngoài.

**Lưu ý:** đây là ứng dụng demo lưu dữ liệu cục bộ trình duyệt, chưa được kiểm chứng để vận hành dữ liệu và tiền thật.
