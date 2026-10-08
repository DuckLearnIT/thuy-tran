# Rà soát Thủy Trận — 08/10/2026

## Phạm vi và bằng chứng

**Chế độ:** Release audit, gồm landing và luồng phiếu đặt trước. Bản kiểm tra: `main`, commit `2925b71`, localhost trên trình duyệt Chromium của Codex. Báo cáo này không thay đổi giao diện.

Đã đọc các component, dữ liệu và phần nạp tài nguyên; quan sát các chương, đo bố cục và thử bàn phím. Kích thước trong lượt rà soát: desktop 1280×720, mobile 320×568 và 390×844, ngang 844×390. Đây là mô phỏng viewport, không thay thế kiểm tra trên điện thoại thật.

- Hero: 34 kiểm tra đạt, gồm dock logo, parallax, mặt trời bao phủ, hộp đi lên và cuộn ngược.
- Địa điểm: 45 kiểm tra đạt ở 1280×720, gồm chọn thẻ, phóng lớn, Home/End, focus và cuộn ngược.
- Đặt trước: 67 kiểm tra đạt ở 390×844, gồm validation, địa chỉ liên kết, sửa dữ liệu, Back/Forward, reload, nháp hỏng, xóa nháp và storage không dùng được.
- Hai kiểm tra thao tác kéo kế sách và phản hồi thẻ đạt. Không có lỗi console trong phiên landing được đọc.

Các kiểm tra hiện có không bao phủ hết lỗi thị giác: nút đang chọn và bố cục mobile vẫn có lỗi dù các thao tác cơ bản hoạt động.

Giá, phí giao hàng, lịch giao, ngân hàng chưa công bố và 23 ảnh địa điểm còn dùng mẫu là trạng thái đã thống nhất. Không coi chúng là lỗi. Chưa kiểm tra nhận đơn/thanh toán vì bản này không có backend đó.

## Chẩn đoán chính

- Bố cục pin theo chiều cao màn hình chưa thích ứng đủ với nội dung dài và màn hình thấp.
- Một số cách dùng `currentColor` và chế độ hòa trộn làm mất chữ hoặc giảm độ rõ của điều hướng.
- Landing trình bày bộ thẻ khá kỹ, nhưng chưa cung cấp phần giải thích ngắn về mục tiêu và trải nghiệm một ván chơi.

## Hành trình đã kiểm tra

Loading → hero/mặt trời → mở hộp → lời lệnh → sáu nhân vật → bảy kế sách → địa điểm → CTA → chọn số lượng → nhập giao hàng → kiểm tra → phiếu mẫu.

| Chặng | Mục tiêu của người xem | Kết quả / điểm vướng |
|---|---|---|
| Loading | Biết trang đang chuẩn bị | Thanh sóng, tiến trình và retry có trong triển khai; lỗi mạng kéo dài chưa thử trên thiết bị thật |
| Hero / hộp | Nhận diện game, đi tiếp | Cơ chế chính đạt; cần giữ nguyên khi sửa phần khác |
| Nhân vật | Đọc kỹ năng | Màn hình thấp có chữ va vào bộ đếm hoặc ra khỏi khung |
| Kế sách | Chọn lá, đọc tác dụng | Nút đang chọn mất số; ở 320px thẻ đè chữ và nút cuối bị cắt |
| Địa điểm | Duyệt và nhấc thẻ | Các kiểm tra hiện có đạt; thiếu 23 tranh là trạng thái mẫu đã biết |
| CTA | Quyết định có quan tâm game | Chưa có mô tả ngắn giúp hình dung mục tiêu một ván |
| Phiếu đặt trước | Nhập và xem lại thông tin | Luồng đạt; xóa nháp không có đường hoàn tác |

## Các điểm cần sửa, theo ưu tiên

### S2 | Tin cậy cao | Mobile và màn hình thấp

**Một phần chữ và điều khiển bị che hoặc nằm ngoài khung.**

**Bằng chứng:** Ở 320×568, hàng bảy nút kế sách rộng 344px, bắt đầu tại x=16 và kết thúc x=360; nút 07 nằm ở x=316–360. Khung trang cố định và `overflow-hidden` cắt nút cuối. Ảnh tại trạng thái Triều Biến còn cho thấy thẻ phủ lên tiêu đề và các dòng mô tả. Ở nhân vật, bộ đếm va vào câu trích dẫn trên màn 320×568. Ở 844×390, panel Nha Tướng kết thúc khoảng y=410, vượt chiều cao 390.

**Ảnh đối chiếu:** `audit-strategies-mobile.png`, `audit-roles-mobile.png` trong thư mục bằng chứng cục bộ bên dưới.

**Ảnh hưởng:** Chọn lá bằng chạm bị hạn chế; đọc nội dung khó hơn, nhất là khi xoay ngang điện thoại.

**Nguyên nhân:** Chương giữ `h-svh` và các vùng đặt tuyệt đối, nhưng chiều cao nội dung không được tính vào khoảng dành cho thẻ. Hàng nút không wrap.

**Sửa tối thiểu:** Cho hàng nút xuống dòng có chủ đích; dành không gian riêng cho phần chữ và thẻ. Với màn hình thấp, dùng bố cục cuộn tự nhiên hoặc một chế độ gọn, tương tự nhánh màn hình thấp đã có ở địa điểm. Không chỉ thu nhỏ toàn bộ chữ.

**Tiêu chí đạt:** 320×568, 390×844 và 844×390 đọc đủ nội dung; cả bảy nút có thể chạm; không có giao nhau giữa chữ, thẻ và bộ đếm. Vẫn giữ animation ở kích thước đủ chỗ.

**Vị trí code:** `src/components/Strategies.tsx:202`, `:229`, `:302`; `src/components/Roles.tsx:199`, `:215`.

### S2 | Tin cậy cao | Kế sách / trạng thái chọn

**Lá đang chọn không hiện rõ số thứ tự.**

**Bằng chứng:** Nút 01 ở Triều Biến có cả màu chữ và nền là `rgb(42,127,208)`. Ảnh desktop chỉ thấy các nút 02–07. Nền dùng `currentColor`, trong khi màu chữ của nút đang chọn lại là màu nền chương.

**Ảnh hưởng:** Người xem khó biết mình đang ở lá nào, dù trạng thái `aria-selected` đã đúng.

**Sửa tối thiểu:** Tách màu chữ khỏi màu nền nút. Dùng màu chữ của chương làm nền nút và màu nền chương làm chữ; giữ một dấu hiệu chọn rõ ngoài đổi màu.

**Tiêu chí đạt:** Cả bảy trạng thái đều đọc được số; nút chọn không biến mất trên màu nền tương ứng. Thêm một kiểm tra render cho trạng thái này.

**Vị trí code:** `src/components/Strategies.tsx:320`.

### S2 | Tin cậy vừa | Header trên nền chương

**“Nhận lệnh” giảm độ rõ trên nền xanh của kế sách.**

**Bằng chứng:** Header dùng `mix-blend-mode: difference`; màu CTA tính từ CSS là trắng. Trên nền Triều Biến `rgb(42,127,208)`, phép hòa trộn cho màu gần `rgb(213,128,47)`, tỷ lệ tương phản tính trên nền phẳng khoảng 1,38:1 trước lớp grain. Ảnh desktop cũng cho thấy chữ điều hướng chuyển sang màu vàng cam khá gần độ sáng của nền. Đây là phép tính theo màu và cơ chế blend, không phải đo mọi pixel của toàn trang.

**Ảnh hưởng:** CTA cố định khó đọc ở một số chương. Logo cũng đổi màu khó đoán, nhưng không dùng logo làm căn cứ kết luận tiêu chí tương phản chữ thông thường.

**Sửa tối thiểu:** Dùng màu điều hướng xác định theo chương, hoặc một nền giấy nhỏ đủ tương phản. Giữ việc menu xuất hiện khi hover như hiện tại.

**Tiêu chí đạt:** Đo lại chữ “Nhận lệnh” trên từng màu nền, ở trạng thái đứng yên lẫn chuyển chương. Màu đủ rõ mà không phụ thuộc việc đảo màu tình cờ. Đối chiếu [W3C về tương phản chữ](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

**Vị trí code:** `src/components/Cover.tsx:64`, `src/components/Header.tsx:42`.

### S2 | Tin cậy cao về hành vi | Kế sách / bàn phím

**Nhóm khai báo là tabs nhưng không có hành vi bàn phím của tabs.**

**Bằng chứng:** Cả bảy phần tử `role="tab"` đều có `tabIndex=0`. Focus nút 02 rồi nhấn ArrowRight vẫn giữ focus tại 02; lá chọn vẫn là 01. Handler phím mũi tên hiện nằm ở vùng thẻ, không ở tablist. Chọn bằng Tab rồi Enter vẫn là một đường dùng được.

**Ảnh hưởng:** Người dùng bàn phím hoặc công nghệ hỗ trợ có thể nhận kỳ vọng không khớp vai trò đã khai báo.

**Sửa tối thiểu:** Vì các nút điều khiển vị trí scroll, có thể dùng nhóm button thông thường với trạng thái chọn được mô tả đúng. Nếu giữ tabs, làm đầy đủ focus mũi tên, roving tabindex và liên kết panel.

**Tiêu chí đạt:** Vai trò và thao tác nhất quán; có focus rõ; chọn được mọi lá bằng bàn phím. [Mẫu tabs của WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) là tham chiếu hành vi, không phải bằng chứng trang đạt hoặc không đạt toàn bộ WCAG.

**Vị trí code:** `src/components/Strategies.tsx:309`.

### S2 | Tin cậy vừa | Nội dung hỗ trợ quyết định

**Người mới xem được bộ thẻ nhưng chưa được giải thích ngắn về một ván chơi.**

**Bằng chứng:** Hero mô tả “Sáu nhân vật. Một ý chí”; phần hộp nêu số thẻ; các chương sau mô tả kỹ năng và tác dụng kế sách. Nội dung hiện không nêu rõ mục tiêu thắng/thua hoặc vòng hành động tổng quát. Footer dẫn thẳng sang phiếu mẫu.

**Ảnh hưởng:** Khả năng người mới chưa hình dung được game và lý do nên đặt trước là một giả thuyết cần thử với người xem thật; không có dữ liệu bỏ trang để khẳng định tỷ lệ ảnh hưởng.

**Sửa tối thiểu:** Thêm một đoạn rất ngắn về mục tiêu và cách cả đội phối hợp, trong vùng hộp hoặc CTA đang có. Số người chơi, thời lượng, độ tuổi chỉ đưa vào khi có thông số xác nhận.

**Tiêu chí đạt:** Người chưa biết game có thể giải thích mục tiêu ván chơi sau khi xem đoạn giới thiệu đó; xác nhận bằng một lượt thử đọc ngắn. Không tự sáng tác luật.

**Vị trí code:** `src/components/Hero.tsx:79`, `src/components/Cover.tsx:136`, `src/components/Finale.tsx:110`.

### S3 | Tin cậy cao | Chữ viền

**Một số chữ dự định vẽ viền đang biến mất hoàn toàn.**

**Bằng chứng:** `getComputedStyle` của các tên Nha Binh, Thuyền Nhẹ, Hướng Đạo trong marquee trả về cả `color` và `webkitTextStrokeColor` là `rgba(0,0,0,0)`. `.text-outline` dùng màu chữ trong suốt rồi lấy `currentColor` làm màu nét. Tiêu đề lớn `.ks-name` có cùng cách đặt màu trong inline style.

**Ảnh hưởng:** Marquee có những khoảng trống mất tên; lớp chữ nền ở kế sách không thực hiện được ý đồ thị giác.

**Sửa tối thiểu:** Cấp màu nét riêng từ màu vùng chứa hoặc biến CSS, tách khỏi màu ruột chữ.

**Tiêu chí đạt:** Nét chữ xuất hiện đúng màu ở cả marquee và kế sách; không làm chữ số lớn ở nhân vật bị tô đặc hoặc đổi màu.

**Vị trí code:** `src/index.css:157`, `src/components/Strategies.tsx:215`.

### S3 | Tin cậy cao | Phiếu mẫu / xóa nháp

**Bấm xóa nháp là mất ngay toàn bộ nội dung đã nhập.**

**Bằng chứng:** Kiểm tra phiếu mẫu xác nhận reset xóa storage và đưa về bước 1; Back không khôi phục nháp. `clearDraft` không lưu bản trước hoặc có thao tác hoàn tác. Nhãn nút đã nói rõ hành động, nên đây là cải thiện phục hồi, không phải thao tác bị giấu.

**Ảnh hưởng:** Một cú bấm nhầm buộc nhập lại địa chỉ; ở giai đoạn này không gây mất đơn hay tiền.

**Sửa tối thiểu:** Cho hoàn tác một lần trong phiên đang mở. Không cần một modal lớn.

**Tiêu chí đạt:** Sau reset có thể phục hồi dữ liệu vừa xóa; nháp đã xóa không bị gửi hoặc tạo đơn. Việc đóng tab không phải một cam kết lưu lâu dài.

**Vị trí code:** `src/components/Preorder.tsx:72`, `:265`.

## Cơ hội làm trải nghiệm thú vị hơn

### 1. Rút một nhân vật ngay ở footer — nên thử trước

Tận dụng sáu lá đã có: chạm một lá, lá đó tách khỏi quạt bài, dựng lên giữa và hiện tên/kỹ năng. Chạm lần nữa hoặc Escape trả về đúng chỗ. Có thể dẫn về nhân vật tương ứng để đọc kỹ hơn. Chuyển các mặt thẻ thành button thực sự để dùng được bằng bàn phím.

**Giá trị giả định:** Footer trở thành một lần khám phá ngắn, thay vì chỉ là chỗ kết thúc trang. Không cần tranh mới hoặc thêm một chương scroll.

**Đo thành công:** Người thử nhận ra mình có thể chọn lá và kể lại được kỹ năng vừa xem; CTA vẫn dễ tìm, thao tác trả thẻ rõ.

### 2. Nhấc thẻ địa điểm khỏi vòng xoáy

Trạng thái mở hiện chủ yếu phóng lớn 1,22 lần. Có thể thử cho thẻ tiến ra trước, bảy dải cong duỗi nhẹ thành mặt phẳng để đọc tranh rõ hơn, rồi cuộn trở lại đúng vị trí khi đóng. Giữ cùng card, chỉ đổi trạng thái và chuyển động; không thêm thanh điều khiển hay đồ trang trí mới.

**Giá trị giả định:** Chạm có cảm giác đang cầm một miếng bìa thật, đồng thời cải thiện việc xem artwork. Chế độ giảm chuyển động chỉ đổi trạng thái tức thì.

**Đo thành công:** Phân biệt được xem gần/đang duyệt; đóng hoặc cuộn tiếp không làm mất chỉ số đang xem; thẻ giữ tỷ lệ 1:1.

### 3. “Ban thử một lệnh” trong vùng kỹ năng

Thử một demo rất ngắn ở Truyền Lệnh: chạm kỹ năng để một lá kế sách chuyển sang đồng đội, rồi trở về trạng thái đọc. Dùng các artwork có sẵn trong vùng thẻ hiện tại. Chỉ minh họa quy tắc đã có trên thẻ; không tự thêm điểm số, điều kiện thắng hoặc chi phí hành động chưa được xác nhận.

**Giá trị giả định:** Animation giúp hiểu cơ chế hợp tác, ngoài việc trưng bày hình ảnh.

**Đo thành công:** Người thử hiểu tác dụng kỹ năng mà không cần đọc lại cả đoạn; demo bỏ qua được và không giữ người xem trong một đoạn pin mới.

## Nhịp và tải tài nguyên: cơ hội tối ưu, chưa phải lỗi đã đo với người dùng

- Ở 1280×720, tài liệu dài khoảng **34,75 màn hình**. Các đoạn pin chiếm khoảng **28,08 màn**: hộp 10; nhân vật 6,75; kế sách 7,13; địa điểm 4,2. Độ dài đã đo; cảm giác “quá lâu” cần kiểm chứng với người mới. Có thể thử click các dấu hình thoi của nhân vật để nhảy đúng lá, giữ timeline cũ và giảm nhu cầu cuộn lại.
- 22 ảnh duy nhất trong bộ preloader có tổng dung lượng file **6.845.728 byte**, chưa gồm font và script. Sáu tranh hero chiếm khoảng 75% số byte ảnh. Chưa đo tốc độ tải qua mạng di động thực tế. Nên thử xuất dung lượng phù hợp màn hình và so sánh độ nét/màu gốc; vẫn giữ nguyên yêu cầu tải sẵn toàn trang trước khi trải nghiệm.
- Footer có thể nhận thông tin người làm game, liên hệ, hướng dẫn chơi và FAQ khi đã có nội dung thật. Tránh thêm thông tin mua hàng chưa chốt chỉ để làm footer dài hơn.

## Thứ tự làm đề xuất

1. Sửa bố cục mobile/màn hình thấp, trạng thái nút kế sách và màu CTA cố định.
2. Sửa chữ viền; làm đúng nhóm nút bàn phím; bổ sung đoạn giải thích một ván chơi và hoàn tác nháp.
3. Thử **Rút nhân vật ở footer** trước. Sau đó thử **Nhấc/duỗi thẻ địa điểm**. Demo kỹ năng làm sau khi chốt nội dung minh họa.
4. Đo tải và thời gian khám phá với người mới; tối ưu asset và độ dài pin dựa trên kết quả.

## Những phần nên giữ

- Mặt trời là đường chuyển cảnh hero → hộp, cùng cơ chế heading thu về logo.
- Chữ, màu giấy/son/xanh sông và artwork gốc tạo một ngôn ngữ nhất quán.
- Phiếu mẫu minh bạch, địa chỉ liên kết, nháp trong tab và các nhánh giảm chuyển động.

## Giới hạn và lượt kiểm tra tiếp theo

Chưa có thử nghiệm với người mới, screen reader thực tế, bàn phím ảo, mạng chậm/offline, FPS trên điện thoại hoặc kiểm tra zoom 200–400% đầy đủ. Các kết quả này không phải chứng nhận WCAG hay đánh giá tỷ lệ chuyển đổi. Cần kiểm tra lại khi có đủ artwork địa điểm, luật giới thiệu và thông tin bán hàng.

Bằng chứng ảnh cục bộ: `C:/Users/Duck/.codex/visualizations/2026/10/04/01a104ca-a0e5-7022-8f70-4980d38a5c7e/` — `audit-strategies-desktop.png`, `audit-strategies-mobile.png`, `audit-roles-mobile.png`.

Đối chiếu thêm với [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md); chỉ áp dụng các nguyên tắc phù hợp với website này, không coi yêu cầu tải lười là bắt buộc vì sản phẩm đã chọn nạp sẵn toàn trải nghiệm.
