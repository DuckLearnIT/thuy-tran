# Handoff tiếp tục thay bộ 24 địa danh

- **Cập nhật:** 09/10/2026 (Asia/Bangkok)
- **Repo:** `C:\Users\Duck\Downloads\web`
- **Tài liệu nền bắt buộc:** đọc `AGENTS.md` và `docs/AI-HANDOFF.md` trước khi sửa.
- **Mục đích:** cho agent tiếp theo tiếp tục chính xác công việc thay artwork 24 địa danh đang dở, không cần suy đoán từ lịch sử chat.

## Trạng thái tại thời điểm bàn giao

Task này **chưa hoàn tất**. Có thay đổi trong working tree nhưng chưa commit/push. Trạng thái Git được ghi nhận lúc tạo tài liệu:

| Thuộc tính | Giá trị |
| --- | --- |
| Branch | `main` |
| HEAD | `589fb1d` — `Tidy handoff metadata formatting` |
| `origin/main` | cùng `589fb1d` |
| Baseline giao diện | `ca36ddd`, được khôi phục bằng `92108f3` |
| Thay đổi task địa danh | đang có trong working tree; xem `git status --short` và `git diff` |
| Deploy | chưa thực hiện; không được deploy khi chưa có yêu cầu riêng |

**Không reset, checkout đè, clean hoặc bỏ các thay đổi địa danh hiện tại.** Khi agent tiếp tục trên cùng máy, trước tiên xác nhận working tree còn các sửa đổi này. Nếu chúng không còn, dừng và hỏi người dùng khôi phục checkpoint/worktree thay vì dựng lại bằng cách đoán. File `Anki_HSK3.0_New_HSK_Course_2_L13_selected.csv` là untracked ngoài dự án: không stage, sửa hoặc xóa.

## Yêu cầu sản phẩm đã chốt

Người dùng thiết kế lại toàn bộ 24 địa danh trong `C:\Users\Duck\Downloads\CHỐT\CHỐT` và giao:

- **F1:** mặt trước. Dùng trong hộp mở màn và mặt trước của hộp thoại chi tiết.
- **F2:** mặt sau. Dùng khi lật thẻ trong hộp thoại chi tiết.
- **F3:** tranh cho 24 thẻ ở phần spiral. Đây là yêu cầu mới nhất; ưu tiên nó hơn ghi chú cũ trong baseline rằng F3 không dùng trên web.
- Không dùng F3 làm mặt sau trong hộp thoại, không thêm số/badge lên tranh, không đổi F1/F2 trong cảnh mở hộp sang F3.
- Giữ thứ tự 24 địa danh, nội dung ý nghĩa/câu chuyện/nguồn, liên kết nhân vật/kế sách và cơ chế cuộn hiện có. Chỉ đổi tên/ID nếu artwork mới yêu cầu.
- Giữ artwork và màu gốc. Không tăng saturation/contrast, không bóp méo tỉ lệ, không tạo ảnh thay thế.
- Preload artwork trước khi curtain mở, theo quyết định đã chốt về nạp toàn bộ trang trước trải nghiệm.

## Đặc điểm file nguồn

- Thư mục nguồn ở máy người dùng: `C:\Users\Duck\Downloads\CHỐT\CHỐT`.
- Có 24 địa danh × 3 mặt = **72 PNG**.
- F1 và F2 nguồn là ảnh vuông 1488×1488.
- F3 nguồn là tranh dọc 1500×2078. Dù có thể gọi chung là “thẻ”, ảnh F3 không vuông; giữ ratio dọc trong spiral để tránh kéo méo hoặc cắt tranh/chữ.
- Bản WebP trong repo được xuất ở quality 90; F1/F2 là 896×896, F3 khoảng 896×1242. Hãy dùng các file WebP đã có trong working tree, không cần nguồn Downloads nếu không có lý do sửa lại ảnh.
- `F3` là nhãn mặt trong bộ nguồn, không phải chỉ dẫn để đổi thứ tự hoặc nội dung gameplay.

Ba tên trên artwork mới khác tên cũ và đã được đổi trong data:

| Tên cũ | Tên hiện tại | ID hiện tại |
| --- | --- | --- |
| Cửa Bạch Đằng | Cửa Nam Triệu | `cua-nam-trieu` |
| Bến vận chuyển gỗ | Bến Chuyển Gỗ | `ben-chuyen-go` |
| Bãi tập kết | Bến Tập Kết | `ben-tap-ket` |

Giữ liên kết nội dung cũ theo từng địa danh. Với Bến Tập Kết, copy nguồn đã được chỉnh thành “không có nguồn xác nhận địa điểm cụ thể” để khớp tên mới; không khẳng định một bến cụ thể nếu không có nguồn.

## Thay đổi đã có trong working tree

Tài liệu này mô tả thay đổi đang có; **chưa phải xác nhận rằng toàn bộ task đã pass**.

1. `src/data/locations.ts`
   - Thêm `spiralImage` vào kiểu dữ liệu địa danh.
   - Mỗi trong 24 record import ba artwork: `image` = F1, `back` = F2, `spiralImage` = F3.
   - Đổi ba ID/tên như bảng trên; giữ thứ tự và liên kết game.
2. `src/components/Locations.tsx`
   - Dùng F3 làm tranh nhìn thấy trong spiral; ảnh F1/F2 tiếp tục ở dialog lật hai mặt.
   - Accessible label nêu đây là tranh F3; card đang phóng to có nhãn thu nhỏ.
   - Không thêm chapter trigger, router hoặc cơ chế bắt cuộn mới.
3. `src/index.css`
   - Spiral và các slice giữ ratio dọc F3, bo góc, không ép thành vuông.
   - Thu kích cỡ thẻ và giới hạn số thẻ gần trung tâm để bố cục dọc không chèn heading ở viewport thấp.
4. `src/preloadAssets.ts`
   - Preload F1, F2 và F3 cho cả 24 địa danh trước curtain.
5. `src/assets/locations/`
   - Thay F1/F2 bằng artwork mới, thêm đủ 24 F3 WebP và bỏ file thừa của ba ID cũ.
   - `src/assets/locations/README.md` ghi lại quy ước tên/ratio/nguồn.
6. QA scripts:
   - `scripts/check-locations.js` kiểm tra 72 file, mapping F1/F2/F3, tỉ lệ F3, preload, nhãn và hộp thoại.
   - `scripts/check-box-locations.js` thêm assertion rằng lưới tĩnh của hộp vẫn dùng F1.
7. `AGENTS.md` và `docs/AI-HANDOFF.md` đã được sửa để phản ánh vai trò F3 và nguồn ảnh mới. Đây là thay đổi tài liệu đang nằm trong cùng working tree; rà lại cả hai trước khi commit để tránh xung đột/ghi đè.

Tên asset kỳ vọng:

```text
<id>-front.webp   # F1
<id>-back.webp    # F2
<id>-f3.webp      # F3, chỉ spiral
```

## Việc agent tiếp theo cần làm

### 1. Xác minh checkpoint và đủ asset

```powershell
Set-Location -LiteralPath 'C:\Users\Duck\Downloads\web'
git status --short --branch
git log -5 --oneline --decorate
```

- Giữ lại mọi thay đổi task địa danh đang có.
- Xác nhận 24 record × 3 ảnh, tổng 72 asset khác nhau.
- Tìm tất cả import/reference tới ba ID cũ; không để dangling import hoặc route text.
- Đối chiếu tên/ảnh với `src/assets/locations/README.md` và contact sheets nếu còn ở `C:\Users\Duck\AppData\Local\Temp\thuy-tran-location-sheets\`.
- Kiểm tra repo không tham chiếu đường dẫn Downloads lúc runtime.

### 2. Chạy kiểm tra sau các chỉnh sửa gần nhất

Trước đó typecheck/build đã chạy qua **trước một chỉnh sửa nhỏ cuối cho nhãn truy cập**, nên cần chạy lại trên trạng thái hiện tại:

```powershell
npx tsc --noEmit
npm run build
node --check scripts/check-locations.js
node --check scripts/check-box-locations.js
node scripts/check-strategy-drag.cjs
node scripts/check-card-feel.cjs
git diff --check
```

Sau đó chạy `scripts/check-locations.js` trên localhost sau khi curtain mở và đọc kết quả từng assertion. Script browser là IIFE để chạy trong console; không được xem việc script parse được là bằng chứng tương tác đã pass. Chạy lại `scripts/check-box-locations.js` để chắc F1 trong lưới hộp không bị thay bằng F3.

### 3. Kiểm tra render và hành vi thật

Đã có quan sát thủ công trên localhost:

- 920×686: F3 portrait hiển thị, heading không bị các lá đè.
- 390×844: spiral và dialog hiển thị; lật dialog quan sát thấy F1 rồi F2 đúng mặt.
- 320×568: ảnh chụp trước đó không đủ tin cậy để kết luận vì viewport/scroll của CUA lệch; **chưa xác nhận đạt**.
- Click/zoom trên một card có kết quả không nhất quán trong lần kiểm tra cũ; dùng QA script/keyboard và reload để tái xác nhận.

Kiểm tra tối thiểu ở 320×568, 390×844, 920×686 và 1280×720:

- Card trung tâm giữ ratio F3, bo góc và artwork/chữ không bị méo.
- Heading, counter, thẻ trung tâm, cạnh trái/phải không va chạm hoặc bị cắt.
- Đủ 24 địa danh và từng record trỏ đến đúng F3; đổi chiều cuộn và resize không làm lệch mapping.
- Click card không active chọn đúng card; click active/“Xem hai mặt” mở dialog F1/F2; lật và đóng hoạt động.
- ArrowLeft/Right, Home/End, drag và scroll native dọc còn hoạt động; không phát sinh trigger mới.
- Test reduced motion/static layout và WebGL fallback nếu sửa vùng dùng chung hoặc build làm thay đổi fallback.
- Sau kiểm tra hoàn nguyên browser viewport/overrides, đóng dialog test và không để mock/test state trong sản phẩm.

### 4. Rà soát diff, commit/push

- `git diff --stat` và `git diff` để bảo đảm chỉ gồm task 24 địa danh cùng tài liệu/check liên quan.
- `git status --short` phải cho thấy CSV riêng nhưng **không stage CSV**.
- Stage asset additions/deletions và đúng các file code/docs/scripts của task.
- Commit lên `main`, push **`origin main`** theo `AGENTS.md`.
- Không dùng remote `song-lenh`; không chạy `npm run deploy`, không thay Pages source/workflow. GitHub Pages tiếp tục ở bản public cũ.
- Báo hash, kết quả kiểm tra và nói rõ chưa deploy.

## Những điều không nên làm khi tiếp tục

- Không ép F3 về vuông: tỉ lệ nguồn là dọc.
- Không thay F1/F2 ở hộp mở màn/dialog bằng F3.
- Không lặp 24 ScrollTrigger, không thêm scroll hijacking hoặc router.
- Không đổi thứ tự locations hay tự viết lại mapping game.
- Không tăng saturation/contrast, dùng imagegen, hoặc thay artwork bằng file khác.
- Không áp lại các chỉnh sửa bị hủy trong `94e1d3a`; giao diện nền cần đúng baseline `ca36ddd` qua `92108f3`.
- Không deploy. Push `main` chỉ lưu code; Pages được yêu cầu giữ phiên bản cũ.

## Lệnh khởi động cho agent tiếp quản

> Đọc `AGENTS.md`, `docs/AI-HANDOFF.md` và tài liệu này. Kiểm tra Git trước khi sửa; giữ nguyên working-tree changes của task thay bộ 24 địa danh. Hoàn tất kiểm tra type/build và browser QA còn thiếu, sửa đúng các lỗi thuộc phạm vi, rà diff để loại file CSV không liên quan, commit/push `origin main`, và tuyệt đối chưa deploy GitHub Pages. Nếu checkpoint địa danh không còn trong working tree, hỏi người dùng khôi phục thay vì reset hoặc dựng lại từ trí nhớ.
