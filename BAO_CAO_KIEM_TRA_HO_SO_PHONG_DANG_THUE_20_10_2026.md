# BÁO CÁO CHỈNH SỬA QUẢN LÝ PHÒNG – ĐIỀU KIỆN ĐANG THUÊ / SẮP TRẢ

## Nguồn được sửa
Bản đầy đủ `CCMN_MNCHOT_GOP_THEO_DOI_HAN_HOP_DONG_VA_TRA_PHONG_FULL.zip` được bàn giao ngay trước yêu cầu này. Giữ nguyên nghiệp vụ quyết toán cọc, hợp đồng dạng văn bản, theo dõi hạn và trả phòng đã gộp, ghi chỉ số.

## Quy tắc áp dụng

Một phòng chỉ được xác nhận nhận phòng và chuyển từ Trống thành Đang thuê khi **đồng thời** có:

1. Hợp đồng giấy đã ký, đúng phòng và mã lần thuê;
2. Hồ sơ khách thuê đúng mã khách đứng tên trên hợp đồng;
3. Chứng từ tiền cọc và tiền thuê kỳ đầu đã được Chủ nhà đối chiếu theo đúng hợp đồng, lần thuê và số tiền (chuyển tiền bên ngoài hệ thống);
4. Biên bản nhận phòng đã xác nhận, có ghi nhận hai bên ký giấy;
5. Ngày nhận thực tế hợp lệ và chưa có sự kiện nhận phòng trùng.

Gia hạn trong cùng lần thuê sử dụng lại chứng từ cọc gốc và biên bản nhận phòng gốc; không thu lại và không tạo biên bản giả.

## Nội dung đã thay đổi

- **`src/utils/roomReadiness.ts` (mới):** hàm kiểm tra hồ sơ nguồn theo cùng mã phòng, mã hợp đồng, mã lần thuê và mã khách; trả về danh sách từng bằng chứng thiếu.
- **`src/context/AppContext.tsx`:** xác nhận nhận phòng kiểm tra hồ sơ khách, mã lần thuê đang chờ, ngày nhận không tương lai, biên bản không muộn hơn ngày nhận, không nhận phòng trùng. Cập nhật kế hoạch trả và chuyển trạng thái do gia hạn yêu cầu hồ sơ nguồn hợp lệ. Kích hoạt gia hạn kiểm tra đúng người, lần thuê, cọc gốc, biên bản nhận phòng.
- **`src/components/views/RoomsView.tsx`:** thêm cảnh báo thống kê các phòng thiếu hồ sơ, nhãn *Cần đối chiếu hồ sơ* trên dòng phòng và danh sách các chứng từ thiếu ở Chi tiết phòng. Hai cột *Đã cọc* và *Đã thanh toán tiền thuê kỳ đầu* dựa vào chứng từ đã đối chiếu, không còn dựa vào hai cờ trên phòng; khoản cọc gốc ở form chi tiết lấy từ hợp đồng thay vì ấn định 3.500.000đ.
- **`tests/occupiedRoomReadiness.test.cjs` (mới):** 19 tình huống kiểm tra riêng.

## Phát hiện ở dữ liệu mẫu hiện có

Trong `src/data/seedData.ts` đang có **9 phòng trạng thái Đang thuê / Sắp trả** nhưng chỉ **P.101** có đủ hồ sơ nguồn theo phép kiểm tra mới.

- **P.102, P.201, P.203:** có dữ liệu hợp đồng/khách nhưng thiếu biên bản nhận phòng đã xác nhận; chưa có chứng từ cọc/thuê kỳ đầu hợp lệ (P.102 có chứng từ mẫu nhưng số tiền không khớp hợp đồng).
- **P.301, P.302, P.401, P.402, P.403:** phòng được gán trạng thái đang thuê nhưng không có hợp đồng liên kết đầy đủ và các chứng từ nguồn tương ứng trong bộ dữ liệu mẫu.

**Không tự tạo biên bản, xác nhận thanh toán hay hợp đồng giả; không tự đổi những phòng có thể đang có người ở thực tế thành Trống.** Trạng thái vật lý hiện lưu vẫn được giữ, nhưng giao diện sẽ cảnh báo thiếu bằng chứng và các thao tác chuyển trạng thái mới bị kiểm tra chặt.

## Giới hạn xác nhận

- Đã chạy toàn bộ các bài kiểm tra `tests/*.cjs` có sẵn và bài kiểm tra mới.
- Đã kiểm tra cú pháp TypeScript/TSX với TypeScript parser.
- Chưa thực hiện build Vite hoặc kiểm thử trực tiếp trên trình duyệt vì bộ thư viện dự án chưa được cài trong môi trường.
- Dữ liệu hiện có trong localStorage của người dùng không bị xóa khi cập nhật mã nguồn. Cần đối chiếu hồ sơ giấy và sao kê thật để bổ sung các bản ghi thiếu.
