# BÁO CÁO CẬP NHẬT BIÊN BẢN TRẢ PHÒNG VÀ GIAO DIỆN – 21/10/2026

## Căn cứ bản sửa
Dùng trực tiếp tệp do người dùng tải lên: `CCMN_MNCHOT_BO_SUNG_DAY_DU_HO_SO_DEMO_PHONG_DANG_THUE_FULL (1)(1).zip`.

## Phạm vi chỉnh sửa
1. **Bàn giao → Hoàn thiện biên bản trả phòng:** thay khung xem trước sơ sài bằng văn bản 7 mục: (I) thời gian, địa điểm và căn cứ; (II) thông tin hai bên; (III) kết quả nhận lại và bảng tài sản; (IV) chỉ số điện, nước; (V) đối chiếu và xử lý phát sinh; (VI) thông tin quyết toán cọc; (VII) kết luận, chữ ký. Quốc hiệu, tiêu ngữ, số biên bản và người ký hiển thị trong văn bản. Phần **Ghi nhận kết quả ký giấy** ở phía dưới bản biên bản.
2. Các thông số và kết quả chỉ hiển thị từ các bản ghi thực tế đã lưu trong **đúng phòng / hợp đồng / lần thuê**. Dữ liệu chưa có sẽ thể hiện là “Chưa ghi nhận”, không tự điền số liệu ví dụ hoặc mặc định bằng 0. Không tự xác nhận tiền cọc đã hoàn/chuyển khoản.
3. Khi lưu nháp hoặc lưu đã lập, giữ địa điểm bàn giao và ghi chú ban đầu từ phiếu trả phòng.
4. **Quản lý phòng:** bỏ banner yêu cầu bổ sung hồ sơ DEMO, bỏ nhãn Hồ sơ DEMO và các cảnh báo dài trong bảng, nhất quán nhãn thanh toán “Đã đối chiếu” (khi có bản ghi hợp lệ theo kiểm tra phần mềm) hoặc “Chưa xác nhận”. Việc bỏ nhãn giao diện **không làm thay đổi nguồn dữ liệu/khả năng kiểm chứng thực tế**.
5. **Quản lý hợp đồng:** xóa label chữ “Tình trạng quyết toán cọc”, giữ dropdown bộ lọc và aria-label cho hỗ trợ tiếp cận.
6. **Bàn giao nhận phòng:** sau khi biên bản đã được hai bên xác nhận, nếu phòng còn Trống thì hiển thị nút quay về đúng Chi tiết phòng để chủ nhà thực hiện **Xác nhận nhận phòng**. Không tự chuyển Đang thuê khi mới lập/ghi nhận ký biên bản; cần xác nhận ngày nhận phòng thực tế và các điều kiện nghiệp vụ của PH05.
7. **Giao diện chung:** bỏ banner thông báo chạy thử theo yêu cầu bố cục, không thay đổi mô hình bảo mật/lưu trữ dữ liệu.

## Kiểm tra đã thực hiện
- Duyệt cú pháp **47 tệp TS/TSX**, không có lỗi cú pháp.
- Kiểm tra **141 tham chiếu import nội bộ**, tất cả tồn tại.
- Chạy tất cả bài kiểm tra Node có sẵn và bổ sung `tests/returnReportDocument.test.cjs`, đều đạt.
- **Không chạy build Vite hoặc kiểm thử tương tác hoàn chỉnh trên trình duyệt** (môi trường không có node_modules).

## Giới hạn và lưu ý
- Bộ hồ sơ khởi tạo trong ZIP vẫn có dữ liệu mô phỏng; bỏ chữ DEMO trên giao diện **không biến chứng từ mô phỏng thành chứng từ có thật**. Không sử dụng làm xác nhận giao dịch/biên bản ký giấy ngoài đời.
- Ứng dụng hiện lưu dữ liệu trong trình duyệt, chưa có backend lưu trữ và xác thực tập trung. Không nhập dữ liệu cá nhân, ngân hàng hoặc giao dịch thật cho đến khi hạ tầng bảo mật được triển khai.
- Phòng P999 chỉ chuyển sang **Đang thuê** sau khi chủ nhà bấm xác nhận nhận phòng, không tự chuyển chỉ vì lập hoặc xác nhận biên bản.
