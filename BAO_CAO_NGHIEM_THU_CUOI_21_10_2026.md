# BÁO CÁO KIỂM TRA TOÀN BỘ LUỒNG – PHIÊN BẢN CHUẨN BỊ CHỐT (21/10/2026)

## 1. Nguồn và phạm vi

- Bản nền: `CCMN_MNCHOT_BO_DIEU_KIEN_THUE_LAP_HOP_DONG_TRUC_TIEP_SUA_GHI_NGAY_TRA_LIEN_HE_21_10_FULL.zip`.
- Giữ bộ xử lý chung của B, giao diện ba phân hệ tài chính đã hợp nhất từ A và tất cả sửa đổi trước đây (lập hợp đồng trực tiếp, bàn giao, một người đại diện/một phòng, chuyển Công nợ → Thu công nợ, nút lưu nhắc nợ mở QR chính thức, theo dõi ngày trả và liên hệ).
- Kiểm tra mã nguồn, liên kết dữ liệu tĩnh, bộ kiểm thử tự động, bộ dữ liệu mẫu. Không thể xác nhận giao diện trên trình duyệt khi chưa chạy được Vite build và luồng thực tế.

## 2. Kết quả kiểm tra tự động

| Hạng mục | Kết quả |
|---|---|
| Bộ kiểm thử cũ và kiểm thử hồi quy bổ sung | **60/60 đạt**, 0 không đạt |
| Cấu trúc mã nguồn TS/TSX | **53/53** phân tích cú pháp thành công |
| Import nội bộ tương đối | Không có đường dẫn thiếu |
| Cấu trúc ZIP đầu ra | Kiểm tra CRC/tính toàn vẹn ZIP đạt |
| Cài thư viện và Vite build | **Chưa xác nhận** (môi trường thử nghiệm không hoàn thành tải npm) |
| Thử thao tác giao diện trên trình duyệt thực | **Chưa xác nhận** |

Lưu ý: nhiều kiểm thử hiện có là kiểm thử hàm, dữ liệu, và đối chiếu mã; chúng không thay thế thử nghiệm E2E trên trình duyệt, không chứng minh 63 UC đã được chạy đầy đủ ngoài thực tế.

## 3. Các luồng nghiệp vụ đã đối chiếu

| Nhóm | Quy tắc/đường liên kết được xác nhận ở mức mã nguồn và kiểm thử |
|---|---|
| Phòng → lập hợp đồng | Phòng trống không có HĐ đang chờ: mở trực tiếp dự thảo, không qua ghi điều kiện thuê. Lịch sử thuê đã trả không chặn lượt thuê mới. |
| Hợp đồng → khách đại diện | Một đại diện không ký song song nhiều phòng, đối chiếu mã hồ sơ/CCCD và họ tên-số điện thoại; khi trả phòng được đứng tên lượt khác. |
| Ký HĐ → nhận phòng | Ký hợp đồng không tự chuyển phòng thành Đang thuê; phải xác minh thanh toán đầu kỳ, biên bản nhận phòng và điều kiện PH-05. |
| Đang thuê → trả phòng/nối tiếp | Theo dõi ngày kết thúc HĐ và ngày dự kiến trả tách riêng; ghi ngày trả và liên hệ mở hộp thoại; gia hạn theo điều kiện. |
| Bàn giao/hồ sơ/tài sản | Kiểm tra cùng roomCode/leaseId/contractId, biên bản và chữ ký thật, không dùng bản ghi lượt thuê khác. |
| Chỉ số → tính tiền | Không cho sửa chỉ số nguồn đã có bảng tính xác nhận; tránh kỳ không có dòng chỉ số; bắt buộc kiểm tra lại khi sửa. |
| Tính tiền → thông báo | Phải có bảng tính xác nhận, hợp đồng đã ký cùng phòng/lượt thuê; không lập QR bằng 0, không thu lại thuê tháng đầu. |
| Thông báo → thu tiền | Thu đúng số trên QR, có mã giao dịch và ngày nhận hợp lệ, chặn mã giao dịch trùng (kể cả có khoảng trắng), không hoàn tác cùng chứng từ hai lần. |
| Công nợ → Thu công nợ | Một thông báo gộp tham chiếu các kỳ nợ gốc; không tạo QR kép, không gom hai lượt thuê khác nhau; xác nhận hoặc hoàn tác cập nhật hai phần. |
| Nhắc nợ → QR | Ghi lịch sử rồi chuyển sang đúng chi tiết Thu công nợ, hoặc mở bước lập thông báo nếu chưa phát hành; QR không được tái sử dụng khi Đã thu/Đã thay thế. |
| Báo cáo | Mã nguồn giữ loại trừ thông báo thu nợ gộp khỏi tổng phải thu nguồn để tránh cộng đúp; chưa xác nhận hiển thị toàn bộ số liệu bằng trình duyệt. |

## 4. Các chỉnh sửa cuối cùng được bổ sung

1. Xác nhận thu tiền kiểm tra ngày hợp lệ, mã giao dịch không rỗng, tài khoản thực nhận, loại bỏ khoảng trắng và kiểm tra trùng chính xác; sinh ID biên nhận khó trùng hơn.
2. Không hoàn tác hai lần chứng từ; thông báo thu công nợ xác nhận xong có nội dung phản hồi đúng bản chất nghiệp vụ.
3. Không tạo thông báo thu công nợ bằng ngày không tồn tại hoặc tài khoản ngân hàng lưu lịch sử; không thay thế lại bản đã bị thay thế.
4. Không ghi phản hồi công nợ cho khoản đã thu, bị thay thế, hoặc khác mã phòng/lượt thuê; ID phản hồi được cấp riêng khi chọn nhiều kỳ; hiển thị lỗi khi cập nhật ngày hẹn không thành công.
5. Không ghi nhắc nợ cho khoản chưa quá hạn hoặc không đúng nguồn.
6. Sửa chỉ số điện/nước chỉ thành công nếu phù hợp liên kết và không phá bảng tính đã xác nhận; giao diện chỉ hiển thị thành công sau khi hàm lưu thực sự thành công.
7. Không xác nhận lại bảng tính đã xác nhận. Thông báo theo kỳ kiểm tra hợp đồng *đã ký* trùng phòng và lượt thuê trong cả hai lối phát hành của B và giao diện A.
8. Hai lượt thuê khác nhau của cùng phòng trong cùng kỳ có mã thông báo và nội dung chuyển khoản phân biệt; không chặn nhau nhầm.
9. Chi tiết thông báo không hiển thị chữ “Đang tạo mã QR...” đối với bản đã thu hoặc đã bị thay thế; hiển thị nguyên nhân QR không còn hiệu lực.
10. Bảng tính đã xác nhận nhưng thiếu hợp đồng nguồn không bị xóa tự động; giao diện đánh dấu chờ đối chiếu và không cho phát hành QR.

## 5. Hồ sơ gốc cần đối chiếu thủ công trước khi triển khai thật

**P.202 – dữ liệu mẫu của bản gốc**: Bảng tính `bill_202_k10` (**450.000 đ**, lượt `THUE-202-L1`, được đánh dấu Đã xác nhận) và hồ sơ trả phòng/quyết toán lịch sử có ghi nhận nhưng danh sách hợp đồng chỉ có dự thảo `HD-202-NHAP` thuộc `THUE-202-L2`. Không có hợp đồng giấy đã ký khớp `THUE-202-L1` trong mã nguồn mẫu. Cần tìm chứng từ/hợp đồng đúng và nhập/đối chiếu bằng dữ liệu thật. **Không tự tạo hợp đồng hoặc biên bản giấy giả, không xóa bảng tính 450.000 đ, không tự ghép sang L2.**

Các dữ liệu localStorage thực tế trên trình duyệt của người dùng có thể khác dữ liệu khởi tạo ZIP. Báo cáo không thể kết luận tất cả dữ liệu người dùng đã nhất quán nếu chưa sao lưu và kiểm tra trên chính máy/website họ đang dùng.

## 6. Giới hạn triển khai và khuyến nghị

- Ứng dụng đang dựa vào `localStorage` trên trình duyệt và luồng tài khoản demo phía client. Đây **không phải bảo mật máy chủ hoặc cơ sở dữ liệu đa thiết bị an toàn**. Chỉ nên nghiệm thu quy trình giao diện/single-owner demo; để chạy chính thức với tiền và hồ sơ cá nhân cần backend, xác thực và sao lưu thích hợp.
- Không có kết quả `npm run build`, kiểm thử trình duyệt thật, kiểm tra QR với ngân hàng hay đối soát số dư tài khoản thực tế trong phiên kiểm tra này. Không tự động cập nhật GitHub.
- Trước triển khai: (1) sao lưu localStorage/dữ liệu cũ; (2) chạy `npm install`, `npm run build`, `node --test tests/*.test.cjs`; (3) trên trang staging thao tác thử P.101/P.909/P.202 và phòng tạo mới; (4) kiểm tra QR–giao dịch–thu/hủy–báo cáo thực; (5) đối chiếu chứng từ thiếu của P.202 trước khi chốt dữ liệu vận hành.

**Trạng thái bàn giao:** Đã có *bản mã nguồn nghiệm thu kỹ thuật để cập nhật và chạy thử*. **Chưa thể xác nhận website triển khai là hoàn chỉnh 100%/sẵn sàng vận hành chính thức** cho đến khi giải quyết hồ sơ nguồn P.202 và chạy build + kiểm thử trình duyệt trên dữ liệu thật.
