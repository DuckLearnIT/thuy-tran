# "Horizon": video trừu tượng về Opus 5.5

**Tham chiếu**
- Ngữ pháp: "Introducing Claude Opus 5.5" (YouTube `1f13Bl1sYkw`, 20 giây). Một đường chân trời cong đứng yên ở 1/3 dưới khung; vật liệu bên dưới thay mỗi khoảng 1 giây; vài chữ serif đứng trên đỉnh đường cong; kết bằng tên model rồi hạ máy về khung đầu (loop).
- Bề mặt: reel của @devteamdrew. Nét mực rung lại mỗi 2 frame, tô gạch kiểu bút sáp, hạt giấy, glow chỉ cho nguồn sáng (xem `style_guide.md`).

**Không lấy:** câu chữ, logo hay cảnh quay của các video tham chiếu. Câu trên màn hình là của riêng mình: *think / past / the edge* → *Opus 5.5*.

**Thông số:** 20 giây, 1920×1080, 30 fps (600 frame), 120 BPM (beat = 15 frame). Mọi cú cắt nằm trên beat.

**Hình học cố định:** đỉnh đường cong ở y = 700 trên 1080, bán kính 2600 px. Mỗi shot đẩy nhẹ máy quay 3,5% quanh đỉnh. Chữ đứng ngoài lớp camera nên không bị phóng theo.

| Frame | Beat | Thế giới dưới đường cong | Chữ |
|---|---|---|---|
| 0–30 | 2 | Bình minh: vành khí quyển nhiều dải, hành tinh tô gạch chéo, sao | |
| 30–45 | 1 | Mặt trời: hạt granule, tai lửa | |
| 45–60 | 1 | Bản vẽ phấn trên nền xanh blueprint: đường dựng hình, vạch chia | |
| 60–75 | 1 | Màng tế bào dưới kính hiển vi | |
| 75–90 | 1 | Vách đá đỏ trên trời ngọc lam | |
| 90–105 | 1 | Vành gốm nung, dải hoa văn chữ triện | |
| 105–135 | 2 | Đồi cỏ trên giấy: cây, con diều | |
| 135–150 | 1 | Cầu vồng ôm hành tinh tối | |
| 150–165 | 1 | Mạng nơ-ron: xung sáng chạy trên cạnh | |
| 165–180 | 1 | Giấy kẻ dòng, nét chữ viết tay tự chạy | |
| 180–210 | 2 | Vân gỗ: vòng năm | |
| 210–240 | 2 | Ren trắng trên nền đen | **think** |
| 240–270 | 2 | Cát vàng chấm hạt, hạt bay | **think** |
| 270–300 | 2 | Sóng biển cuộn, trời đào | **think** |
| 300–330 | 2 | Giấy cắt dán kiểu Matisse | **past** |
| 330–360 | 2 | Tổ ong | **past** |
| 360–390 | 2 | String art: dây căng từ đường cong | **the edge** |
| 390–420 | 2 | Sóng âm thanh mọc theo pháp tuyến | **the edge** |
| 420–450 | 2 | Dải ngân hà nhìn ngang | **the edge** |
| 450–540 | 6 | Đêm, một nét cong mảnh | **Opus 5.5** |
| 540–600 | 4 | Chữ trôi lên, bình minh dâng từ dưới, về đúng frame 0 | |

**Âm thanh** (tổng hợp, `scripts/horizon-audio.mjs`)
- Nền: pad hợp âm Am9 → Fmaj7 → Cmaj7 → G6.
- Mỗi cú cắt: một tiếng "tick" bút chì cộng một nốt pluck ngũ cung, cao dần.
- Mỗi chữ: tiếng thump trầm kèm chuông.
- Lúc hiện "Opus 5.5": tiếng swell rồi một hợp âm chuông.
- Cuối: whoosh nối vòng lặp. Thêm reverb nhẹ, chuẩn hóa về khoảng −14 LUFS.
