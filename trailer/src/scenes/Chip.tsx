import { C, font } from '../theme'

// The site's cut-corner vermilion chip; it unrolls from the centre, then letters rise in.
export const Chip: React.FC<{ text: string; open: number; letters: number; y: number; size?: number }> = ({ text, open, letters, y, size = 34 }) => {
  const chars = [...text]
  return (
    <div style={{
      position: 'absolute', left: '50%', top: y, transform: `translateX(-50%) scaleX(${open})`,
      background: C.vermilion, padding: `${size * 0.5}px ${size * 1.6}px`, opacity: open > 0.01 ? 1 : 0,
      clipPath: 'polygon(0 0,96% 0,100% 50%,96% 100%,0 100%,4% 50%)',
    }}>
      <div style={{ fontFamily: font.body, fontWeight: 700, fontSize: size, letterSpacing: '0.32em', color: C.card, whiteSpace: 'nowrap' }}>
        {chars.map((ch, i) => {
          const k = Math.min(1, Math.max(0, letters * (chars.length + 6) - i) / 6)
          return <span key={i} style={{ display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 0.7 * size}px)` }}>{ch === ' ' ? ' ' : ch}</span>
        })}
      </div>
    </div>
  )
}
