# Hero Thủy Trận — nghiên cứu bố cục nhân vật

## Vấn đề cần giải quyết

Ảnh nguồn trong Trans là các nhân vật bán thân. Đặt từng ảnh theo tọa độ của viewport làm chúng tách thành ba cụm khi tỷ lệ màn hình thay đổi, lộ đáy và cạnh thẳng của ảnh. Tăng kích thước hoặc màu sắc không giải quyết được vấn đề này.

## Tham chiếu đã kiểm tra

- [Mat Voyce](https://matvoyce.tv/), [case study của Uncommon](https://uncommondesign.group/detail/mat-voyce): đã xem hero và cuộn thử. Hai từ lớn tạo cấu trúc cho cả màn hình; hình ở giữa có một vai trò rõ ràng. Khi cuộn, chữ nhường chỗ cho hình. Áp dụng: tên game phải là điểm nhấn, chuyển động phải nối bố cục với bước chuyển mặt trời.
- [Moooor](https://www.moooor.com/), [case study của ET Studio](https://www.e-t.studio/works/Moooor-website): đã xem trang đang chạy và đọc ý đồ thiết kế. Studio dùng hình tròn làm nền tảng nhận diện. Áp dụng: mặt trời nên tổ chức toàn bộ cảnh, thay vì nằm phía sau các ảnh độc lập. Không lấy carousel sản phẩm hoặc cách phối màu của trang này.
- [My Little Storybook của Lusion](https://exp-my-little-storybook.lusion.co/), [hồ sơ Awwwards](https://www.awwwards.com/sites/my-little-storybook): đã xem màn mở đầu và thao tác Enter. Nhân vật, cây cỏ và chuyển động cùng thuộc một cảnh kể chuyện. Áp dụng: sáu nhân vật cần cùng một không gian và một nhịp chuyển động. Không đưa màn Enter riêng vào landing page vì trang đã có curtain.

## Hướng thử nghiệm

Một áp phích xuất trận: sáu nhân vật tạo thành một đội hình chung trước mặt trời, tên THỦY TRẬN lớn nằm ở tiền cảnh. Dùng tọa độ trong một khung hình có tỷ lệ cố định, tránh vị trí từng ảnh phụ thuộc riêng vào chiều cao viewport. Nhân vật có thể vượt đường biên mặt trời để tạo lớp tiền cảnh.

Người dùng đã chọn bổ sung phần thân còn thiếu và giữ màu gốc. Giữ riêng các ảnh nguồn; yêu cầu image_gen outpaint với bảng màu, tư thế, chất liệu giấy và các mảng đa giác của ảnh nguồn. Không dùng filter hay chỉnh màu sau khi tạo ảnh. Prompt và đường dẫn từng bản được lưu trong hero-body-generation.json. Sáu gương mặt đều phải đọc được; không dùng fade để giấu mép cắt.

Animation in: nhân vật đi lên theo lớp, tên game mở ra qua mask. Pointer: độ sâu nhẹ ở từng lớp, không che thêm thông tin. Scroll out: chữ tách sang hai phía, các nhân vật rời cảnh, mặt trời phủ viewport rồi hộp đi lên theo timeline hiện có.

## Điều kiện kiểm tra

- Không còn cạnh ảnh thẳng nằm lơ lửng giữa cảnh.
- Sáu gương mặt không che nhau ở desktop và mobile.
- WebP giữ màu và alpha của PNG được chọn; đối chiếu bảng màu với tranh Trans, không có filter tăng saturation hoặc contrast.
- Mặt trời phủ mọi góc trước khi hộp đi lên; cuộn ngược khôi phục đúng cảnh.
- Preload, reduced motion và WebGL fallback vẫn hoạt động.
