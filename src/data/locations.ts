import bachDangFront from '../assets/locations/bach-dang-front.webp'
import bachDangBack from '../assets/locations/bach-dang-back.webp'
import cuaBachDangFront from '../assets/locations/cua-bach-dang-front.webp'
import cuaBachDangBack from '../assets/locations/cua-bach-dang-back.webp'
import trangKenhFront from '../assets/locations/trang-kenh-front.webp'
import trangKenhBack from '../assets/locations/trang-kenh-back.webp'
import songChanhFront from '../assets/locations/song-chanh-front.webp'
import songChanhBack from '../assets/locations/song-chanh-back.webp'
import luongXamFront from '../assets/locations/luong-xam-front.webp'
import luongXamBack from '../assets/locations/luong-xam-back.webp'
import cuaBienAnBangFront from '../assets/locations/cua-bien-an-bang-front.webp'
import cuaBienAnBangBack from '../assets/locations/cua-bien-an-bang-back.webp'
import songCamFront from '../assets/locations/song-cam-front.webp'
import songCamBack from '../assets/locations/song-cam-back.webp'
import giaVienFront from '../assets/locations/gia-vien-front.webp'
import giaVienBack from '../assets/locations/gia-vien-back.webp'
import baiCocNgamFront from '../assets/locations/bai-coc-ngam-front.webp'
import baiCocNgamBack from '../assets/locations/bai-coc-ngam-back.webp'
import benVanChuyenGoFront from '../assets/locations/ben-van-chuyen-go-front.webp'
import benVanChuyenGoBack from '../assets/locations/ben-van-chuyen-go-back.webp'
import baiChuanBiCocFront from '../assets/locations/bai-chuan-bi-coc-front.webp'
import baiChuanBiCocBack from '../assets/locations/bai-chuan-bi-coc-back.webp'
import baiBunTrieuFront from '../assets/locations/bai-bun-trieu-front.webp'
import baiBunTrieuBack from '../assets/locations/bai-bun-trieu-back.webp'
import goDatCaoFront from '../assets/locations/go-dat-cao-front.webp'
import goDatCaoBack from '../assets/locations/go-dat-cao-back.webp'
import lachNuocSauFront from '../assets/locations/lach-nuoc-sau-front.webp'
import lachNuocSauBack from '../assets/locations/lach-nuoc-sau-back.webp'
import ngaBaDongNuocFront from '../assets/locations/nga-ba-dong-nuoc-front.webp'
import ngaBaDongNuocBack from '../assets/locations/nga-ba-dong-nuoc-back.webp'
import khucSongCongFront from '../assets/locations/khuc-song-cong-front.webp'
import khucSongCongBack from '../assets/locations/khuc-song-cong-back.webp'
import boLauFront from '../assets/locations/bo-lau-front.webp'
import boLauBack from '../assets/locations/bo-lau-back.webp'
import rungVenSongFront from '../assets/locations/rung-ven-song-front.webp'
import rungVenSongBack from '../assets/locations/rung-ven-song-back.webp'
import benThuyenNheFront from '../assets/locations/ben-thuyen-nhe-front.webp'
import benThuyenNheBack from '../assets/locations/ben-thuyen-nhe-back.webp'
import vungNuocLangFront from '../assets/locations/vung-nuoc-lang-front.webp'
import vungNuocLangBack from '../assets/locations/vung-nuoc-lang-back.webp'
import baiTapKetFront from '../assets/locations/bai-tap-ket-front.webp'
import baiTapKetBack from '../assets/locations/bai-tap-ket-back.webp'
import baiTiepLuongFront from '../assets/locations/bai-tiep-luong-front.webp'
import baiTiepLuongBack from '../assets/locations/bai-tiep-luong-back.webp'
import boDatThapFront from '../assets/locations/bo-dat-thap-front.webp'
import boDatThapBack from '../assets/locations/bo-dat-thap-back.webp'
import loiSongHepFront from '../assets/locations/loi-song-hep-front.webp'
import loiSongHepBack from '../assets/locations/loi-song-hep-back.webp'

export type LocationCard = {
  id: string
  name: string
  image: string
  back: string
  meaning: string
  story: string
  source: string
  characterId?: string
  strategyId?: string
}

// Meaning and story follow the supplied research table; role names resolve from current cards.
export const locations: LocationCard[] = [
  { id: 'bach-dang', name: 'Sông Bạch Đằng', image: bachDangFront, back: bachDangBack,
    meaning: 'Không gian trung tâm của trận quyết chiến năm 938.', story: 'Ngô Quyền bố trí trận địa cọc, nhử thủy quân Nam Hán tiến vào khi nước lên và phản công khi nước rút.', source: 'Đại Việt sử ký toàn thư, Ngoại kỷ, quyển V, mục Tiền Ngô Vương; Bảo tàng Lịch sử Quốc gia, Ngô Quyền và chiến thắng Bạch Đằng năm 938 (2013).' },
  { id: 'cua-bach-dang', name: 'Cửa Bạch Đằng', image: cuaBachDangFront, back: cuaBachDangBack,
    meaning: 'Cửa ngõ từ biển vào hệ thống sông Bạch Đằng.', story: 'Quân Nam Hán tiến từ biển vào cửa sông, nơi Ngô Quyền chủ động chuẩn bị trận địa.', source: 'Trần Trọng Dương (2019), Sông Bạch Đằng và cửa biển Bạch Đằng: Nghiên cứu địa lý học lịch sử, Tạp chí Nghiên cứu và Phát triển, số 2 (154).' },
  { id: 'trang-kenh', name: 'Tràng Kênh', image: trangKenhFront, back: trangKenhBack,
    meaning: 'Khu vực núi đá vôi bên hữu ngạn Bạch Đằng, có địa hình thuận lợi cho việc tổ chức trận địa.', story: 'Núi đá, hang động và các sông lạch góp phần tạo nên địa hình của khu vực chiến trường.', source: 'Bảo tàng Lịch sử Quốc gia, Kỷ niệm 1075 năm chiến thắng Bạch Đằng lần thứ nhất (2013).', strategyId: 'mai-phuc' },
  { id: 'song-chanh', name: 'Sông Chanh', image: songChanhFront, back: songChanhBack,
    meaning: 'Mốc địa lý thuộc hệ thống cửa sông Bạch Đằng.', story: 'Trong một phục dựng lịch sử, lực lượng bố trí phía sau sông Chanh cơ động ra đánh chặn khi thuyền Nam Hán tiến vào trận địa.', source: 'Bảo tàng Lịch sử Quốc gia (2013); Trần Trọng Dương (2019). Vai trò quân sự cụ thể thuộc nội dung phục dựng.' },
  { id: 'luong-xam', name: 'Lương Xâm', image: luongXamFront, back: luongXamBack,
    meaning: 'Khu vực gắn với căn cứ bản doanh của Ngô Quyền; được chọn làm Đại bản doanh trong game.', story: 'Địa điểm gắn với truyền thống tổ chức lực lượng và chỉ huy việc chuẩn bị trận Bạch Đằng.', source: 'Cục Di sản văn hóa, hồ sơ Cụm di tích Từ Lương Xâm – căn cứ bản doanh của Ngô Quyền năm 938; Quyết định 152/QĐ-TTg ngày 17/1/2025.', characterId: 'nha-tuong' },
  { id: 'cua-bien-an-bang', name: 'Cửa biển An Bang', image: cuaBienAnBangFront, back: cuaBienAnBangBack,
    meaning: 'Không gian ngoài biển gắn với hướng tiến quân của đoàn chiến thuyền Nam Hán.', story: 'Theo phục dựng của Bảo tàng Lịch sử Quốc gia, hạm đội Lưu Hoằng Tháo vượt cửa biển An Bang trước khi tiến vào Bạch Đằng.', source: 'Bảo tàng Lịch sử Quốc gia, Ngô Quyền và chiến thắng Bạch Đằng năm 938 (2013).', characterId: 'huong-dao-luc' },
  { id: 'song-cam', name: 'Sông Cấm', image: songCamFront, back: songCamBack,
    meaning: 'Tuyến sông thuộc hệ thống thủy văn liên quan đến không gian chiến trường.', story: 'Trong phục dựng của Bảo tàng Lịch sử Quốc gia, lực lượng bố trí bên hữu ngạn sông Cấm phối hợp đánh vào sườn đội hình Nam Hán.', source: 'Bảo tàng Lịch sử Quốc gia (2013); Trần Trọng Dương (2019). Không khẳng định toàn bộ sông Cấm là nơi quyết chiến.' },
  { id: 'gia-vien', name: 'Gia Viên', image: giaVienFront, back: giaVienBack,
    meaning: 'Địa bàn gắn với sự tham gia của lực lượng địa phương.', story: 'Các tài liệu nghiên cứu ghi nhận trai tráng Gia Viên mang người, vũ khí và thuyền bè tham gia lực lượng Ngô Quyền.', source: 'Bảo tàng Lịch sử Quốc gia (2013); Nguyễn Minh Đức (2018), Nét đặc sắc về nghệ thuật lập thế trận trong trận Bạch Đằng năm 938, Tạp chí Quốc phòng toàn dân.' },
  { id: 'bai-coc-ngam', name: 'Bãi cọc ngầm', image: baiCocNgamFront, back: baiCocNgamBack,
    meaning: 'Biểu tượng của kế sách Cọc ngầm.', story: 'Cọc gỗ được bố trí dưới mặt nước; khi nước rút, trận địa phát huy tác dụng.', source: 'Không có nguồn xác định vị trí ô game. Cơ sở về chiến thuật: Đại Việt sử ký toàn thư, Ngoại kỷ, quyển V; Bảo tàng Lịch sử Quốc gia (2013).', strategyId: 'coc-ngam' },
  { id: 'ben-van-chuyen-go', name: 'Bến vận chuyển gỗ', image: benVanChuyenGoFront, back: benVanChuyenGoBack,
    meaning: 'Đại diện cho hoạt động vận chuyển nguyên liệu.', story: 'Người chơi đưa gỗ xuống thuyền để chuyển đến nơi chuẩn bị cọc.', source: 'Không có nguồn xác nhận bến cụ thể. Cảm hứng từ hoạt động huy động gỗ làm cọc, Nguyễn Minh Đức (2013), Tạp chí Quốc phòng toàn dân.', characterId: 'nha-binh' },
  { id: 'bai-chuan-bi-coc', name: 'Bãi chuẩn bị cọc', image: baiChuanBiCocFront, back: baiChuanBiCocBack,
    meaning: 'Không gian gia công vật liệu trước khi bố trí trận địa.', story: 'Những người tham gia chuẩn bị cọc phải hoàn thành công việc trước khi nước lên.', source: 'Không có nguồn xác nhận bãi cụ thể. Cơ sở về việc đẵn gỗ, vót nhọn và chuẩn bị cọc: Bảo tàng Lịch sử Quốc gia (2013).', strategyId: 'coc-ngam' },
  { id: 'bai-bun-trieu', name: 'Bãi bùn triều', image: baiBunTrieuFront, back: baiBunTrieuBack,
    meaning: 'Đại diện cho sự thay đổi địa hình khi thủy triều lên xuống.', story: 'Khi nước dâng, khu vực bị ngập; khi nước rút, bãi bùn trở thành chướng ngại di chuyển.', source: 'Không có nguồn xác nhận bãi cụ thể. Cảm hứng địa mạo: Trần Trọng Dương (2019).', characterId: 'thuyen-nhe' },
  { id: 'go-dat-cao', name: 'Gò đất cao', image: goDatCaoFront, back: goDatCaoBack,
    meaning: 'Vị trí quan sát địa hình và tình hình trên sông.', story: 'Người chơi đến gò đất để quan sát và hỗ trợ đồng đội lựa chọn hướng di chuyển.', source: 'Không có nguồn xác nhận gò cụ thể. Cảm hứng từ địa hình đất cao tại Lương Xâm trong hồ sơ Cục Di sản văn hóa.' },
  { id: 'lach-nuoc-sau', name: 'Lạch nước sâu', image: lachNuocSauFront, back: lachNuocSauBack,
    meaning: 'Đại diện cho các luồng nước có thể di chuyển bằng thuyền.', story: 'Người chơi tìm lạch nước phù hợp để thực hiện kế sách Dò luồng.', source: 'Không có nguồn xác nhận lạch cụ thể. Cơ sở địa lý: Trần Trọng Dương (2019).', strategyId: 'do-luong' },
  { id: 'nga-ba-dong-nuoc', name: 'Ngã ba dòng nước', image: ngaBaDongNuocFront, back: ngaBaDongNuocBack,
    meaning: 'Điểm giao nhau của các dòng chảy, tạo nhiều hướng di chuyển.', story: 'Đội thuyền lựa chọn hướng đi; ô này kết nối các tuyến di chuyển trên bàn chơi.', source: 'Không có nguồn xác nhận ngã ba cụ thể. Cảm hứng từ hệ thống sông Bạch Đằng, Trần Trọng Dương (2019).', strategyId: 'do-luong' },
  { id: 'khuc-song-cong', name: 'Khúc sông cong', image: khucSongCongFront, back: khucSongCongBack,
    meaning: 'Địa hình tạo thay đổi về tầm nhìn và hướng di chuyển.', story: 'Thuyền nhẹ di chuyển qua khúc quanh, phục vụ việc dẫn dụ hoặc thoát hiểm.', source: 'Không có nguồn xác nhận khúc sông cụ thể. Cảm hứng từ chiến thuật thuyền nhẹ khiêu chiến và giả thua trong Đại Việt sử ký toàn thư.' },
  { id: 'bo-lau', name: 'Bờ lau', image: boLauFront, back: boLauBack,
    meaning: 'Biểu tượng cho khả năng che giấu lực lượng ven sông.', story: 'Quân ẩn mình bên bờ chờ hiệu lệnh phối hợp, phục vụ kế sách Mai phục.', source: 'Không có nguồn xác nhận bờ lau cụ thể. Cảm hứng từ thế trận mai phục hai bên bờ, Bảo tàng Lịch sử Quốc gia (2013).', strategyId: 'mai-phuc' },
  { id: 'rung-ven-song', name: 'Rừng ven sông', image: rungVenSongFront, back: rungVenSongBack,
    meaning: 'Không gian tự nhiên giúp che khuất hoạt động trên bờ.', story: 'Quân mai phục tập hợp trong khu vực có cây cối che chắn.', source: 'Không có nguồn xác nhận khu rừng cụ thể. Cảm hứng từ nghiên cứu về địa hình và thế trận, Nguyễn Minh Đức (2013), Tạp chí Quốc phòng toàn dân.', characterId: 'tham-quan' },
  { id: 'ben-thuyen-nhe', name: 'Bến thuyền nhẹ', image: benThuyenNheFront, back: benThuyenNheBack,
    meaning: 'Đại diện cho lực lượng cơ động và kế sách Nghi binh.', story: 'Thuyền nhẹ xuất phát, khiêu chiến, giả thua rồi rút về phía trận địa đã chuẩn bị.', source: 'Không có nguồn xác nhận bến cụ thể. Cơ sở về thuyền nhẹ và nghi binh: Đại Việt sử ký toàn thư, Ngoại kỷ, quyển V.', strategyId: 'nghi-binh' },
  { id: 'vung-nuoc-lang', name: 'Vùng nước lặng', image: vungNuocLangFront, back: vungNuocLangBack,
    meaning: 'Không gian tạm dừng hoặc tập hợp thuyền trong trò chơi.', story: 'Thuyền nhỏ tạm ẩn trong vùng nước kín trước khi nhận hiệu lệnh.', source: 'Không có nguồn xác nhận địa điểm hoặc hoạt động cụ thể. Cảm hứng từ mạng lưới sông lạch Bạch Đằng, Trần Trọng Dương (2019).' },
  { id: 'bai-tap-ket', name: 'Bãi tập kết', image: baiTapKetFront, back: baiTapKetBack,
    meaning: 'Không gian tập hợp người và vật liệu chuẩn bị trận địa.', story: 'Gỗ, phương tiện và lực lượng được tập trung trước khi phân chia nhiệm vụ.', source: 'Không có nguồn xác nhận bãi cụ thể. Cảm hứng từ hoạt động huy động nhân lực và vật lực, Nguyễn Minh Đức (2018), Tạp chí Quốc phòng toàn dân.', strategyId: 'nghi-binh' },
  { id: 'bai-tiep-luong', name: 'Bãi tiếp lương', image: baiTiepLuongFront, back: baiTiepLuongBack,
    meaning: 'Đại diện cho nhiệm vụ bảo đảm nhu yếu phẩm.', story: 'Lương thực được chuyển đến phục vụ những người đang chuẩn bị trận địa.', source: 'Không có nguồn xác nhận bến cụ thể. Cảm hứng từ hoạt động huy động lương thực và vật lực, Nguyễn Minh Đức (2013), Tạp chí Quốc phòng toàn dân.', characterId: 'truyen-lenh-lam' },
  { id: 'bo-dat-thap', name: 'Bờ đất thấp', image: boDatThapFront, back: boDatThapBack,
    meaning: 'Địa hình ven sông chịu ảnh hưởng của mực nước.', story: 'Khi nước lên, bờ đất có nguy cơ bị ngập; người chơi phải cân nhắc việc di chuyển và củng cố.', source: 'Không có nguồn xác nhận đoạn bờ cụ thể. Cảm hứng địa mạo: Trần Trọng Dương (2019).' },
  { id: 'loi-song-hep', name: 'Lối sông hẹp', image: loiSongHepFront, back: loiSongHepBack,
    meaning: 'Địa hình hạn chế không gian di chuyển, phù hợp với thuyền nhỏ.', story: 'Thuyền nhẹ sử dụng lối đi hẹp để di chuyển giữa các khu vực.', source: 'Không có nguồn xác nhận lối sông cụ thể. Cơ sở về mạng lưới sông lạch: Trần Trọng Dương (2019); cơ sở về thuyền nhẹ: Bảo tàng Lịch sử Quốc gia (2013).' },
]
