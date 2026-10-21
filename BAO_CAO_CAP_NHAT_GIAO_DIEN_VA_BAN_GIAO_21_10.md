# Báo cáo cập nhật – 21/10/2026

Nguồn: ZIP `CCMN_MNCHOT_BO_SUNG_DAY_DU_HO_SO_DEMO_PHONG_DANG_THUE_FULL (1)(1).zip` do người dùng cung cấp.

## Thay đổi

- **Bàn giao → Ghi nhận kết quả nhận lại phòng:** bổ sung cột **Số lượng đã có (khi nhận)** ngay trước **SL Thực tế**. Số gốc được lấy theo mã phòng + mã lần thuê + hợp đồng nguồn từ kiểm kê đã hoàn tất; là dữ liệu chỉ xem. Nếu không có kiểm kê nguồn hợp lệ thì hiện “—”, không tự đoán số 0 hoặc dùng định mức danh mục.
- **Bàn giao → Biên bản nhận phòng:** khi biên bản đã xác nhận nhưng phòng vẫn Trống, xuất hiện thao tác **Xác nhận đã nhận phòng** và nhập ngày thực tế. Thao tác gọi hàm xác nhận của hệ thống (hợp đồng, hồ sơ khách, chứng từ cọc/thuê đầu, biên bản đủ chữ ký), chỉ khi thành công mới chuyển phòng Đang thuê; không tự chuyển chỉ vì lập/lưu biên bản.
- **Quản lý phòng:** ẩn banner nhắc bổ sung DEMO, nút bổ sung DEMO và các nhãn/cảnh báo tổng hợp đang xuất hiện trong ảnh người dùng gửi. Các dấu hiệu kiểm thử trong dữ liệu nguồn không bị sửa hoặc giả thành chứng từ thật. Chỉ báo “Đã đối chiếu” vẫn dựa vào hàm kiểm tra chứng từ trong dữ liệu.
- **Quản lý hợp đồng:** bỏ nhãn nhìn thấy “Tình trạng quyết toán cọc”, giữ nguyên dropdown và hành vi lọc, thêm nhãn hỗ trợ đọc màn hình (aria-label).

## Giới hạn

- Dữ liệu mô phỏng vẫn là dữ liệu thử nghiệm, không phải hồ sơ hoặc giao dịch được xác thực ngoài đời. Cảnh báo chung ứng dụng là bản chạy thử vẫn giữ nguyên.
- Không sửa những dữ liệu đã lưu trong trình duyệt người dùng.
- Chưa chạy build Vite hoặc kiểm thử trực tiếp trên trình duyệt do thiếu thư viện cục bộ của dự án. Các bài kiểm thử Node và kiểm tra cú pháp TypeScript đã được chạy.
