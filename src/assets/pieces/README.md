# Quân và dấu mica — nguồn và chuẩn bị

Mười GLB do người dùng cung cấp; không sinh model thay thế.
`scripts/prepare-pieces.py` đọc thư mục Downloads (hoặc `--source`), dùng
WebP chất lượng 92 với alpha chính xác trong `EXT_texture_webp`.
Geometry, UV, màu và thông số vật liệu nguồn được giữ; script đối chiếu từng
bufferView hình học sau khi đóng GLB. Tổng GLB: 28.374.092 → 3.218.644 byte.

| ID | Nguồn trong Downloads |
| --- | --- |
| nha-tuong | tuong.glb |
| nha-binh | nhabinh.glb |
| tham-quan | hoatieu.glb |
| thuyen-nhe | thuyenvien.glb |
| truyen-lenh-lam | truyenlenh.glb |
| huong-dao-luc | trinhsat.glb |
| coc-ngam | Full 3d/nh-ChatGPT-20_17_11-21-thg-10-2026-3-Photoroom-standee.glb |
| do-luong | Full 3d/nh-ChatGPT-20_17_08-21-thg-10-2026-1-Photoroom-standee.glb |
| mai-phuc | Full 3d/nh-ChatGPT-20_17_13-21-thg-10-2026-4-standee.glb |
| nghi-binh | Full 3d/nh-ChatGPT-20_17_10-21-thg-10-2026-2-Photoroom-standee.glb |

Sáu file nhân vật mới ngày 30/10 thay bộ cũ. Gắn theo artwork và tên trên
thẻ hiện tại, **không suy vai chỉ từ tên file**: `hoatieu.glb` là quân vàng
Thám Quân, `trinhsat.glb` là quân xanh Hướng Đạo. Dùng
`--characters-only` khi chỉ cập nhật sáu quân, không đụng bốn dấu kế sách.
Nghi Binh giữ bản Photoroom, bỏ bản trùng không có hậu tố này.

Ba ảnh `*-view-0/1/2.webp` là render thật của từng GLB, đủ thân, hai mặt và đế:
trước, nghiêng, sau. Mở `scripts/render-pieces.html` qua dev server, gọi
`window.renderPiece(index, view)` để nhận WebP data URL. Lưu đủ 30 ảnh rồi
reload để Vite cập nhật glob. Ảnh 720×720, nền alpha; không dùng artwork cắt
rời thay ảnh model khi WebGL lỗi.

Trong cảnh: đế sáu quân bằng 30% cạnh địa danh; bốn dấu giữ kích thước trưng
bày lớn và nằm riêng cạnh bàn (portrait: hàng riêng dưới bàn). Khi cầm xem,
quân được phóng gần cùng camera. `pieceScene.ts` tăng phản sáng Fresnel chỉ
trên vật liệu mica Physical, giữ nguyên bản in unlit và màu nguồn.
