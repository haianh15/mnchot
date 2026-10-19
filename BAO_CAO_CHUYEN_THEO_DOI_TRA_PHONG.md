# Báo cáo chuyển Theo dõi trả phòng sang Quản lý hợp đồng

Cơ sở: bản mã nguồn CCMN_MNCHOT_DA_SUA_LIEN_KET_HOP_DONG_PHONG_COC_HO_SO.zip và yêu cầu người dùng ngày 19/10/2026.

## Thay đổi

- Trong **Quản lý phòng**, bỏ danh sách «Theo dõi thời hạn hợp đồng» bị lặp và danh sách «Kế hoạch trả phòng» khỏi điều hướng; màn hình quản lý phòng tập trung Danh sách phòng, Nhận phòng, Trả phòng và thao tác ở Chi tiết phòng.
- Trong **Quản lý hợp đồng**, có hai chức năng tách biệt: «Theo dõi hạn hợp đồng» (ngày kết thúc hợp đồng) và «Theo dõi trả phòng» (ngày dự kiến trả đã được xác nhận). Mở các danh sách bằng nút tại Danh sách hợp đồng; không tạo mục Sidebar mới.
- Màn hình Theo dõi trả phòng có danh sách, lọc phòng, tình trạng, khoảng ngày, trạng thái đã/chưa có ngày dự kiến trả. Có thể mở đúng hợp đồng, xem phòng, ghi/cập nhật ngày trả, ghi nhận liên hệ; các biểu mẫu chỉ hiện khi bấm thao tác.
- Từ **Chi tiết phòng → Xem kế hoạch trả** chuyển thẳng sang **Quản lý hợp đồng → Theo dõi trả phòng** với mã phòng + hợp đồng + lần thuê, không tự lấy dòng đầu. Nút chỉ có khi tồn tại kế hoạch còn theo dõi thuộc lần thuê hiện tại.
- Ký hợp đồng chưa nhận phòng hoặc phòng Trống không được coi là đang có kế hoạch trả. Không sử dụng kế hoạch của lượt thuê cũ.
- Dữ liệu và hàm nghiệp vụ về kế hoạch trả vẫn lưu trong AppContext, không xóa lịch sử nghiệp vụ.

## Kiểm tra

- Kiểm tra cú pháp TypeScript/TSX thông qua transpileModule.
- `npm run test:links`: 8 kiểm tra dữ liệu liên kết phòng–hợp đồng.
- `npm run test:returns`: 10 kiểm tra nguồn và điều hướng của chức năng theo dõi trả phòng.
- Chưa có bản build Vite đã xác nhận hoặc kiểm thử trên trình duyệt, vì môi trường không có dependency npm của dự án.
- Chưa cập nhật trực tiếp GitHub/Vercel. Cần upload vào đúng repo và build, sau đó kiểm tra tương tác trên bản deploy.
