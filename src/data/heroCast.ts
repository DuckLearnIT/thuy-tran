import nhaBinh from '../assets/hero/nha-binh.webp'
import thamQuan from '../assets/hero/tham-quan.webp'
import nhaTuong from '../assets/hero/nha-tuong.webp'
import huongDao from '../assets/hero/huong-dao.webp'
import truyenLenh from '../assets/hero/truyen-lenh.webp'
import thuyenNhe from '../assets/hero/thuyen-nhe.webp'

// Back to front. The artwork is separate from the printed character cards.
export const heroCast = [
  { id: 'tham-quan', image: thamQuan, depth: 7, exit: -0.5 },
  { id: 'nha-tuong', image: nhaTuong, depth: 11, exit: 0.3 },
  { id: 'truyen-lenh-lam', image: truyenLenh, depth: 15, exit: 0.6 },
  { id: 'nha-binh', image: nhaBinh, depth: 20, exit: -0.8 },
  { id: 'thuyen-nhe', image: thuyenNhe, depth: 24, exit: -0.2 },
  { id: 'huong-dao-luc', image: huongDao, depth: 30, exit: 0.9 },
]
