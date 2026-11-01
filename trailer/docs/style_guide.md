# Style guide — "vòng lặp vẽ tay" (tham chiếu: @devteamdrew, 22/09/2026)

Nguồn: video 32 giây "Made with @claudeai Opus 5.5" (1,8 triệu lượt xem), phân tích từ 40 khung trích mỗi giây và quanh các điểm chuyển cảnh. Ở đây chỉ lấy **ngữ pháp** của video. Không lấy nội dung, mascot hay hình ảnh của họ.

## 1. Cấu trúc

| Phần | Thời lượng | Việc xảy ra |
|---|---|---|
| Mở | ~6 s (19%) | Giấy trắng ngà, đường đất mảnh, một nhân vật nhỏ lệch phải ở 1/3 dưới. Nhân vật đi vào, đứng, chớp mắt, cười ^ ^, vẫy tay. Rất nhiều khoảng trống. |
| Kích hoạt | ~0,7 s | Vòng tròn đồng tâm bằng bút chì và tia tốc độ tỏa ra quanh nhân vật, rồi máy quay lao vào một vật (màn hình điện thoại). |
| Chuỗi | ~22 s, khoảng 20 shot | Mỗi shot 0,8–1,5 s, một chủ thể biểu tượng duy nhất. Máy quay luôn tiến tới (zoom, xoay). Các shot nối nhau bằng **vần hình**. |
| Trở về | ~1,5 s | Lùi ra qua vòng tròn bút chì, lại thấy vật ban đầu, rồi nhân vật trên giấy. Khung cuối trùng khung đầu (loop). |

Chuỗi vần trong video gốc:
- vũ trụ trong màn hình → con mắt / quỹ đạo → nơ-ron (nhánh) → tia sét (nhánh) → nét bút chì → tia sáng → lăng kính → cầu vồng → DNA (dải màu) → xoắn ốc → hạt hướng dương (phyllotaxis) → đàn chim (bầy) → thiên hà (bầy hạt) → hố đen (đĩa) → sao băng (vệt) → cột sáng → tên lửa → Trái Đất nhìn từ Mặt Trăng → fractal cầu vồng → lùi ra điện thoại.

**Luật vần:** shot sau mượn hình dạng hoặc hướng chuyển động của shot trước (nhánh → nhánh, xoắn → xoắn, bầy → bầy, đĩa → đĩa, vạch → vạch). Không dùng wipe hay fade thường.

## 2. Bề mặt và nét

- **Viền mực rung:** nét nâu đen `#2b2220`, dày 3–4 px ở 1080p, đầu tròn. Nét rung lại mỗi 2–3 frame (line boil, "vẽ lại trên hai/ba"), biên độ 1–2 px.
- **Tô bút sáp:** gạch chéo song song bên trong hình, xen 2 sắc độ cùng màu, có khe hở. Không tô phẳng tuyệt đối.
- **Nền giấy:** trắng ngà trung tính `#ebe9e3`, có hạt nhỏ và vài đốm mực. Cảnh tối dùng xanh tím than `#14142e`, cảnh thiên nhiên dùng gradient đào `#f2a488 → #f8d6ae`.
- **Glow chỉ dành cho nguồn sáng thật** (tia sáng, hố đen, sao). Không glow trên chữ hay khung.
- **Không có chữ** trong suốt phần chuyển động. Không viền khung, không nhãn ở góc.

## 3. Màu

- Giấy: `#ebe9e3`, mực: `#2b2220`, chì xám: `#8d8a84`.
- Đêm: `#14142e` / `#1d1a3d`. Sao trắng `#f4f1ea`.
- Cầu vồng bão hòa, mỗi shot chọn 2–4 màu:
  - đỏ `#e5533d`
  - cam `#ef8a3c`
  - vàng `#f5c84b`
  - lục `#4bab68`
  - lam `#3b8ed6`
  - tím `#8b5bd6`
  - hồng `#e47fb0`

## 4. Chuyển động

- Máy quay luôn tiến tới. Mỗi shot có một chuyển động camera rõ ràng (push, xoay, trôi ngang); không có khung đứng chết.
- Vật thể "được vẽ ra": nét chạy theo đường (stroke reveal), rồi phần tô gạch hiện sau 2–4 frame.
- Bầy hạt và bầy chim dùng chuyển động tất định (seed), không dùng `Math.random`.
- Nhân vật dùng spring có độ nảy nhẹ, chớp mắt 2 frame, đổi biểu cảm giữa mắt chấm và ^ ^.
- Cắt cảnh đặt trên lưới nhịp 120 BPM: mỗi shot 2 beat (1 s), shot nhấn 3 beat.

## 5. Âm thanh (video gốc có nhạc; bản của mình tổng hợp bằng code)

- Mở: tiếng bút chì sột soạt, bước chân "pop", tiếng chớp mắt.
- Kích hoạt: tiếng whoosh hút vào.
- Chuỗi: một nốt nhạc hoặc tiếng gõ trên mỗi cú cắt; độ cao nốt tăng dần, tạo cảm giác lao tới.
- Trở về: whoosh ngược, rồi một nốt kết êm. Loudness −14 LUFS.

## 6. Cấm

Tiêu đề giữa nền gradient, mọi thứ cùng fade, glow trên UI, hạt bung chung chung, wipe hay fade thay cho vần hình, chữ xuất hiện trong phần chuyển động.
