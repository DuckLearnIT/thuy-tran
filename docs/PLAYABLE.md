# Thủy Trận — web game trên desktop

Mở `http://127.0.0.1:8443/play.html` khi server local chạy. Đây là entry riêng,
không liên kết với landing, trang luật, checkout hay footer. Chỉ commit/push
code; không deploy khi chưa được yêu cầu.

## Giao diện hiện tại — 14/10/2026

Theo yêu cầu mới nhất, trang có menu vào trận rồi chuyển sang UI chỉ gồm
gameplay. Menu chọn 4/5/6 người và bốn mức Làm quen/Tiêu chuẩn/Khó/Huyền thoại;
chia vai ngẫu nhiên, không chọn từng vai. Ván đã lưu có Tiếp tục ván. Ván mới
trong màn tạm dừng/kết quả mở menu để chọn lại. Không khôi phục mã seed,
quản lý file, nhật ký, hoàn tác, camera thủ công hoặc chế độ quay riêng.

- Ván mới tự chọn ngẫu nhiên số vai đã chọn trong sáu nhân vật, xáo 24 địa
  danh và chia hai Kế sách mỗi người. Mặc định 4 người, Làm quen: triều 1,
  bốn ô Nguy cấp, 27 Kế sách/hai Triều Biến. Các mức khác dùng 28 lá/ba Triều
  Biến, sáu ô Nguy cấp và bắt đầu ở nấc 2/3/4 theo tài liệu luật.
- Bàn lớn ở giữa, giữ hình 2–4–6–6–4–2 và tất cả lá trong khung. HUD nằm ngoài
  vùng tranh: lượt/ba hành động, bốn vai và tiến độ kế sách ở trái; dòng nước,
  thang nước ở phải; bộ bài/Hiệp lực và tay bài ở hai góc dưới. Khi nhiều quân
  cùng ô, bố trí 2–3 cột để không che nhau.
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

- F1/F2 vuông bo góc 4% dùng cho ô địa danh. **F3** là mặt trước bộ Con nước,
  dùng lúc công bố, chồng bỏ và xếp lại bộ; không kéo F1/F2 vuông vào thẻ dọc.
  Không thêm số lên tranh.
- Mặt sau thật do người dùng cung cấp được sao chép nguyên ảnh vào
  `src/assets/game/back-ke-sach.jpg` (sóng đỏ) và `back-the-nuoc.jpg` (sóng xanh).
- `water-track.png` sao chép nguyên `FULL ASSEST GAME/khung nước.png`. Dấu nước
  chuyển vị trí khi tăng nấc; số nấc/số lá thực tế vẫn theo bảng 8 nấc trong
  hai tài liệu luật, không tự suy luật mới từ các vạch trang trí/artwork.
- GSAP trải 24 địa danh từ chồng, rồi chia tám lá Kế sách theo hai vòng. Bài
  rút lật mặt, bay tới tay/vùng công bố; trao và bỏ giữ mặt trước. Xếp lại bộ
  giữ mặt sau hướng lên. Ô bị loại và lá Biến động tương ứng rời khỏi bàn,
  không bay vào chồng có thể xáo lại.
- Con nước bay tới tâm viewport, lật F3 và giữ 1,1 giây. Đường chỉ bắt đầu ở
  mép lá lớn và tới góc ô tương ứng, nên không bị lá giữa màn che mất. Ô nhấp
  viền son, sau đó lật F2/trượt ra; lá bốc đi vào chồng bỏ hoặc ra khỏi ván.
  Cue không giữ mặt Nguy cấp cũ sau khi người chơi cứu ô ngay. Reduced motion
  đổi state ngay và hiện F3 tĩnh ngắn ở giữa, vẫn có tên/đường chỉ/thông báo.
- Xếp chồng được minh họa khi bộ hết và khi Triều Biến đưa chồng bỏ lên đầu.
  Điều này vẫn chạy nếu phải xử lý tay sáu lá trước khi chuyển sang Biến động.
- Một hàng đợi khóa thao tác trong lúc chuyển bài; state chỉ ghi nhận sau
  chuyển động cuối. Reload giữa chuyển động trở về trạng thái trước thao tác,
  không nhân đôi bài hoặc ghi kết quả một phần.
- Giảm chuyển động hiện bố cục cuối và áp dụng thao tác ngay. Bàn phím có focus
  rõ; vùng thông báo đọc kết quả. Tạm dừng/kết quả khóa nền và giữ focus trong hộp.

## Lưu và luật

Tự lưu ván riêng với khóa `thuy-tran-webgame-v2` trong localStorage. Reload
khôi phục ván 4–6 người hợp lệ sau khi chọn Tiếp tục, không chia lại tay đã lưu.
JSON hỏng hoặc storage bị chặn vẫn cho chọn ván mới/chơi bằng bộ nhớ. Khóa
`thuy-tran-playable-v1` của giao diện cũ được giữ nguyên, không tự chuyển đổi.
Chơi ván mới thay bản v2 đang lưu.

Engine thuần JSON/RNG theo seed. Nội dung đã đọc lại ngày 14/10 qua Google Doc
`1WqryE88CVgMAJLq1xULrtpy2IznMl32enYt3hA5XkKE`, bản ngắn
`t.h3zldwgq6rwy` và bản dài `t.0`. Năng lực ưu tiên quyết định mới nhất trong
`src/data/cards.ts`, không suy từ chữ cũ trên artwork Hướng Đạo/Thuyền Nhẹ.

Gia Cố/Cờ Lệnh/Hiệp lực không tốn hành động. Người giữ Cờ Lệnh không phải đứng
cùng nhóm được chuyển. Hai Triều Biến tăng nước ngay từng lần nhưng chỉ xếp
chồng bỏ Biến động lên trên một lần sau hai lượt rút Kế sách, giữ nguyên phần
dưới. Không có Biến động giữa hai lượt rút. Ô bị loại không phục hồi.

Người dùng đã bổ sung và xác nhận **giữ cả hai cách tăng nước**: Triều Biến
tăng ngay, và hết trọn vòng 4/5/6 nhân vật tăng thêm một nấc. Ranh giới vòng
là lượt chia hết cho số người; chờ hết Biến động và toàn bộ thoát hiểm, kể cả
khi Cờ Lệnh cứu nhóm cuối. Tăng đúng một lần, thua ngay nếu vượt nấc 8. Giữ
metadata lá/ô vừa tác động để UI còn chỉ đúng ô khi vòng kết thúc.

Chỉ chơi chung trên một máy. Không có tài khoản, API, đối thủ AI hoặc mạng.
DOM, CSS 3D và GSAP giữ tranh rõ, không yêu cầu WebGL, không bắt cuộn hay pin.

## Code và kiểm tra

- Entry `play.html` / `src/play.tsx`, build đồng thời với site cũ.
- Luật `src/game/engine.ts`; UI `PlayTable.tsx`, bàn `Board.tsx`, chuyển bài
  `CardMotion.tsx`, menu `GameMenu.tsx`. `tide.ts` tập trung rate/giới hạn nấc
  và vị trí dấu trên ảnh; CSS riêng `.wg-*` trong `play.css`/`menu.css`.
- Engine: `node --experimental-strip-types scripts/check-playable-engine.ts`
  và `scripts/check-webgame-engine.ts` (Node 24).
- `scripts/check-playable.js` chạy trong console local: quan sát save, artwork,
  tỉ lệ/bo góc, đủ 24 ô, các HUD không đè tranh và không tràn viewport.
- `scripts/check-webgame.js` cung cấp `window.__webgameQA.setup(name)` và
  `.test(name)`. Setup **thay save v2 bằng fixture**; phải sao lưu ván trước.
  Chạy setup, reload, nạp lại script rồi test. Không có cửa nhập fixture trong UI.
- `.testMenu({playerCount,difficulty})` kiểm tra lựa chọn menu và chia bài.
  Fixture mới `flood-center`, `round-four`, `flood-rescue` kiểm tra F3 ở tâm,
  chỉ đúng ô, tăng triều sau vòng và cứu ngay không giữ preview cũ.
- Hai script QA `.pt-*` cũ cho import/menu/camera đã xóa vì UI đó bị bỏ.
- `npx tsc --noEmit`, `npm run build`. Không chạy deploy.

Bản trước đã kiểm tra 13 tình huống/79 assertions và năm cỡ desktop. Đợt
menu/F3/tăng nước mới kiểm tra 7 tình huống liên quan/57 assertions, 5 lựa
chọn menu (đủ 4/5/6 người và bốn độ khó), 87 checks bố cục với sáu người tại
920×900, 1280×900 và 1840×1080. Có xem cảnh F3 giữ ở giữa và đường chỉ ngoài
mép lá, thử F3 tĩnh/reduced motion. Engine kiểm tra vòng 4/5/6, chờ thoát hiểm,
Cờ Lệnh cứu nhóm cuối, Triều Biến cùng tăng vòng và thua nấc cuối. Chưa xác
nhận browser engine khác/thiết bị thật. Ảnh `webgame-menu.png` và
`webgame-flood-center.png` trong `docs/qa`.
