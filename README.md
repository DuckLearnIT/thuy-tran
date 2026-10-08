# Thủy Trận

Website giới thiệu board game chiến thuật Bạch Đằng, xây dựng bằng React, Vite, GSAP và Three.js.

Website: https://ducklearnit.github.io/thuy-tran/

## Chạy tại máy

```sh
npm ci
npm run dev
```

## Phiếu đặt trước

Mở `?page=dat-truoc` để chọn bộ game → giao hàng → kiểm tra → xem phiếu mẫu. Bản này chưa gửi đơn hay thu tiền; nháp lưu trong `sessionStorage` của tab, có nút xóa ở phiếu mẫu.

Giá một bộ, phí vận chuyển (VND), lịch giao và ngân hàng nằm trong `src/data/checkout.ts`. Giá trị `null` hiển thị “Chưa công bố”; tổng tiền chỉ tính khi có cả giá và phí vận chuyển. Bổ sung dữ liệu không tự mở nhận đơn hoặc thanh toán.

Danh sách tỉnh/thành → phường/xã được đóng gói tại `src/data/vietnam-addresses.json`, không gọi dịch vụ ngoài trong lúc nhập. Nguồn: [Province Open API v2](https://provinces.open-api.vn/), lấy ngày 08/10/2026; 34 tỉnh/thành và 3.321 đơn vị cấp xã theo [danh mục từ 01/07/2025](https://baochinhphu.vn/bang-danh-muc-va-ma-so-cua-34-tinh-thanh-moi-3321-don-vi-hanh-chinh-cap-xa-moi-102250704153652947.htm). Đổi tỉnh sẽ xóa lựa chọn phường/xã cũ; nháp từ ô nhập trước đây chỉ giữ địa danh còn khớp danh sách.

Kiểm tra luồng bằng cách chạy nội dung `scripts/check-preorder.js` trong DevTools của một tab mới, sau khi màn tải mở. Khi kết quả yêu cầu tải lại, tải lại và chạy tiếp; ba lượt kiểm tra cả khôi phục nháp, nháp hỏng và storage không khả dụng.

## Kiểm tra và triển khai

```sh
npx tsc --noEmit
npm run deploy
```

Lệnh deploy build website và đẩy thư mục `dist` lên nhánh `gh-pages` của remote `origin`. GitHub Pages phục vụ nhánh `gh-pages`, thư mục gốc. Các tài nguyên dùng đường dẫn tương đối để hoạt động dưới `/thuy-tran/`.
