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

## Điều chỉnh sau phản hồi

Người dùng đề xuất bố cục gợi điểm chạm tay trong bức tranh Creation of Adam. Hero hiện dùng sáu tư thế tay vươn vào mặt trời nhỏ ở giữa: ba phía trái, ba phía phải; hai người ở trên và hai người ở dưới tạo đường nhìn vào tâm. Imagegen chỉnh từng tranh nguồn riêng, giữ phục trang, bảng màu và chất liệu đa giác. Bản gốc được giữ riêng; bản WebP mới nằm trong src/assets/hero/reach. Không áp dụng filter hoặc chỉnh saturation/contrast sau khi tạo ảnh.

Tên Thủy Trận lớn xuất hiện ngay từ đầu bên dưới mặt trời, màu mực trên nền giấy; dưới tên là “Sáu nhân vật. Một ý chí. Cùng xoay chuyển thế trận.” Tay được neo theo một khung chung, có khoảng nhỏ trước mép mặt trời. Nhân vật tiến vào từ hai phía, độ sâu theo con trỏ rất nhẹ để giữ hình tượng sắp chạm. Sóng thu thành đường nước nhỏ ở chân trang mở đầu.

Khi cuộn, chính phần tử tên thu về logo góc trên; nút Nhận lệnh và menu xuất hiện sau khi logo về vị trí. Nhân vật và đường nước rời cảnh; mặt trời phủ viewport trước khi hộp đi lên theo cơ chế hiện có. Cuộn ngược khôi phục cảnh và chữ lớn. Reduced motion dùng cảnh tĩnh, logo về góc ngay khi cuộn; giữ nguyên khung DOM của các phần ghim để chuyển chế độ không làm mất trang.

Mỗi nhân vật có dáng ngồi/quỳ gọn với tà áo hoàn chỉnh, tay và đạo cụ nằm trong khung ảnh. Không dùng clip-path hoặc gradient để giấu phần thân bị cắt. Khung chung được giới hạn theo cả chiều rộng và chiều cao màn hình; chữ và lời dẫn có khoảng trống riêng phía dưới.

Prompt và chế độ built-in được lưu trong hero-sun-reach-generation.json. PNG nhân vật được chuyển lossless sang WebP, không chỉnh màu. Các bản PNG nguồn vẫn được giữ riêng.

## Bố cục từ ba mép màn hình — 08/10/2026

Theo tham chiếu Creation of Adam và phản hồi mới: giữ nguyên sáu WebP đang có, phóng lớn nhân vật để phần thân nằm ngoài khung hình. Thám Quân ở góc trái trên; Hướng Đạo ở góc phải trên; hai cặp còn lại vươn tay từ trái/phải. Tất cả đầu ngón tay neo quanh cùng một mặt trời lớn, giữ khoảng hở trước mép mặt trời. Thứ tự lớp giữ cả sáu gương mặt rõ ràng. Không dùng ảnh mới, mask hay filter để sửa dáng.

Tên game lớn hơn, màu đỏ trầm, nằm dưới mặt trời. CTA Đặt trước boardgame xuất hiện ngay màn đầu và mở giao diện đặt trước hiện có; nút có hover, pressed và focus bàn phím. Bỏ hoàn toàn sóng nước ở đáy hero. Khi cuộn, sáu bàn tay nhích vào tâm một nhịp rồi cả hình xoay và rút về trái, phải hoặc phía trên; không fade nhân vật. Mặt trời vẫn phủ toàn màn trước khi hộp đi lên. Tiêu đề vẫn thu về cùng phần tử logo.

Kiểm tra trực tiếp desktop/mobile: sáu ảnh được giải mã; mép hình nằm ngoài ba phía; đầu ngón tay không bị cắt; tiêu đề, lời dẫn và CTA có khoảng riêng; CTA mở đúng trang; xoay rút theo ba phía; phủ kín trước hộp; cuộn ngược và refresh khôi phục đúng cảnh; giảm chuyển động giữ hero tĩnh.
