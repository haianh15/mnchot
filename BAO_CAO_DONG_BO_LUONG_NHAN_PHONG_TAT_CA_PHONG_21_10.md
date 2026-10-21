# Báo cáo cập nhật – đồng bộ luồng nhận phòng cho tất cả phòng

**Nguồn:** ZIP `CCMN_MNCHOT_BO_SUNG_DAY_DU_HO_SO_DEMO_PHONG_DANG_THUE_FULL (1)(1).zip` người dùng cung cấp.

## Nội dung đã sửa

1. **Một hàm xác nhận chung:** `confirmCheckInPH05` tiếp tục là điểm duy nhất kiểm tra và ghi nhận phòng đã có khách. Chức năng Bàn giao nay gọi **chính hàm này**, không tự tạo quy tắc riêng cho P.999 hay phòng mẫu nào.
2. **Xác nhận biên bản ký và nhận phòng trong cùng luồng:** Bên Bàn giao, sau khi hai bên thực tế ký biên bản, Chủ nhà có thể tích chọn đã nhận phòng và nhập ngày thực tế. Hệ thống kiểm tra điều kiện trước, rồi lưu xác nhận biên bản và cập nhật hợp đồng/phòng/khách cùng lượt thao tác. Không tự đổi trạng thái khi chỉ Lưu nháp hoặc Lưu Đã lập.
3. **Biên bản đã xác nhận nhưng phòng vẫn Trống:** Có nút **Xác nhận nhận phòng** ngay tại biên bản đã ký để xử lý hồ sơ đã lưu ở phiên bản trước. Không cần lập lại biên bản, không tự chọn hợp đồng khác.
4. **Liên kết đầy đủ sau nhận phòng:** `currentTenantId`, `currentTenantName`, `currentContractId`, `currentLeaseId`, ngày thuê, số người ở, hợp đồng có hiệu lực và sự kiện bắt đầu lần thuê cùng cập nhật từ bản ghi đã đối chiếu.
5. **Các mục giao diện theo ảnh được bỏ:** banner nhắc dữ liệu mẫu, banner đối chiếu hồ sơ trên Danh sách/Chi tiết phòng, nhãn/nút "Hồ sơ DEMO", dòng thông báo chạy thử trên đầu màn hình, label cạnh bộ lọc quyết toán cọc. Bộ lọc vẫn dùng bình thường và có nhãn truy cập.
6. **Hai cột thanh toán** hiện "Đã đối chiếu" khi hàm kiểm tra chứng từ đầu kỳ trả về hợp lệ; trường hợp không đủ căn cứ hiển thị "Chưa xác nhận". Không dựa đơn thuần vào cờ `hasDeposit` trong phòng.

## Luồng chuẩn chung (mọi mã phòng)

`Trống → ký hợp đồng, hồ sơ khách và tiền đầu đã được đối chiếu → kiểm kê, hiện trạng → Lưu Đã lập biên bản → xác nhận hai bên ký giấy → xác nhận đã thực tế nhận phòng, ngày nhận → Đang thuê`.

Nếu chỉ lưu nháp hoặc biên bản Đã lập thì phòng **chưa chuyển Đang thuê**. Nếu đã ký giấy nhưng khách chưa nhận phòng thực tế thì có thể lưu biên bản Đã xác nhận và xác nhận nhận phòng sau.

## Kiểm tra

- 15/15 bộ kiểm thử Node hiện có đạt, gồm bài kiểm tra bổ sung 12 tình huống liên kết chung.
- 47 tệp `.ts`/`.tsx` không có lỗi **cú pháp** trong kiểm tra TypeScript `transpileModule`.
- 0 đường dẫn import tương đối nội bộ bị thiếu.
- Chưa chạy được `vite build`/kiểm thử E2E do không có các thư viện npm trong môi trường. Những ca đã đạt không thay cho nghiệm thu trực tiếp trên website.

## Giới hạn dữ liệu

Dữ liệu `DEMO-*` có sẵn trong mã nguồn **vẫn là dữ liệu giả lập**. Ẩn nhãn DEMO trên giao diện không khiến biên bản hay giao dịch giả lập trở thành chứng từ thực. Bản này vẫn dùng `localStorage` chứ không có backend xác thực/ghi nhận giao dịch ngân hàng thật. Hãy thử nghiệm với dữ liệu không nhạy cảm.
