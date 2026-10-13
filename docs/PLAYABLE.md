# Thủy Trận — bản playable trên desktop

Mở `http://127.0.0.1:8443/play.html` khi server local chạy. Đây là entry riêng,
không có liên kết từ hoặc về landing, trang luật, checkout hay footer.
Không xuất bản trang này trong task tạo bản local.

Ưu tiên desktop: bàn trận lớn ở giữa, hành động và tay bài bên trái, đội hình
và dòng nước bên phải. Một màn hình chứa đủ bàn, tay bài và nút chuyển bước.
Thanh trên cùng đánh dấu ba giai đoạn của lượt. Chọn lá trên tay để đọc ảnh lớn
ở bên phải; các lựa chọn không liên quan được tạm ẩn, **Hủy chọn** đưa chúng
trở lại. Mở **Tùy chọn** để tạo/mở/lưu ván hoặc đọc nhật ký.

## Dùng bàn chơi

1. Chọn 4–6 nhân vật, độ khó và mã bàn trận. Cùng mã, đội và độ khó tạo cùng
   bàn, bài và thứ tự lượt. Các địa danh được xáo thật, xếp 2–4–6–6–4–2.
2. Điều khiển cả đội trên một máy. Chỉ nhân vật đang có lượt làm hành động;
   tay bài của mọi người vẫn xem được qua hàng thẻ nhân vật dưới bàn.
3. Chọn hành động rồi chọn ô viền son. Nha Binh chọn tối đa hai ô rồi xác nhận;
   Nha Tướng chọn đồng đội trước khi chọn đích. Hướng Đạo có nút năng lực riêng.
4. Chọn Kế sách thường trong tay người có lượt để trao; chỉ người cùng ô nhận
   được, trừ Quân Truyền Lệnh. Hoàn thành kế sách bằng nút tương ứng bên phải.
5. Kết thúc sớm hoặc sau tối đa ba hành động, rút hai Kế sách lần lượt. Vượt năm
   lá phải xử lý ngay. Chọn một lá rồi bỏ, hoặc dùng Gia Cố/Cờ Lệnh đúng lúc.
6. Công bố từng Biến động riêng. Có thể dùng Hiệp lực hoặc bài đặc biệt trước
   lá tiếp theo. Ô mất có quân thì phải chọn đường thoát trước khi tiếp tục.

## Quay và lưu

- **Toàn bàn / Theo quân / Zoom / Góc nghiêng:** điều khiển camera bằng layout
  và GSAP, không phóng raster bằng scale. Không có pin hay bắt cuộn trong game.
- **Quay content:** ẩn điều khiển, tay bài và viền gợi ý; bàn lớn hơn. Thanh
  thao tác ở mép dưới hiện khi hover/focus. **Escape** đưa về giao diện đầy đủ.
  Đây là chế độ trình bày, không ghi video hoặc thay luật/rút bài.
- **Toàn màn hình:** dùng khả năng fullscreen của trình duyệt nếu được hỗ trợ.
- Tự lưu riêng vào `localStorage` với khóa `thuy-tran-playable-v1`. Tải lại mở
  đúng ván. Storage bị chặn thì ván vẫn chạy trong bộ nhớ.
- **Tùy chọn → Lưu file ván / Mở ván:** xuất/nhập JSON dưới 1 MB, kiểm tra dữ liệu
  trước khi nhận. File không chứa ảnh; cần cùng bộ tài nguyên và phiên bản code.
- **Hoàn tác:** tối đa 40 bước trong phiên đang mở, giữ cả trạng thái RNG nên
  rút lại cùng lá. Lịch sử hoàn tác không lưu khi tải lại hoặc mở file.
- **Ván mới:** mở thiết lập; có thể quay về ván đang chơi trước khi bắt đầu ván
  mới. Ván mới thay bản tự lưu, nên xuất file trước nếu muốn giữ nhiều ván.

## Luật và phạm vi

Nội dung đối chiếu ngày 12/10/2026 với Google Doc người dùng cung cấp:

- Hướng dẫn ngắn: tab `t.h3zldwgq6rwy`.
- Hướng dẫn đầy đủ: tab `t.0`.
- Document ID: `1WqryE88CVgMAJLq1xULrtpy2IznMl32enYt3hA5XkKE`.

Tên và năng lực dùng quyết định mới nhất trong `src/data/cards.ts`, không suy
từ chữ artwork cũ của Hướng Đạo/Thuyền Nhẹ. Ô xuất phát và kế sách lấy từ
`locations.ts`. Gia Cố/Cờ Lệnh/Hiệp lực không tốn hành động. Cờ Lệnh không yêu
cầu người giữ ở ô của nhóm được chuyển. Nha Binh được củng cố ô đang đứng.
Hướng Đạo thoát đến ô bất kỳ còn tồn tại, độc lập với lần nhảy trong lượt;
Thuyền Nhẹ thoát tới ô gần nhất còn tồn tại theo mỗi hướng thẳng.

Hai lá Triều Biến cùng lượt tăng triều ngay từng lần, nhưng chỉ đưa chồng bỏ
Biến động đã xáo lên trên một lần sau hai lượt rút Kế sách; phần dưới giữ
nguyên. Không có công bố Biến động giữa hai lượt rút này. Bài/ô bị loại không
quay lại. Bốn điều kiện thua được xử lý ngay, không chờ thoát hiểm nếu bản
doanh hoặc kế sách bắt buộc đã mất.

Chỉ chơi chung trên một máy; không có mạng, tài khoản, đối thủ AI, tự chơi
hoặc công cụ dựng thắng giả. Hình học thẻ và quân là DOM với GSAP/CSS 3D để
giữ chữ/tranh rõ và thao tác bàn phím; không yêu cầu WebGL. Không sửa artwork,
không thêm dependency. F1/F2 dùng trên bàn; F3 không được dùng ở trang này.

## Code và kiểm tra

- Entry: `play.html`, `src/play.tsx`; Vite build đồng thời `index.html` và
  `play.html`, asset URL tương đối để hoạt động dưới thư mục con.
- Luật: `src/game/engine.ts`; state JSON, chuyển trạng thái thuần, seeded RNG.
- Giao diện: `src/game/PlayTable.tsx`, `src/game/play.css`, tái sử dụng Curtain,
  font, dữ liệu và hook giảm chuyển động; không dùng Header/Footer của site.
- Kiểm tra engine: `node scripts/check-playable-engine.ts` (Node hỗ trợ strip
  TypeScript, local đang dùng Node 24).
- Kiểm tra qua console của trang local đã mở curtain:
  `scripts/check-playable.js`, `scripts/check-playable-ui-cases.js` và
  `scripts/check-playable-layout.js` (đo layout desktop, tay sáu lá và menu).
  Hai script có thay đổi ván local và nhập các fixture kiểm thử; chạy trên ván
  thử riêng, không chạy trên ván content chưa lưu.
- `npx tsc --noEmit`, `npm run build`; không chạy `npm run deploy`.

Các kiểm tra tự động không thay thế cân bằng độ khó của bản game in thực tế.
