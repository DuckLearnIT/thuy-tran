import nhaTuong from '../assets/pieces/nha-tuong.glb?url'
import nhaBinh from '../assets/pieces/nha-binh.glb?url'
import thamQuan from '../assets/pieces/tham-quan.glb?url'
import thuyenNhe from '../assets/pieces/thuyen-nhe.glb?url'
import truyenLenh from '../assets/pieces/truyen-lenh-lam.glb?url'
import huongDao from '../assets/pieces/huong-dao-luc.glb?url'
import cocNgam from '../assets/pieces/coc-ngam.glb?url'
import doLuong from '../assets/pieces/do-luong.glb?url'
import maiPhuc from '../assets/pieces/mai-phuc.glb?url'
import nghiBinh from '../assets/pieces/nghi-binh.glb?url'
import { cards } from './cards'
import { strategies } from './strategies'

export type PieceAsset = { id: string; kind: 'character' | 'strategy'; name: string; model: string; slot: number; posters: string[] }
const posters = import.meta.glob('../assets/pieces/*-view-*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const entries = [
  ['nha-tuong', nhaTuong, 2], ['nha-binh', nhaBinh, 5], ['tham-quan', thamQuan, 6],
  ['thuyen-nhe', thuyenNhe, 11], ['truyen-lenh-lam', truyenLenh, 18], ['huong-dao-luc', huongDao, 21],
  ['coc-ngam', cocNgam, 3], ['do-luong', doLuong, 4], ['mai-phuc', maiPhuc, 19], ['nghi-binh', nghiBinh, 20],
] as const
export const pieces: PieceAsset[] = entries.map(([id, model, slot], i) => {
  const card = cards.find(card => card.id === id)
  return { id, model, slot, kind: i < 6 ? 'character' : 'strategy',
    name: card ? [card.prefix, card.role].filter(Boolean).join(' ') : strategies.find(card => card.id === id)!.name,
    posters: [0, 1, 2].map(view => posters[`../assets/pieces/${id}-view-${view}.webp`] ?? ''),
  }
})
