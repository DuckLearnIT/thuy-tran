# Trailer Thủy Trận (Remotion)

Trailer 15 giây, 1920×1080, 30fps, không tiếng. Đây là project riêng, không thuộc gói website và không thêm dependency vào `package.json` gốc.

```sh
cd trailer
npm ci
npm run studio   # đồng bộ asset rồi mở Remotion Studio
npm run render   # xuất out/thuy-tran-trailer.mp4
node scripts/stills.mjs 40 172 300   # render vài khung để duyệt
```

`scripts/sync-assets.mjs` chép artwork, font và GLB từ `../src/assets` và `../public/fonts` vào `trailer/public/`. Thư mục này nằm trong `.gitignore`, nên asset không bị lưu hai lần trong Git.

## Cấu trúc

- `src/theme.ts`: bảng màu lấy từ `src/index.css` của site, cùng các easing và font (NVN Yellost, Futura).
- `src/wave.ts`: sóng thủ tục (sine + `@remotion/noise`), đường Catmull-Rom và ribbon dày mỏng.
- `src/fx/`: mặt nước nhiều lớp và cọc low-poly, hạt canvas tất định, grain/vignette, chuyển cảnh `tideWipe` (chuyển cảnh duy nhất trong phim).
- `src/scenes/`: Open → Cover → Cast → Pieces3D → Places3D → Outro, nối bằng `TransitionSeries`.

Hai cảnh 3D tải GLB/texture **trước** khi mount `ThreeCanvas`. Lý do: khi render, R3F chỉ vẽ lúc đổi frame, nên asset về muộn sẽ ra khung trống.

## Bài tập `Museum`

`src/museum/` là bản dựng lại 15 giây đầu video "The Museum of What Could Be" của OpenAI (bài đăng X ngày 31/10/2026) để luyện kỹ thuật. Bản này giữ đúng bốn shot, nhịp cắt và cách đặt camera của bản gốc, nhưng nhân vật, đạo cụ và hoa đều dựng thủ tục bằng Three.js. Không dùng asset của bản gốc. Đây là tác phẩm phái sinh, không đăng công khai.

```sh
npx remotion render Museum out/museum-study.mp4 --codec=h264 --crf=18 --gl=angle
node scripts/stills.mjs Museum 30 230 320 420
```

Chữ trong trailer Thủy Trận chỉ dùng thông tin đã chốt: tên game, Bạch Đằng, tên vai (`src/data/cards.ts`), 24 địa danh, giá 599.000₫ và `thuy-tran.pages.dev`.

## `Horizon`: video trừu tượng về Opus 5.5

Video 20 giây, một đường chân trời cong cố định. Hai mươi "thế giới" vẽ tay lần lượt cắt qua bên dưới đường cong, chữ *think / past / the edge* đứng trên đỉnh, kết bằng "Opus 5.5" rồi lặp về khung đầu. Kịch bản nằm ở `docs/horizon_shotlist.md`, luật hình ở `docs/style_guide.md`.

- `src/horizon/timeline.json`: nguồn thời gian chung cho cả hình lẫn tiếng (120 BPM, cắt trên beat).
- `src/horizon/draw.tsx`: hình học đường cong và các helper `roughjs`. Nét đổi seed mỗi 2 frame nên "sôi" như vẽ tay.
- `src/horizon/worlds.tsx`: 20 thế giới. `src/horizon/Horizon.tsx`: camera, chữ, đoạn pan nối vòng lặp, hạt giấy.
- `scripts/horizon-audio.mjs`: tổng hợp pad, pluck, chuông, whoosh và reverb thành `public/audio/horizon.wav` (RMS khoảng −15 dBFS).

```sh
npm run horizon
node scripts/stills.mjs Horizon 15 225 405 490
```
