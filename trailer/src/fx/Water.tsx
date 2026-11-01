import { useCurrentFrame } from 'remotion'
import { C, W, H } from '../theme'
import { line, smooth, swell } from '../wave'

export type Band = { y: number; amp: number; len: number; speed: number; color: string; foam?: number }

// Layered swells filled to the bottom edge; each crest carries broken foam strokes like the cover art.
export const WaterBands: React.FC<{ bands: Band[]; seed: string; lift?: number; t?: number; width?: number }> = ({ bands, seed, lift = 0, t, width = W }) => {
  const frame = useCurrentFrame()
  const time = t ?? frame / 30
  return (
    <g>
      {bands.map((b, i) => {
        const pts = line(-80, width + 80, 40, x => b.y + lift * (1 + i * 0.25) + swell(x, time, { amp: b.amp, len: b.len, speed: b.speed, seed: `${seed}-${i}` }))
        const d = `${smooth(pts)} L${width + 80},${H + 400} L-80,${H + 400} Z`
        const crest = smooth(pts.map(([x, y]) => [x, y + 10] as [number, number]))
        return (
          <g key={i}>
            <path d={d} fill={b.color} />
            {b.foam ? (
              <path d={crest} fill="none" stroke={C.foam} strokeWidth={b.foam} strokeLinecap="round" strokeDasharray="140 60 40 90 220 70" strokeDashoffset={-time * 60 * (1 + i * 0.3)} opacity={0.85} />
            ) : null}
          </g>
        )
      })}
    </g>
  )
}

// Low-poly stake: two lit facets meeting at a ridge, the way the cover paints the piles.
export const Stake: React.FC<{ x: number; y: number; h: number; w: number; rise: number; lean?: number; dim?: number }> = ({ x, y, h, w, rise, lean = 0, dim = 0 }) => {
  if (rise <= 0.001) return null
  const top = y - h * rise
  const tip: [number, number] = [x + lean * h * rise, top]
  const mid = x + w * 0.14
  const light = mix(C.woodLight, '#9fb3c4', dim)
  const dark = mix(C.woodDark, '#5f7487', dim)
  return (
    <g>
      <polygon points={`${tip} ${x - w / 2},${y} ${mid},${y}`} fill={light} />
      <polygon points={`${tip} ${mid},${y} ${x + w / 2},${y}`} fill={dark} />
      <ellipse cx={x} cy={y + 2} rx={w * (0.7 + 0.5 * rise)} ry={w * 0.16} fill="none" stroke={C.foam} strokeWidth={3} opacity={0.7 * rise} />
    </g>
  )
}

export const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}
