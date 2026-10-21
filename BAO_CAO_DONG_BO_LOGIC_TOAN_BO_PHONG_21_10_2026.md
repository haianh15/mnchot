# ĐỒNG BỘ LUỒNG NGHIỆP VỤ TẤT CẢ PHÒNG – 21/10/2026

## Phạm vi

Sửa logic dùng chung áp dụng với **mọi mã phòng hiện có và phòng tạo mới**, không thêm trường hợp riêng cho P.101 / P.909. Giữ dữ liệu thực tế và chứng từ; không tự tạo khách thuê, biên bản, thanh toán hoặc chữ ký giấy.

## 1. Một quy tắc vòng đời, nhiều màn hình

| Tình trạng thực tế | Quản lý phòng | Quản lý hợp đồng / Bàn giao |
|---|---|---|
| Phòng Trống, chưa ký hợp đồng cho lượt thuê mới | Lập hợp đồng | Kiểm tra điều kiện → Dự thảo → ký giấy, hồ sơ khách thật |
| Phòng Trống, có đúng 1 hợp đồng giấy chờ nhận | Lập biên bản nhận phòng | Mở đúng mã phòng, hợp đồng, lượt thuê mới; kiểm kê và công tơ thật |
| Biên bản nhận phòng đã xác nhận đủ chữ ký nhưng chưa xác nhận nhận thực tế | Xác nhận nhận phòng | Chỉ cập nhật Đang thuê sau khi đủ cọc/thuê đầu, bàn giao, thông tin khách, ngày thực tế |
| Đang thuê | Xem hợp đồng, hồ sơ khách đúng lượt thuê | Không được ký hợp đồng lần đầu cho khách mới khi chưa trả phòng |
| Sắp trả hoặc hợp đồng hiện hành đã đến/hết hạn | Theo dõi trả phòng | Có thể lập **hợp đồng nối tiếp** cho cùng khách, cùng chuỗi thuê, nếu chưa lập nối tiếp và thỏa ràng buộc |
| Đã trả phòng thực tế, bước xác nhận và phiếu trả đầy đủ | Trống; lập hợp đồng cho lượt thuê mới | Hợp đồng/khách/biên bản cũ là lịch sử, không chặn hợp đồng mới, không dùng lại cọc gốc |
| Hai hợp đồng giấy cùng đang chờ nhận | Hiện **Kiểm tra hợp đồng trùng** | Chặn chọn tự động và chặn lập biên bản cho đến khi đối chiếu nguồn |

## 2. Các nơi được đồng bộ

- `src/utils/roomLifecycle.ts`: nguồn xác định hợp đồng đang chờ, đã nhận, đã trả, ràng buộc trùng và đồng bộ liên kết mã phòng–hợp đồng–lần thuê.
- `src/utils/roomLinks.ts`: Quản lý phòng/Bàn giao cùng chọn một nguồn hợp đồng; không lấy hợp đồng nháp hoặc lịch sử làm hiện hành.
- `src/utils/contractEligibility.ts`: chỉ cho hợp đồng nối tiếp khi phòng Sắp trả hoặc hợp đồng đã hết hạn; hợp đồng cũ đã xác nhận trả không khóa lượt mới.
- `src/utils/handoverValidation.ts`: biên bản nhận phòng chỉ lập cho hợp đồng giấy đang chờ nhận thật, đúng mã phòng/lượt thuê.
- `src/context/AppContext.tsx`: kiểm tra lại trước khi tạo dự thảo, ký giấy, xác nhận nhận phòng và tạo hợp đồng nối tiếp; sửa liên kết cũ **khi có bằng chứng rõ ràng**, không chuyển trạng thái hoặc sinh dữ liệu giả.
- `src/components/views/RoomsView.tsx` và `HandoverAssetsView.tsx`: cùng sử dụng quy tắc chọn hợp đồng và dữ liệu lịch sử nhận/trả phòng.

## 3. Kiểm thử

- **311 kiểm tra chạy đạt** thuộc **18 file kiểm thử**, bao gồm **46 bài kiểm tra luồng dùng chung**.
- Bộ kiểm tra mới áp dụng các tình huống giống nhau cho: P.101, P.909, P.999, P.102, P.301, P.505, A-12, ROOM_NEW_10 và những trường hợp hợp đồng trùng, liên kết cũ, hợp đồng nối tiếp.
- Phân tích cú pháp 49 tệp TS/TSX: không phát hiện lỗi cú pháp.
- **Chưa hoàn thành kiểm thử TypeScript đầy đủ và `npm run build`** vì môi trường hiện không có gói npm cần thiết và không có dữ liệu cached để cài offline (`@google/genai` chưa có trong cache).

## 4. Dữ liệu máy người dùng

Ứng dụng có thể giữ dữ liệu nghiệp vụ ở localStorage của trình duyệt. Bản ZIP chỉ chứa mã nguồn và dữ liệu mẫu, **không chứa bản ghi được tạo trên máy người dùng sau khi sử dụng**, nên không thể khẳng định mọi hồ sơ giấy/chứng từ riêng của P101/P909 đã đầy đủ. Logic đồng bộ sẽ tự sửa các mã liên kết sai có thể xác thực theo chứng cứ; nếu dữ liệu nguồn xung đột thì phải đối chiếu, không tự suy diễn. **Không xóa localStorage trước khi sao lưu dữ liệu.**

## 5. Cập nhật GitHub

- Repository: https://github.com/haianh15/mnchot
- Trang tải file lên nhánh main: https://github.com/haianh15/mnchot/upload/main

Giải nén ZIP và đưa **nội dung bên trong** lên thư mục gốc repository (giữ nguyên cấu trúc `src/`, `tests/`, các file cấu hình); Commit changes. Không upload file ZIP như một file source duy nhất.
