// Documents provide the turn rules; printed character cards remain authoritative.

export const rulesSource =
  "https://docs.google.com/document/d/1WqryE88CVgMAJLq1xULrtpy2IznMl32enYt3hA5XkKE/edit?tab=t.h3zldwgq6rwy"

export const fullRulesSource =
  "https://docs.google.com/document/d/1WqryE88CVgMAJLq1xULrtpy2IznMl32enYt3hA5XkKE/edit?tab=t.0"

export const ruleChapters = [
  { id: "van-minh-hoa", label: "Theo một ván chơi" },

  { id: "chuan-bi", label: "Chuẩn bị bàn" },

  { id: "mot-luot", label: "Một lượt & bài đặc biệt" },

  { id: "nhan-vat", label: "Sáu nhân vật" },

  { id: "ket-thuc", label: "Thắng & thua" },

  { id: "tra-cuu", label: "Tra cứu nhanh" },
]

export const regularStrategyIds = [
  "coc-ngam",
  "do-luong",
  "mai-phuc",
  "nghi-binh",
]

export const boardRows = [2, 4, 6, 6, 4, 2]

export const setupSteps = [
  "Xáo 24 ô địa danh, đặt mặt Ổn định lên trên, xếp sáu hàng 2–4–6–6–4–2. Đặt bốn dấu kế sách cạnh bàn.",

  "Xáo riêng bộ Biến động dòng nước và bộ Kế sách. Chọn độ khó; mức Làm quen dùng hai lá Triều Biến, bỏ một lá khỏi ván.",

  "Rút bốn lá Biến động ở mức Làm quen, hoặc sáu lá ở các mức còn lại. Lật địa danh cùng tên sang Nguy cấp, đặt bài vừa rút vào chồng bỏ.",

  "Chia ngẫu nhiên mỗi người một nhân vật, đặt quân vào ô có biểu tượng xuất phát tương ứng. Ô Nguy cấp vẫn được dùng làm nơi xuất phát.",

  "Chia mỗi người hai lá Kế sách ngửa. Gặp Triều Biến khi chia thì thay bằng lá khác, sau đó xáo lá Triều Biến trở lại chồng rút.",

  "Đặt dấu Thủy triều ở nấc khởi đầu đã chọn. Chọn người đi trước; chơi theo chiều kim đồng hồ.",
]

export const inventory = [
  ["24", "ô địa danh hai mặt"],
  ["28", "lá Kế sách"],
  ["24", "lá Biến động"],
  ["06", "nhân vật & quân"],
]

export const basicActions = [
  {
    name: "Di chuyển",
    text: "Đi một ô theo cạnh ngang hoặc dọc. Được vào ô Nguy cấp; không đi vào hoặc xuyên qua ô đã mất.",
  },

  {
    name: "Củng cố",
    text: "Lật một ô Nguy cấp đang đứng hoặc liền kề về Ổn định. Không khôi phục ô đã mất.",
  },

  {
    name: "Chuyển bài",
    text: "Cho một lá thuộc bốn kế sách cho đồng đội cùng ô. Chỉ cho bài mình giữ; không lấy bài và không chuyển bài đặc biệt. Năng lực trên thẻ có thể cho phép chuyển từ xa.",
  },

  {
    name: "Hoàn thành kế sách",
    text: "Có bốn lá cùng loại và đứng ở một trong hai ô mang biểu tượng tương ứng: bỏ bốn lá, nhận dấu kế sách và một dấu Hiệp lực chung. Ô Nguy cấp vẫn hợp lệ.",
  },

  {
    name: "Dò con nước",
    text: "Xem lá Biến động trên cùng, đặt lại đúng vị trí rồi báo tên ô cho cả đội. Đặt dấu Dự báo; không dò lại khi dự báo còn hiệu lực.",
  },
]

export const lossConditions = [
  "Cả hai ô của một kế sách chưa hoàn thành đều mất.",

  "Đại bản doanh mất.",

  "Một nhân vật không có nơi thoát hợp lệ khi ô đang đứng bị mất.",

  "Thủy triều tiến tới ô Thất bại sau nấc cuối.",
]

export const quickRules = [
  {
    title: "Năm hành động · mỗi việc tốn một hành động",
    paragraphs: basicActions.map(({ name, text }) => `${name}: ${text}`),
  },

  {
    title: "Rút bài & giới hạn năm lá",
    paragraphs: [
      "Sau giai đoạn hành động, rút lần lượt hai lá Kế sách. Mỗi người giữ tối đa năm lá, kể cả Cờ Lệnh và Gia Cố. Vừa vượt giới hạn phải bỏ bớt ngay; có thể dùng bài đặc biệt đúng lúc thay vì bỏ.",

      "Bộ Kế sách gồm năm lá mỗi loại Cọc Ngầm, Dò Luồng, Mai Phục, Nghi Binh; ba Triều Biến, ba Cờ Lệnh và hai Gia Cố. Mức Làm quen bỏ một Triều Biến.",

      "Hết chồng rút Kế sách thì xáo chồng bỏ làm chồng rút mới. Hết bài Biến động giữa giai đoạn thì xáo chồng bỏ để rút đủ số lá. Bài và ô đã bị loại không trở lại ván.",
    ],
  },

  {
    title: "Triều Biến · Con nước đổi",
    paragraphs: [
      "Lá này không lên tay và không có lá bù. Tăng Thủy triều một nấc; tới ô Thất bại thì thua ngay. Xáo riêng chồng bỏ Biến động, đặt úp lên đầu chồng rút, không xáo phần bài bên dưới. Bỏ Triều Biến vào chồng bỏ Kế sách và hủy Dự báo.",

      "Nếu cả hai lá Kế sách vừa rút đều là Triều Biến: tăng hai nấc, nhưng chỉ xáo và đặt chồng bỏ Biến động lên đầu một lần sau khi xử lý cả hai lá.",
    ],
  },

  {
    title: "Dự báo & Hiệp lực",
    paragraphs: [
      "Dự báo hết hiệu lực khi lá Biến động trên cùng được rút, hoặc khi Triều Biến đặt lại chồng bỏ lên trên. Chỉ có một dự báo đang hiệu lực; không đổi thứ tự chồng rút khi dò.",

      "Mỗi kế sách hoàn thành tạo một dấu Hiệp lực chung, tối đa bốn dấu. Trước khi công bố lá Biến động tiếp theo, bỏ một dấu để cứu một ô Nguy cấp bất kỳ về Ổn định; không tốn hành động.",

      "Hiệp lực và Gia Cố không cứu được ô sau khi lá Biến động khiến nó mất đã được công bố.",
    ],
  },

  {
    title: "Thoát hiểm khi ô bị mất",
    paragraphs: [
      "Ô chỉ chuyển sang Nguy cấp thì nhân vật ở lại. Nếu ô bị mất, từng nhân vật phải lập tức tới một ô liền kề còn tồn tại, kể cả ô Nguy cấp; không tốn hành động.",

      "Theo thẻ nhân vật hiện tại, Thám Quân và Quân Thuyền Nhẹ được thoát theo đường chéo. Các nhân vật còn lại thoát theo cạnh ngang hoặc dọc. Không có nơi thoát hợp lệ thì cả đội thua ngay.",
    ],
  },

  {
    title: "Chọn độ khó & đọc bảng Thủy triều",
    paragraphs: [
      "Làm quen: bốn ô Nguy cấp ban đầu, hai Triều Biến, bắt đầu nấc một. Số lá Biến động từ nấc một đến tám: 1–1–2–2–2–3–3–4.",

      "Tiêu chuẩn: sáu ô Nguy cấp, ba Triều Biến, bắt đầu nấc hai. Số lá từ nấc hai đến tám: 2–3–3–3–4–4–5.",

      "Khó bắt đầu nấc ba; Huyền thoại bắt đầu nấc bốn trên thang Tiêu chuẩn. Cả hai vẫn có sáu ô Nguy cấp ban đầu. Sau nấc tám là ô Thất bại.",
    ],
  },
]

// Scenes intentionally skip intervening turns. This is an explained example,

// not a complete simulated match; the printed rules remain available below it.

export const matchScenes = [
  {
    title: "Trải một chiến trường.",
    label: "Chuẩn bị",
    text: "Xáo 24 địa danh, xếp 2–4–6–6–4–2. Mỗi người nhận một nhân vật và hai lá Kế sách. Bốn người ở ô xuất phát; mức Làm quen bắt đầu với bốn ô Nguy cấp.",
    note: "Cả đội cần bốn kế sách, cùng về Đại bản doanh và dùng Cờ Lệnh.",
    focus: [],
  },

  {
    title: "Đi để cùng phối hợp.",
    label: "Hành động 1 / 3",
    text: "Sau vài lượt, Nha Binh đã giữ ba Cọc Ngầm. Đến lượt Quân Truyền Lệnh: đi từ Bãi tiếp lương sang Bến Tập Kết, một ô liền kề theo cạnh.",
    note: "Di chuyển tốn một hành động. Ô Nguy cấp vẫn đi vào được.",
    focus: ["bai-tiep-luong", "ben-tap-ket"],
  },

  {
    title: "Giữ lại một bến.",
    label: "Hành động 2 / 3",
    text: "Từ Bến Tập Kết, Quân Truyền Lệnh củng cố Bãi tiếp lương liền kề: lật mặt Nguy cấp về Ổn định.",
    note: "Củng cố tốn một hành động; không thể khôi phục ô đã mất.",
    focus: ["bai-tiep-luong"],
  },

  {
    title: "Một lá, đúng người.",
    label: "Hành động 3 / 3",
    text: "Cho Nha Binh lá Cọc Ngầm thứ tư. Năng lực của Quân Truyền Lệnh cho phép chuyển bài từ xa, dù hai người không cùng ô.",
    note: "Mỗi lá cho đi tốn một hành động. Không chuyển bài đặc biệt.",
    focus: ["ben-chuyen-go", "ben-tap-ket"],
  },

  {
    title: "Hết hành động, rút bài.",
    label: "Rút Kế sách",
    text: "Đã dùng đủ ba hành động. Rút lần lượt hai lá Kế sách: Dò Luồng và Mai Phục. Mỗi người giữ tối đa năm lá, tính cả bài đặc biệt.",
    note: "Có thể kết thúc sớm ở 0–3 hành động; không bắt buộc dùng hết.",
    focus: [],
  },

  {
    title: "Nước tìm về bến cũ.",
    label: "Rút Biến động",
    text: "Nấc đầu của mức Làm quen yêu cầu một lá Biến động. Rút Bãi tiếp lương: ô vừa được củng cố trở lại Nguy cấp, thay vì bị loại.",
    note: "Một lượt luôn theo thứ tự: hành động → rút hai Kế sách → rút Biến động.",
    focus: ["bai-tiep-luong"],
  },

  {
    title: "Kế sách đầu tiên.",
    label: "Lượt tiếp theo",
    text: "Đến lượt Nha Binh: đi từ Bến Chuyển Gỗ sang Bãi cọc ngầm, rồi bỏ bốn Cọc Ngầm để hoàn thành. Hai việc tốn hai hành động; cả đội nhận một dấu Hiệp lực.",
    note: "Mỗi kế sách có hai ô phù hợp. Chỉ cần một ô còn tồn tại để thực hiện.",
    focus: ["ben-chuyen-go", "bai-coc-ngam", "bai-chuan-bi-coc"],
  },

  {
    title: "Triều biến, thế trận đổi.",
    label: "Ở một lượt sau",
    text: "Rút Triều Biến: Thủy triều tăng một nấc. Xáo chồng bỏ Biến động rồi đặt lên đầu chồng rút; Dự báo bị hủy. Sông Chanh đang Nguy cấp bị tác động lần nữa và mất khỏi bàn.",
    note: "Triều Biến không lên tay, không rút lá bù. Ô mất để lại khoảng trống.",
    focus: ["song-chanh"],
  },

  {
    title: "Cứu trước khi nước tới.",
    label: "Hiệp lực",
    text: "Trước khi công bố lá Biến động tiếp theo, cả đội dùng dấu Hiệp lực để cứu Bãi tiếp lương về Ổn định. Không tốn hành động.",
    note: "Nếu lá gây mất ô đã được công bố thì đã quá muộn để cứu.",
    focus: ["bai-tiep-luong"],
  },

  {
    title: "Cùng trở về. Cùng thắng.",
    label: "Sau nhiều lượt phối hợp",
    text: "Hoàn thành thêm Dò Luồng, Mai Phục và Nghi Binh. Cả bốn nhân vật cùng tập kết tại Đại bản doanh Lương Xâm. Dùng một Cờ Lệnh: cả đội thắng.",
    note: "Đủ bốn kế sách + tất cả về Đại bản doanh còn tồn tại + dùng Cờ Lệnh.",
    focus: ["luong-xam"],
  },
]
