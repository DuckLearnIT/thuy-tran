import nhaBinh from '../assets/hero/reach/nha-binh.webp'
import thamQuan from '../assets/hero/reach/tham-quan.webp'
import nhaTuong from '../assets/hero/reach/nha-tuong.webp'
import huongDao from '../assets/hero/reach/huong-dao.webp'
import truyenLenh from '../assets/hero/reach/truyen-lenh.webp'
import thuyenNhe from '../assets/hero/reach/thuyen-nhe.webp'

// Hand anchors keep all six gestures aimed at the sun as the viewport changes.
export const heroCast = [
  { id: 'tham-quan', image: thamQuan, depth: 3, exit: -0.7, side: 'left', tip: [96.5, 26.8], angle: 35, hand: [44, 28] },
  { id: 'nha-tuong', image: nhaTuong, depth: 4, exit: -0.5, side: 'left', tip: [91.7, 36.7], angle: 0, hand: [41, 38.3] },
  { id: 'nha-binh', image: nhaBinh, depth: 5, exit: -0.9, side: 'left', tip: [95.6, 32.3], angle: -35, hand: [44, 48.6] },
  { id: 'huong-dao-luc', image: huongDao, depth: 3, exit: 0.7, side: 'right', tip: [2.7, 32.3], angle: -35, hand: [56, 28] },
  { id: 'truyen-lenh-lam', image: truyenLenh, depth: 4, exit: 0.5, side: 'right', tip: [4.8, 28.1], angle: 0, hand: [59, 38.3] },
  { id: 'thuyen-nhe', image: thuyenNhe, depth: 5, exit: 0.9, side: 'right', tip: [2.7, 29], angle: 35, hand: [56, 48.6] },
]
