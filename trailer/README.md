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

Chữ chỉ dùng thông tin đã chốt: tên game, Bạch Đằng, tên vai (`src/data/cards.ts`), 24 địa danh, giá 599.000₫ và `thuy-tran.pages.dev`.
