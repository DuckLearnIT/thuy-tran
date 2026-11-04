# Studio bìa sau — chỉ trên máy local

Yêu cầu ngày 04/11/2026: tạo ảnh thành phần “Trong hộp” theo vùng được khoanh
trong mẫu, bằng asset thật của Thủy Trận, xuất PNG 4K và giữ nội bộ.

## Mở công cụ

Studio nằm **ngoài Git repository**, ở thư mục anh em:
`../Thuy-Tran-Back-Cover-Studio/`. Mở `MO-STUDIO.cmd`, rồi vào
`http://127.0.0.1:8444/`. Launcher tái sử dụng server đúng studio nếu đã chạy;
nếu chưa có, chạy Vite bằng dependency sẵn của repo và mở trình duyệt.

Đây là công cụ local, không phải route mới của landing và không cần router,
tài khoản hay dịch vụ lưu ảnh. Server bind loopback; origin ngoài máy bị 403.
Build phát hành studio bị chặn. Không thêm link vào navbar/footer, không chép
studio/ảnh xuất vào `src`, `public`, `dist` hoặc repository public.

## Phạm vi và dữ liệu

- 24 địa danh F1/F2, đúng hình vuông bo góc; F3 chỉ là lá bốc Con nước.
- 6 thẻ nhân vật, 7 mẫu Kế sách, mặt lưng Kế sách/Con nước hiện có.
- 6 standee nhân vật và 4 dấu GLB hiện tại, dùng lại `loadPiece` từ repo.
- Ảnh xuất dùng nguồn in gốc: F1/F2 PDF `tái màu` chuyển PNG 1488×1488;
  13 thẻ dài lấy PNG gốc 1500×2078, mặt lưng gốc và sáu GLB nhân vật chưa nén
  lại cho website. Không lấy nhầm bộ `FINAL` có layout cũ, không chỉnh màu.
- Bốn dấu nằm riêng ngoài bàn; không sinh thuyền, meeple, cọc hay tranh giả
  theo ảnh tham khảo. Không dùng số lượng/luật của ảnh mẫu làm nguồn dữ liệu.
- Bố trí phục vụ ảnh bìa sau; không phải cách xếp bàn bắt buộc khi chơi.

Private source gồm `scene.ts`, `studio.ts`, `index.html`, `style.css`, config
Vite và `check-studio.js`. Không upload chúng lên GitHub hoặc CDN. Source và
PNG được giữ ngoài repo có chủ đích theo yêu cầu riêng tư; tài liệu này là
chỉ dẫn tìm công cụ cho agent chạy trên cùng máy, không phải bản backup nó.

## Xuất ảnh

Chỉnh góc bằng kéo chuột/slider/góc mẫu; chuột phải dịch, cuộn để zoom.
Bật/tắt nhóm thành phần, đổi tỉ lệ, nền và bóng. Nút “Vừa khung” lấy đủ mọi
vật nếu đã zoom/crop. Nút xuất luôn nằm cố định dưới sidebar.

Preview render 2× kích thước CSS thay vì phụ thuộc DPR 1 của Windows.
Chế độ “Mặt thẻ chính diện” kê các thẻ dài về camera để giữ tỷ lệ tranh trong
ảnh; tắt để đặt nằm trên bàn. Mặc định góc 60°, toàn bàn 78°; địa danh vẫn
giữ phối cảnh thật. Đây là thay đổi sau phản hồi ảnh mềm và thẻ bị bè ngang.

- Vuông: 4096×4096; ngang: 4096×3072; dọc: 3072×4096.
- PNG alpha thật khi chọn trong suốt; ô caro chỉ có trong preview.
- Export render lại bằng Three.js ở đúng kích thước pixel, không phóng ảnh
  chụp màn hình. Không có chữ/UI studio trong ảnh.
- Bản mẫu và QA lưu trong `../Thuy-Tran-Back-Cover-Studio/exports/`, không
  đưa vào `docs/qa` public. Tùy chọn ở localStorage riêng của origin local.
- DPI/kích thước in được đặt sau trong phần mềm dàn trang.

## Kiểm chứng

- TypeScript của studio đạt; HTTP trang/module/model/artwork 200.
- TCP chỉ `127.0.0.1:8444`; origin ngoài máy 403; build studio bị chặn trước
  khi tạo dist. Source và PNG nằm ngoài cây Git website.
- `check-studio.js`: 31 checks đạt trong Chromium, gồm F1/F2 riêng biệt, đủ
  mười model có đế, bật/tắt mesh, bảo vệ nhóm cuối, ba preset không cắt vật,
  scale quân giữ vị trí ô, đổi nền giữ framing và khôi phục preview sau xuất.
- Đã đo nguồn PNG 1488/1500px, buffer preview 2× và tỷ lệ mặt thẻ sau chiếu
  camera ở cả ba preset (sai số dưới 0,002), không chỉ kiểm tra kích thước mesh.
- Đã bấm nút tải PNG thật. PNG 4096×4096 RGBA, alpha 0–255, bốn góc alpha 0;
  render 4096×3072 nền giấy có alpha 255. Không ghi ô caro vào file xuất.
- CUA từng lỗi khởi tạo kernel; thêm thư mục node_modules của repo bằng API
  js_add_node_module_dir đã khôi phục. Không dùng Chrome headless; người dùng
  đã chọn tự mở kiểm tra thay cho phương án headless.

Chỉ tài liệu vận hành được commit/push. Không triển khai studio hoặc bìa
sau lên website công khai, kể cả khi task bình thường có quy ước auto-deploy.
