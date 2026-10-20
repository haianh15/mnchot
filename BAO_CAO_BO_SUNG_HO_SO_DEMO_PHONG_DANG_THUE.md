# BỔ SUNG HỒ SƠ MẪU CHO PHÒNG ĐANG THUÊ — 20/10/2026

## Phạm vi

Bản website được sửa từ `CCMN_MNCHOT_KIEM_SOAT_HO_SO_DANG_THUE_BAN_GIAO_FULL.zip`.

Đồng bộ **bộ dữ liệu DEMO**, không có giá trị chứng minh hợp đồng ký thật, khách đã chuyển khoản hoặc biên bản bàn giao đã ký giấy. Không sử dụng làm dữ liệu nghiệp vụ thực tế.

## Các phòng mẫu hoàn chỉnh

P.101, P.102, P.201, P.203, P.301, P.302, P.401, P.402, P.403 đều có đủ: hồ sơ khách; hợp đồng đã ký; dữ liệu DEMO ghi nhận cọc và tiền thuê kỳ đầu; biên bản DEMO nhận phòng; kiểm kê và hiện trạng DEMO đúng phòng/lần thuê; sự kiện bắt đầu lần thuê.

- P.101: dữ liệu mẫu gốc đã đủ, giữ nguyên.
- P.102: sửa **riêng khoản thu mẫu gốc** từ 3.600.000 + 3.600.000 sang 3.800.000 + 3.800.000 để khớp hợp đồng P.102; chứng từ mới gắn nhãn DEMO, không nhận là giao dịch thật.
- P.201, P.203: giữ hợp đồng và khách mẫu gốc; thêm dữ liệu DEMO về cọc/thuê đầu, bàn giao, kiểm kê.
- P.301, P.302, P.401–P.403: tạo hợp đồng mẫu đúng phòng, đúng khách, đúng lần thuê, rồi bổ sung dữ liệu DEMO liên quan. Tiền thuê ở nhóm này là số **minh họa**, không được coi là thỏa thuận thực tế.
- P.103, P.202, P.303: giữ **Trống**, không tự phát sinh hồ sơ đã nhận phòng.

## Nếu bạn đã dùng bản cũ trên Vercel

LocalStorage có thể vẫn giữ bộ dữ liệu mẫu thiếu, vì thay ZIP mới không tự thay thế dữ liệu trong trình duyệt đã lưu. Trong **Quản lý phòng**, khi thấy cảnh báo còn phòng mẫu thiếu hồ sơ, hãy chọn **Bổ sung hồ sơ DEMO**, đọc cảnh báo và xác nhận. Tính năng chỉ thêm bản ghi mẫu đang thiếu trong danh sách phòng demo cố định, có kiểm tra mã hợp đồng/khách/lần thuê; không ghi đè hợp đồng cá nhân hóa hoặc chứng từ người dùng đã sửa. Không cần xóa localStorage hoặc tài khoản.

Không áp dụng thao tác này cho dữ liệu thực. Để ghi nhận tiền cọc và biên bản thực, Chủ nhà phải đối chiếu sao kê và biên bản đã ký, sau đó nhập chứng từ thật qua chức năng nghiệp vụ tương ứng.

## Kiểm tra

Bổ sung `tests/demoOccupiedFixtures.test.cjs`, cập nhật kiểm tra dữ liệu mẫu ở `tests/occupiedRoomReadiness.test.cjs`. Tất cả bài kiểm tra Node sẵn có đã đạt. Kiểm tra cú pháp TypeScript 47 file thành công. Build Vite/chạy trình duyệt vẫn cần kiểm thử sau khi triển khai (thư viện npm chưa được cài trong môi trường kiểm tra).
