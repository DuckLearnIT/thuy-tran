# Thủy Trận — hướng dẫn cho AI agent

Đọc `docs/AI-HANDOFF.md` trước khi sửa dự án. Tài liệu đó ghi cấu trúc code,
hành vi cần giữ, dữ liệu, lịch sử quyết định và cách kiểm tra.

## Những yêu cầu đã chốt với người dùng

- Giao tiếp bằng tiếng Việt, ngắn và rõ. Thực hiện việc đã được giao; tránh hỏi
  lại các quyết định đã có trong phiên. Chỉ làm trong phạm vi yêu cầu hiện tại.
- Mỗi task chỉnh sửa hoàn thành phải commit và push. Remote đúng là `origin`
  (`DuckLearnIT/thuy-tran`); không dùng remote `song-lenh` cũ.
- **Không deploy nếu người dùng chưa yêu cầu.** Push `main` chỉ lưu code.
  GitHub Pages phải tiếp tục phục vụ bản đã xuất bản trên `gh-pages`.
- Không tự bật workflow deploy, thêm trigger `push`, đổi cấu hình Pages hoặc
  chạy `npm run deploy` để xử lý việc web công khai chưa có thay đổi local.
- Sau task kiểm tra kiểu dữ liệu/build và hành vi liên quan; với UI cần xem
  bản render ở kích thước phù hợp. Không chỉ dựa vào build để kết luận UI đạt.
- Giữ GSAP/ScrollTrigger, Three.js và cơ chế snap hiện có. Không thêm scroll
  hijacking, router hay dependency mới nếu chưa có nhu cầu cụ thể.
- Giữ màu và phong cách artwork; không tự tăng saturation/contrast, vẽ mắt
  chi tiết hoặc đổi ảnh. Hero giấu mép tranh khuyết bằng bố cục sát viền.
- Checkout hiện chỉ là **phiếu mẫu**, không gửi đơn, không thu tiền. Giá/phí/
  lịch giao/ngân hàng chưa có: dùng `null`, không dựng giá hay QR thanh toán giả.
- 24 địa danh đã đủ F1/F2, dùng WebP vuông bo góc; không dùng F3, không thêm
  số lên tranh. Tên nhân vật lấy từ `src/data/cards.ts`.
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
