import nhaTuong from '../assets/nha-tuong.webp'
import nhaBinh from '../assets/nha-binh.webp'
import thamQuan from '../assets/tham-quan.webp'
import thuyenNhe from '../assets/thuyen-nhe.webp'
import huongDao from '../assets/huong-dao.webp'
import huongDaoLuc from '../assets/huong-dao-luc.webp'

export type CardData = {
  id: string
  role: string
  prefix?: string
  skill: string
  text: string
  quote: string
  image: string
  bg: string
  accent: string
}

export const cards: CardData[] = [
  {
    id: 'nha-tuong',
    role: 'Nha Tướng',
    skill: 'Điều Binh Khiển Tướng',
    text: 'Dùng 1 hành động để điều động một người khác tối đa 2 ô.',
    quote: 'Quân tùy lệnh chuyển, thế tùy quân thành.',
    image: nhaTuong,
    bg: '#5a1a14',
    accent: '#f0b23a',
  },
  {
    id: 'nha-binh',
    role: 'Nha Binh',
    skill: 'Song Trấn Định Quân Thế',
    text: 'Dùng 1 hành động để củng cố tối đa 2 ô kề với vị trí người chơi.',
    quote: 'Nhất cử định địa, song cố an quân.',
    image: nhaBinh,
    bg: '#3f1f14',
    accent: '#e8a46a',
  },
  {
    id: 'tham-quan',
    role: 'Thám Quân',
    skill: 'Xuyên Lộ Thám Hành',
    text: 'Có thể di chuyển, củng cố và thoát hiểm theo đường chéo.',
    quote: 'Lộ hiểm khả thám, địa trở khả hành.',
    image: thamQuan,
    bg: '#5b3b0e',
    accent: '#f2c04e',
  },
  {
    id: 'thuyen-nhe',
    role: 'Thuyền Nhẹ',
    prefix: 'Quân',
    skill: 'Khinh Chu Phi Độ',
    text: 'Có thể di chuyển, củng cố và thoát hiểm theo đường chéo.',
    quote: 'Chu khinh thủy thuận, hiểm cách diệc thông.',
    image: thuyenNhe,
    bg: '#12284a',
    accent: '#ec6a58',
  },
  {
    id: 'huong-dao-lam',
    role: 'Hướng Đạo',
    prefix: 'Quân',
    skill: 'Nhất Lệnh Thông Quân',
    text: 'Có thể chuyển bài Kế sách cho đồng đội ở bất kỳ đâu.',
    quote: 'Nhất lệnh ký xuất, chư quân tương ứng.',
    image: huongDao,
    bg: '#17386a',
    accent: '#9cc9f2',
  },
  {
    id: 'huong-dao-luc',
    role: 'Hướng Đạo',
    prefix: 'Quân',
    skill: 'Thông Giang Đạt Lộ',
    text: 'Có thể chuyển bài Kế sách cho đồng đội ở bất kỳ đâu.',
    quote: 'Tri thủy tắc thông, thức địa tắc đạt.',
    image: huongDaoLuc,
    bg: '#1a3a26',
    accent: '#cfe06a',
  },
]

export const byId = (id: string) => cards.find((c) => c.id === id)!
