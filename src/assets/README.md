# Artwork thẻ — cập nhật 20/10/2026

Nguồn: `C:\Users\Duck\Downloads\FULL ASSEST GAME`.
Chỉ đồng bộ ba thư mục `Nhân vật`, `Kế sáhc` (tên thư mục nguồn), `tái màu`.
Không lấy PSD/AI, Stock gốc, Back hoặc thang nước trong lần cập nhật này.

Thẻ nhân vật/kế sách giữ toàn bộ khung 1500 × 2078, chuyển sang WebP quality 90,
giữ alpha và màu gốc, không crop hoặc tăng saturation/contrast.
Mapping runtime vẫn ở `src/data/cards.ts` và `src/data/strategies.ts`, nên landing,
cảnh mở hộp, trang luật, checkout và playable cùng dùng một bộ ảnh.

| PNG trong nguồn | WebP trong thư mục này |
| --- | --- |
| Nhân vật/chihuy.png | nha-tuong.webp |
| Nhân vật/Nha binh Card.png | nha-binh.webp |
| Nhân vật/Tham quan card.png | tham-quan.webp |
| Nhân vật/linhthuyencard.png | thuyen-nhe.webp |
| Nhân vật/truyenlenhcard.png | truyen-lenh-lam.webp |
| Nhân vật/quantrinhsat.png | huong-dao-luc.webp |
| Kế sáhc/congam.png | coc-ngam.webp |
| Kế sáhc/connuocdoi.png | trieu-bien.webp |
| Kế sáhc/doluong.png | do-luong.webp |
| Kế sáhc/giaco.png | gia-co.webp |
| Kế sáhc/maiphuc.png | mai-phuc.webp |
| Kế sáhc/nghibinh.png | nghi-binh.webp |
| Kế sáhc/specialcard.png | co-lenh.webp |

72 ảnh địa danh: xem [quy ước F1/F2/F3](locations/README.md).
Giữ ID, thứ tự và liên kết nhân vật/kế sách hiện tại.

**Chữ trong hai PNG còn lệch luật đã chốt:** `linhthuyencard.png` ghi đi/củng cố/
thoát hiểm đường chéo; `quantrinhsat.png` ghi chuyển bài từ xa. Bản cập nhật này
thay artwork đúng nguồn, không đổi luật hoặc engine theo hai dòng đó. Luật hiện tại
vẫn là Thuyền Nhẹ vượt nhiều ô Nguy cấp/khoảng trống; Hướng Đạo một lần trong lượt
đến bất kỳ ô còn tồn tại. Cần sửa PNG nguồn nếu muốn chữ trên thẻ khớp luật.
