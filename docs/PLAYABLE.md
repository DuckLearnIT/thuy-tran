# Thủy Trận — web game trên desktop

Mở `http://127.0.0.1:8443/play.html` khi server local chạy. Đây là entry riêng,
không liên kết với landing, trang luật, checkout hay footer. Chỉ commit/push
code; không deploy khi chưa được yêu cầu.

## Giao diện hiện tại — 14/10/2026

Theo yêu cầu mới nhất, trang chỉ còn gameplay. Bỏ thiết lập đội, mã seed, chọn
độ khó, quản lý file, nhật ký, hoàn tác, camera thủ công và chế độ quay riêng.
Không khôi phục những phần đó từ các ảnh/handoff cũ.

- Ván mới tự chọn ngẫu nhiên **4 vai khác nhau trong 6 nhân vật**, xáo 24 địa
  danh và chia hai Kế sách mỗi người. Mặc định độ khó Làm quen: triều 1, bốn
  ô Nguy cấp, 27 Kế sách gồm hai Triều Biến. Engine vẫn hỗ trợ độ khó khác,
  nhưng giao diện không có bộ chọn.
- Bàn lớn ở giữa, giữ hình 2–4–6–6–4–2 và tất cả lá trong khung. HUD nằm ngoài
  vùng tranh: lượt/ba hành động, bốn vai và tiến độ kế sách ở trái; dòng nước,
  bộ bài và Hiệp lực ở phải; tay bài xòe ở góc dưới.
- Cạnh bàn 808px tại 1280×900, 988px tại 1840×1080, 820px tại 1280×1080,
  628px tại 1280×720 và 530px tại 920×900. Màn hẹp ưu tiên giữ điều khiển
  không che tranh; mobile không phải mục tiêu của phiên bản này.
- Chỉ ô viền son nhận thao tác. Chọn lá trên tay để xem ảnh lớn và dùng/trao;
  Hủy chọn hoặc Escape trở lại thao tác thường. Hover nâng nhẹ lá trên tay.
- Nút tạm dừng hoặc Escape mở Tiếp tục/Chơi ván mới. Màn kết quả hiển thị
  thắng hoặc thua do engine xác định, lý do và nút bắt đầu ván khác.

## Chơi chung trên một máy

1. Hàng bốn nhân vật cho xem tay bài từng người; chỉ người đang có lượt làm
   hành động. Chọn hành động rồi chọn ô viền son.
2. Nha Binh chọn một hoặc hai ô rồi xác nhận. Nha Tướng chọn đồng đội rồi ô
   đến. Hướng Đạo dùng Đi bất kỳ một lần trong lượt. Thám Quân có đích chéo;
   Thuyền Nhẹ có thể vượt các ô Nguy cấp/khoảng trống liên tiếp.
3. Chọn Kế sách thường của người có lượt để trao. Người nhận phải cùng ô,
   trừ Quân Truyền Lệnh được trao từ xa. Các người nhận không hợp lệ bị khóa.
4. Nút tiến độ kế sách sáng khi đủ bốn lá và đứng tại một địa danh tương ứng.
   Bấm để hoàn thành, bỏ bốn lá và nhận một Hiệp lực.
5. Sau 0–3 hành động, bốc hai Kế sách riêng. Vượt năm lá thì phải bỏ bớt hoặc
   dùng bài đặc biệt; game giữ đúng giai đoạn đang chờ.
6. Bốc Biến động từng lá theo triều. Có thể dùng Gia Cố/Cờ Lệnh/Hiệp lực trước
   lần bốc tiếp theo. Khi ô bị loại có quân, chọn đường thoát trước khi tiếp tục.
7. Hoàn thành bốn kế sách, đưa cả đội về Lương Xâm và dùng Cờ Lệnh để thắng.
   Mất bản doanh, mất cả hai ô của một kế sách chưa hoàn thành, không thể thoát
   hoặc nước vượt nấc cuối thì thua ngay.

## Artwork và chuyển động

- F1/F2 vuông bo góc 4% dùng cho địa danh. Không dùng F3, không thêm số lên tranh.
- Mặt sau thật do người dùng cung cấp được sao chép nguyên ảnh vào
  `src/assets/game/back-ke-sach.jpg` (sóng đỏ) và `back-the-nuoc.jpg` (sóng xanh).
- GSAP trải 24 địa danh từ chồng, rồi chia tám lá Kế sách theo hai vòng. Bài
  rút lật mặt, bay tới tay/vùng công bố; trao và bỏ giữ mặt trước. Xếp lại bộ
  giữ mặt sau hướng lên. Ô bị loại và lá Biến động tương ứng rời khỏi bàn,
  không bay vào chồng có thể xáo lại.
- Xếp chồng được minh họa khi bộ hết và khi Triều Biến đưa chồng bỏ lên đầu.
  Điều này vẫn chạy nếu phải xử lý tay sáu lá trước khi chuyển sang Biến động.
- Một hàng đợi khóa thao tác trong lúc chuyển bài; state chỉ ghi nhận sau
  chuyển động cuối. Reload giữa chuyển động trở về trạng thái trước thao tác,
  không nhân đôi bài hoặc ghi kết quả một phần.
- Giảm chuyển động hiện bố cục cuối và áp dụng thao tác ngay. Bàn phím có focus
  rõ; vùng thông báo đọc kết quả. Tạm dừng/kết quả khóa nền và giữ focus trong hộp.

## Lưu và luật

Tự lưu ván riêng với khóa `thuy-tran-webgame-v2` trong localStorage. Reload
khôi phục ván bốn người hợp lệ, không chia lại tay đã lưu. JSON hỏng, ván không
đủ bốn người hoặc storage bị chặn thì bắt đầu ván mới/chơi bằng bộ nhớ. Khóa
`thuy-tran-playable-v1` của giao diện cũ được giữ nguyên, không tự chuyển đổi.
Chơi ván mới thay bản v2 đang lưu.

Engine thuần JSON và RNG theo seed không đổi trong task này. Nội dung đã đối
chiếu với Google Doc `1WqryE88CVgMAJLq1xULrtpy2IznMl32enYt3hA5XkKE`, bản ngắn
`t.h3zldwgq6rwy` và bản dài `t.0`. Năng lực ưu tiên quyết định mới nhất trong
`src/data/cards.ts`, không suy từ chữ cũ trên artwork Hướng Đạo/Thuyền Nhẹ.

Gia Cố/Cờ Lệnh/Hiệp lực không tốn hành động. Người giữ Cờ Lệnh không phải đứng
cùng nhóm được chuyển. Hai Triều Biến tăng nước ngay từng lần nhưng chỉ xếp
chồng bỏ Biến động lên trên một lần sau hai lượt rút Kế sách, giữ nguyên phần
dưới. Không có Biến động giữa hai lượt rút. Ô bị loại không phục hồi.

Chỉ chơi chung trên một máy. Không có tài khoản, API, đối thủ AI hoặc mạng.
DOM, CSS 3D và GSAP giữ tranh rõ, không yêu cầu WebGL, không bắt cuộn hay pin.

## Code và kiểm tra

- Entry `play.html` / `src/play.tsx`, build đồng thời với site cũ.
- Luật `src/game/engine.ts`; UI `PlayTable.tsx`, bàn `Board.tsx`, chuyển bài
  `CardMotion.tsx`, CSS riêng `.wg-*` trong `play.css`.
- Engine: `node --experimental-strip-types scripts/check-playable-engine.ts`
  và `scripts/check-webgame-engine.ts` (Node 24).
- `scripts/check-playable.js` chạy trong console local: quan sát save, artwork,
  tỉ lệ/bo góc, đủ 24 ô, các HUD không đè tranh và không tràn viewport.
- `scripts/check-webgame.js` cung cấp `window.__webgameQA.setup(name)` và
  `.test(name)`. Setup **thay save v2 bằng fixture**; phải sao lưu ván trước.
  Chạy setup, reload, nạp lại script rồi test. Không có cửa nhập fixture trong UI.
- Hai script QA `.pt-*` cũ cho import/menu/camera đã xóa vì UI đó bị bỏ.
- `npx tsc --noEmit`, `npm run build`. Không chạy deploy.

Đã kiểm tra 13 tình huống qua Chromium/Codex In-app Browser (79 assertions),
84 kiểm tra bố cục mỗi cỡ desktop nêu trên, chia đủ tám lá và khóa đầu vào,
bàn phím/tạm dừng và giảm chuyển động. Kiểm tra engine cũ và random bốn vai
qua 50 seed đạt. Chưa xác nhận trên engine trình duyệt khác hoặc thiết bị thật.
