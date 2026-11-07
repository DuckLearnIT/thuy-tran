# Hộp lần 2 và thay preview CSS — 07/11/2026

Tài liệu này thay phần nguồn artwork và preview Đặt trước trong
`BOX-PRINT-2026-11-07.md`. Người dùng báo bản CSS vẫn lệch mặt hộp và có lúc chỉ
hiện một lá; kiểm tra bounding box DOM trước đây không đủ để bắt lỗi đó.

## Nguồn đang dùng

Năm PDF trong `C:/Users/Duck/Downloads/In`:

- `mat chinh dien moi han.pdf` — mặt trước.
- `mat trai  moi han.pdf` — cạnh trái (tên có hai dấu cách sau `trai`).
- `mat phai moi han.pdf` — cạnh phải.
- `mat tren moi han.pdf` — cạnh trên.
- `matduoi moi han.pdf` — cạnh dưới.

`prepare-box-art.py` dùng đúng năm tên này, lưu checksum và MediaBox vào
`src/assets/box/layout.json`. Front 481,2 × 701,04 pt, chiều dày 123,84 pt.
Vài cạnh lệch dưới 0,25 pt do xuất PDF; cho sai số tối đa 1 pt, contain và nối
pixel mép thay vì kéo giãn. Tỷ lệ mô hình lấy theo mặt trước và chiều dày cạnh.
Mặt sau vẫn giữ nguồn PDF in cũ do chưa có mặt sau mới. Không sửa/copy PDF nguồn
vào repo, không chạm studio nội bộ.

## Preview Đặt trước hiện tại

- Bỏ toàn bộ `.po-lid/.po-hand` CSS 3D; `PreorderBox.tsx` tải động
  `preorderBoxScene.ts` khi vùng ảnh thực sự hiện. Mobile đang thu gọn không
  tạo WebGL hoặc tải atlas. Không đổi form/Apps Script/giá.
- Dùng chính `createPrintedBox()` của landing: hai vỏ rỗng cùng atlas, 64 tam
  giác, các mặt gắn liền bằng geometry. Không còn dựng cạnh bằng DOM.
- Mở: nắp nâng cao khỏi thành → trượt sang trái → hạ xuống; sáu thẻ chỉ bung
  khi nắp đã dịch khỏi miệng hộp. Đóng chạy ngược. Bấm nhanh giữa chuyển động
  đổi hướng từ trạng thái hiện tại, không tạo timeline chồng nhau.
- Sáu mesh thẻ dùng mặt hiện tại, cùng một hình học bo góc. Thứ tự chồng được
  tạo bằng độ sâu thật; không dùng z-index hoặc opacity. Camera tính theo
  toàn bộ bounds mỗi frame để không cắt vật ở mọi tỷ lệ màn.
- Chỉ vẽ khi đang chuyển động, resize hoặc pointer nghiêng nhẹ; đứng yên không
  có vòng RAF/render. DPR tối đa 1,5, shadow 1024², bản GPU mỗi mặt thẻ rộng
  512px; atlas checkout chỉ 1024². Tổng atlas + 6 bản GPU khoảng 17 MiB kể cả
  mipmap, chưa tính framebuffer/shadow/ảnh gốc trong loader.
- Atlas mới: 434.672 byte (2K), 170.838 byte (1K); front phẳng 166.976 byte.
  Đã xóa hai WebP cạnh chỉ dùng cho CSS cũ. Landing tiếp tục cơ chế 1K/2K cũ.
- Theo phản hồi cháy sáng: riêng material hộp tắt tone mapping, chặn highlight
  vượt RGB tuyến tính của tranh in trước output sRGB. Vẫn dùng Standard để có
  bóng/độ tối theo bề mặt, không chỉnh saturation/contrast/ảnh nguồn hoặc ánh
  sáng của quân mica. Hook dùng `opaque_fragment`; nâng Three cần chạy lại QA màu.
- Giảm chuyển động đổi trực tiếp trạng thái. Lỗi tải quá 8 giây, không có
  WebGL hoặc mất context: hiện bìa thật và sáu thẻ trong bố cục DOM phẳng có
  thể mở/đóng. Không ghép cạnh CSS giả. Dispose geometry/material/texture,
  shadow, observer, tween và context khi tháo trang.

## Kiểm tra

- `check-printed-box.mjs`: tỷ lệ mới, UV, normals, vỏ kín, clearance và số tam giác.
- `checkBoxPrint()`: nguồn mới, hai vỏ thật, sáu mặt độc lập, atlas/GPU có giới hạn.
- `checkPreorderBoxLayout()`: chiếu từng vertex vào camera, kiểm tra không cắt
  và không đè tiêu đề/nút/form. Raycast vào từng lá: khi đóng không thấy lá;
  khi mở đủ sáu lá phải có phần tranh thực sự nhìn thấy. Không chỉ kiểm tra
  số DOM image hoặc rectangle của canvas.
- `checkPreorderBoxMotion()`: nâng trước khi trượt, thẻ chờ, đảo chiều giữa
  chuyển động, nắp về đúng vị trí, không render khi idle.
- `checkBoxPrintColor()`: đọc pixel GPU ở 9 điểm giấy trên nắp đóng và so với
  atlas WebP thật. Landing sau sửa: sai lệch tối đa 2/255; không suy rộng đây
  là phép đo toàn bộ tranh hoặc hiệu chuẩn màn hình.
- Xem ảnh/báo cáo `docs/qa/box-revision2-*`; viewport 320/390/920/1280/1840px.
- Giữ quy trình commit/push origin/main + build:site + origin/gh-pages. Không
  đưa playable, studio, PDF hay QA HTML vào dist; không deploy repo preview.
