import nhaBinh from '../assets/hero/reach/nha-binh.webp'
import thamQuan from '../assets/hero/reach/tham-quan.webp'
import nhaTuong from '../assets/hero/nha-tuong.webp'
import huongDao from '../assets/hero/reach/huong-dao.webp'
import truyenLenh from '../assets/hero/reach/truyen-lenh.webp'
import thuyenNhe from '../assets/hero/reach/thuyen-nhe.webp'

// Fingertips anchor around the sun; unfinished backs disappear beyond three edges.
export const heroCast = [
  { id: 'tham-quan', image: thamQuan, depth: 24, exit: -1, side: 'top', tip: [96.5, 26.8], angle: 30, hand: [-0.44, -0.06] },
  { id: 'nha-tuong', image: nhaTuong, depth: 32, exit: -1, side: 'left', tip: [97, 31.3], angle: -4, hand: [-0.55, -0.1] },
  { id: 'nha-binh', image: nhaBinh, depth: 40, exit: -1, side: 'left', tip: [95.6, 32.3], angle: -20, hand: [-0.45, 0.34] },
  { id: 'huong-dao-luc', image: huongDao, depth: 24, exit: 1, side: 'top', tip: [2.7, 32.3], angle: -30, hand: [0.44, -0.06] },
  { id: 'truyen-lenh-lam', image: truyenLenh, depth: 32, exit: 1, side: 'right', tip: [4.8, 28.1], angle: -8, hand: [0.55, 0.06] },
  { id: 'thuyen-nhe', image: thuyenNhe, depth: 40, exit: 1, side: 'right', tip: [2.7, 29], angle: 20, hand: [0.45, 0.34] },
]
