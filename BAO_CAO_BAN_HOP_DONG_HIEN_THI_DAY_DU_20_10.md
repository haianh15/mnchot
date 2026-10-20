# BÁO CÁO CẬP NHẬT – XEM CHI TIẾT HỢP ĐỒNG DẠNG VĂN BẢN

Ngày cập nhật: 20/10/2026.

## Nội dung đã sửa

- Khi chọn một hợp đồng ở Quản lý hợp đồng → Danh sách hợp đồng, khu vực Chi tiết hợp đồng hiện bản văn hợp đồng có quốc hiệu "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", tiêu ngữ "Độc lập - Tự do - Hạnh phúc", số hợp đồng, các bên, điều khoản, chỗ ký và họ tên người thuê.
- Nút "Xem bản hợp đồng khổ lớn" mở bản văn với bố cục rộng; nút "In / Lưu PDF" sử dụng hộp thoại in của trình duyệt với định dạng khổ A4.
- Bản văn lấy thông tin từ đúng mã hợp đồng đã chọn (phòng, lần thuê, khách thuê, thời hạn, giá, cọc, nội dung thỏa thuận); không lấy dữ liệu hợp đồng trước.
- Giao diện lập dự thảo cho nhập tùy chọn thông tin pháp lý Bên A (họ tên, CCCD, địa chỉ, điện thoại) và địa chỉ tòa nhà/phòng; thông tin được lưu riêng cùng hợp đồng để không suy diễn từ chủ tài khoản ngân hàng.
- Sửa lỗi form lập dự thảo trước đây tự thay điều khoản người dùng nhập bằng một câu mặc định. Khi lưu, giờ dùng đúng `terms.trim()`.
- Bản xem trước dự thảo và Chi tiết hợp đồng dùng chung `ContractDocument.tsx`.
- Giữ các nút nghiệp vụ cũ (quyết toán cọc, xem phòng, theo dõi trả phòng, gia hạn) ở ngoài phần văn bản.

## Những nội dung chưa tự động điền

- Hợp đồng cũ không có thông tin pháp lý Bên A hoặc địa chỉ tòa nhà: bản hiển thị đánh dấu chưa có dữ liệu/để trống.
- Các điều khoản cụ thể về nghĩa vụ, phí dịch vụ, chế tài, chấm dứt hợp đồng không được tự tạo như thể đã được hai bên thỏa thuận, bởi cấu trúc dữ liệu hiện tại chỉ lưu một trường `terms`.
- Hợp đồng giấy đã ký: bản văn trong hệ thống là trình bày lại dữ liệu, không phải bản quét có chữ ký. Hồ sơ lưu tên tệp chứng cứ ký (nếu có) nhưng chưa cung cấp cơ chế lưu bản ký gốc trên máy chủ.
- Trường Bên A mới áp dụng cho hợp đồng lập từ phiên bản này, không hồi tố vào hợp đồng đã ký cũ; không sửa hợp đồng đã ký trái quy tắc nghiệp vụ.

## Kiểm tra

- Kiểm tra 40 file TypeScript/TSX bằng TypeScript parser: không có lỗi cú pháp.
- Kiểm tra 113 đường dẫn import tương đối: không thiếu tệp.
- 13 kiểm tra bản văn hợp đồng qua render cây JSX: đạt.
- Các bài kiểm tra nghiệp vụ hồi quy sẵn có về Phòng, Bàn giao, Trả phòng và Quyết toán cọc: đạt.
- Chưa thực hiện build Vite và E2E trên trình duyệt vì môi trường không có dependency npm của dự án. Không coi đây là bản sao hợp đồng pháp lý hoàn chỉnh.

## Cập nhật

Giải nén ZIP đầy đủ và tải các **nội dung bên trong** lên thư mục gốc repository `haianh15/mnchot`. Không tải một thư mục bao ngoài. Commit vào nhánh main và đợi Vercel triển khai lại.
