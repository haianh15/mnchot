# HƯỚNG DẪN ĐƯA BẢN WEBSITE HOÀN CHỈNH LÊN GITHUB WEB (KHÔNG LỒNG THƯ MỤC)

## A. Tạo GitHub repository mới

1. Mở https://github.com/new và đăng nhập tài khoản `haianh15`.
2. Repository name: `ccmn-chunha-63uc` (hoặc một tên mới chưa dùng).
3. Chọn Private nếu chưa cần công khai. Không tích chọn thêm README, .gitignore, license vì mã nguồn đã có.
4. Nhấn **Create repository**.

## B. Tải toàn bộ website lên từ trình duyệt

1. Tải `CCMN_TOAN_BO_WEBSITE_UPLOAD_GITHUB_WEB.zip` và giải nén ra một thư mục trên máy.
2. **MỞ VÀO BÊN TRONG** thư mục vừa giải nén, kiểm tra bạn nhìn thấy trực tiếp `src`, `package.json`, `index.html`, `vite.config.ts`, `README.md`.
3. Trên trang GitHub của repository **mới**, ở cấp gốc chọn `uploading an existing file` hoặc `Add file > Upload files`.
4. Trong File Explorer, chọn **tất cả các file và thư mục nằm BÊN TRONG** thư mục giải nén (Ctrl+A) rồi kéo vào trang GitHub.
5. Trước khi Commit, kiểm tra đường dẫn bắt đầu bằng `src/...`, `package.json`, `index.html`. Không được thấy `UPLOAD_.../src/...`, `ccmn-.../src/...`, hay `WEBSITE_.../src/...`.
6. Commit changes.

**Đừng tải chính file ZIP lên GitHub** (nếu làm thế Vercel không chạy được). **Đừng kéo cả thư mục giải nén**: GitHub sẽ tạo thêm một cấp thư mục. Nếu đã nhầm, Cancel và làm lại.

## C. Đưa lên Vercel

1. Mở https://vercel.com/new → Import repository mới `ccmn-chunha-63uc`.
2. Framework Preset: `Vite`.
3. Root Directory: `./` (khác dự án GitHub cũ; dự án này đã đặt package.json ở gốc).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Install Command: `npm install`.
7. Nhấn Deploy. Nếu báo lỗi Build Failed, chụp Build Logs để sửa tiếp.

**Không xóa hay sửa repository cũ `ccmn-uc63-fixed`:** repo mới hoàn toàn độc lập.
