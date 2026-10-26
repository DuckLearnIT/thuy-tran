# Thủy Trận — hướng dẫn cho AI agent

Đọc `docs/AI-HANDOFF.md` trước khi sửa dự án. Tài liệu đó ghi cấu trúc code,
hành vi cần giữ, dữ liệu, lịch sử quyết định và cách kiểm tra.

## Những yêu cầu đã chốt với người dùng

- Giao tiếp bằng tiếng Việt, ngắn và rõ. Thực hiện việc đã được giao; tránh hỏi
  lại các quyết định đã có trong phiên. Chỉ làm trong phạm vi yêu cầu hiện tại.
- Mỗi task chỉnh sửa hoàn thành phải commit và push. Remote đúng là `origin`
  (`DuckLearnIT/thuy-tran`); không dùng remote `song-lenh` cũ.
- **Từ 26/10/2026, người dùng yêu cầu tự deploy sau mỗi task chỉnh sửa hoàn tất**
  khi kiểm tra đạt: commit/push `origin/main`, rồi build:site và xuất bản lên
  `origin/gh-pages` của website chính. Không cần hỏi lại cho từng task, trừ khi
  người dùng yêu cầu giữ local/chưa deploy. Vẫn loại `play.html` và asset riêng
  của playable khỏi gói công khai; không tự deploy repo preview.
- Dùng quy trình deploy hiện có; không cần bật workflow, thêm trigger `push`
  hoặc đổi cấu hình Pages để thực hiện quy ước trên.
- Sau task kiểm tra kiểu dữ liệu/build và hành vi liên quan; với UI cần xem
  bản render ở kích thước phù hợp. Không chỉ dựa vào build để kết luận UI đạt.
- Giữ GSAP/ScrollTrigger, Three.js và cơ chế snap hiện có. Không thêm scroll
  hijacking, router hay dependency mới nếu chưa có nhu cầu cụ thể.
- Giữ màu và phong cách artwork; không tự tăng saturation/contrast, vẽ mắt
  chi tiết hoặc đổi ảnh. Hero giấu mép tranh khuyết bằng bố cục sát viền.
- Checkout hiện chỉ là **phiếu mẫu**, không gửi đơn, không thu tiền. Giá một bộ
  đã chốt **599.000₫**. Phí/lịch giao/ngân hàng chưa có: dùng `null`, không dựng
  phí hay QR thanh toán giả; tổng cộng chờ đủ phí vận chuyển.
- 24 địa danh dùng F1/F2 cho hộp, hộp thoại và ô trên bàn chơi. F3 dùng cho
  spiral và bộ Con nước bốc trong `play.html` (yêu cầu mới ngày 14/10/2026).
  Giữ đúng tỉ lệ WebP, không thêm số lên tranh; tên vai từ `src/data/cards.ts`.
- Web game có menu chọn 4–6 người và bốn độ khó, chia vai ngẫu nhiên; mặc định
  4 người. Triều Biến tăng nước ngay, đồng thời tăng một nấc sau trọn vòng
  nhân vật, chỉ sau khi đã xử lý hết Biến động và thoát hiểm cuối vòng.
- Không chạm hoặc commit file không liên quan. Khi bàn giao hiện có
  `Anki_HSK3.0_New_HSK_Course_2_L13_selected.csv` chưa được theo dõi bởi Git.

## Baseline và việc đã bị hủy

Ngày 09/10/2026, người dùng yêu cầu quay lại **toàn bộ bản `ca36ddd`**.
Commit `92108f3` khôi phục đúng nội dung đó, giữ lịch sử Git.

Các sửa trong `94e1d3a` đã bị hủy: nền giấy ở logo/“Nhận lệnh”, bố cục compact
cho nhân vật/kế sách, đổi nút kế sách và hoàn tác xóa nháp. **Không tự áp lại**
chỉ vì một báo cáo audit còn nhắc tới chúng. Demo kỹ năng cũng chưa được duyệt.

Handoff là snapshot, không thay thế việc đọc trạng thái Git/code hiện tại.
Yêu cầu mới nhất của người dùng luôn được ưu tiên hơn tài liệu này.
