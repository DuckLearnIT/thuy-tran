# Shotlist đề xuất — "Một giọt nước" (Thủy Trận, vòng lặp vẽ tay)

**Logline:** một chiếc cọc gỗ nhỏ nhìn xuống vệt gợn dưới chân, máy quay rơi vào giọt nước và đi qua cả trận Bạch Đằng theo chuỗi vần hình, rồi trở lại đúng vệt gợn đó.

**Thông số đề xuất:** 20 giây, 1920×1080, 30 fps (600 frame), 120 BPM (1 beat = 15 frame). Thêm bản 9:16 sau khi bản 16:9 đạt.

**Nhân vật:** "Cọc", một chiếc cọc gỗ hình tam giác thuôn nhọn. Màu gỗ theo bảng của site (`#7a4a30` / `#3b2219`), viền mực, mắt chấm đơn giản, chân que. Thay cho mascot của video gốc. Mắt chỉ là chấm hoặc ^ ^; không vẽ mắt chi tiết, theo luật trong AGENTS.md.

| # | Giây | Beat | Shot | Vần nối sang shot sau | Âm thanh |
|---|---|---|---|---|---|
| 1 | 0,0–4,0 | 8 | Giấy ngà, đường đất. Cọc nhảy vào từ trái, dừng ở 1/3 phải, chớp mắt, nhìn xuống chân: một vệt nước nhỏ gợn ra. Cọc cười ^ ^. | — | bút chì, pop, chớp mắt |
| 2 | 4,0–4,5 | 1 | Kích hoạt: vòng tròn bút chì đồng tâm và tia tốc độ quanh vệt gợn. Máy quay lao vào giọt nước. | vòng tròn | whoosh hút vào |
| 3 | 4,5–5,5 | 2 | Vòng sóng lan trên nền tối. Các vòng chuyển dần thành pha trăng (trăng khuyết → tròn). | tròn → trăng | nốt 1 |
| 4 | 5,5–6,5 | 2 | Trăng tròn kéo thủy triều: những vạch nước dâng lên như thanh đo con nước, tô gạch lam. | vạch đứng | nốt 2 |
| 5 | 6,5–7,5 | 2 | Vạch nước hạ xuống, lộ ra bãi cọc nhọn chi chít (tam giác gỗ tô gạch). | tam giác đứng | gõ gỗ |
| 6 | 7,5–8,5 | 2 | Máy quay lướt qua bãi cọc; các cọc hóa cột buồm của thuyền địch trong sương. | cột đứng → buồm | nốt 3 |
| 7 | 8,5–9,5 | 2 | Buồm đỏ hình thang phồng gió, đổ nghiêng. Một mảnh buồm bay lên thành lá cờ son. | vải bay | whoosh ngắn |
| 8 | 9,5–10,5 | 2 | Lá cờ son (Nha Tướng) phần phật kín khung; nếp vải thành dải sóng. | nếp sóng | nốt 4 |
| 9 | 10,5–12,0 | 3 | **Shot nhấn:** sóng lớn vẽ tay cuộn lên kiểu khắc gỗ, bọt trắng xoắn ở ngọn. | xoắn | trống lớn |
| 10 | 12,0–13,0 | 2 | Bọt xoắn thành xoáy nước nhìn từ trên; mảnh thuyền bị cuốn vào tâm. | tâm xoáy → điểm | nốt 5 |
| 11 | 13,0–14,0 | 2 | Tâm xoáy lùi ra thành một chấm trên bản đồ sông: dòng sông phân nhánh (nét mực), 24 chấm địa danh lần lượt sáng. | nhánh | 24 tiếng tick nhanh |
| 12 | 14,0–15,0 | 2 | Một nhánh sông thành nhánh tre; rừng tre đung đưa, ánh trăng xuyên qua. | thân đứng | nốt 6 |
| 13 | 15,0–16,0 | 2 | Thân tre thành mái chèo; thuyền nhẹ lướt từ dưới lên, vệt nước chữ V. | vệt V | nốt 7 |
| 14 | 16,0–17,0 | 2 | Vệt V thành đàn cò bay qua hoàng hôn đào; đàn cò xếp thành hình mặt trời. | đĩa tròn | nốt 8 |
| 15 | 17,0–18,0 | 2 | Mặt trời lặn chạm sông, phản chiếu thành vệt gợn tròn. | vòng tròn | whoosh ngược |
| 16 | 18,0–19,0 | 2 | Trở về: vòng tròn bút chì co lại, lùi ra thấy vệt gợn dưới chân Cọc trên giấy ngà. | — | nốt kết |
| 17 | 19,0–20,0 | 2 | Cọc ngẩng lên cười ^ ^. Góc dưới hiện chữ viết tay nhỏ "Thủy Trận" rồi mờ đi. Khung cuối trùng shot 1 (loop). | — | im lặng ngắn |

## Kỹ thuật dự kiến

- Remotion sẵn có trong `trailer/`, thêm một composition `Loop`.
- **Nét vẽ tay:** thêm `roughjs`: vẽ nét rung và tô gạch kiểu bút sáp, có seed nên render lại vẫn giống hệt. Đổi seed mỗi 2 frame để nét "sôi". Đây là dependency mới duy nhất, chỉ thêm vào `trailer/`.
- **Nền giấy** tạo bằng noise có seed, không dùng ảnh.
- **Nhạc và SFX** tổng hợp bằng Node, theo đúng lưới beat trong bảng trên; ghép vào video bằng `<Audio>` của Remotion.
- **Duyệt:** sau mỗi 4 shot làm contact sheet, ảnh thu nhỏ 360px và dải 12 frame liên tiếp; chấm điểm 1–10 (hook, độ đọc, chuyển động, độ đa dạng, vần, khớp nhịp) cho tới khi mọi mục đạt 8.
