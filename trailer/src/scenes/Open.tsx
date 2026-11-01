import { evolvePath } from '@remotion/paths'
import { Pie } from '@remotion/shapes'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Particles } from '../fx/Particles'
import { Stake, WaterBands, type Band } from '../fx/Water'
import { C, W, H, clamp, ease } from '../theme'
import { line, ribbon, smooth, type Pt } from '../wave'
import { noise2D } from '@remotion/noise'

const SUN = { x: 1210, y: 420, r: 190 }
const ring = (r: number) => `M${SUN.x - r},${SUN.y} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0`

const bands: Band[] = [
  { y: 700, amp: 6, len: 520, speed: 0.8, color: '#a9c9d6' },
  { y: 752, amp: 10, len: 640, speed: 1.0, color: '#6fa3c4', foam: 3 },
  { y: 830, amp: 16, len: 760, speed: 1.2, color: '#3f7fae', foam: 4 },
  { y: 940, amp: 24, len: 900, speed: 1.4, color: '#1f5684', foam: 6 },
]

// Stakes grouped by the band they stand in, so near piles overlap far water. [x, y, h, w, frame]
const stakes: [number, number, number, number, number][][] = [
  [[260, 710, 70, 22, 22], [430, 712, 52, 18, 26], [700, 708, 60, 20, 30], [1530, 712, 66, 20, 24], [1700, 710, 48, 16, 28]],
  [[150, 770, 150, 44, 32], [560, 772, 120, 38, 36], [1380, 770, 160, 46, 34], [1820, 774, 120, 36, 40]],
  [[330, 850, 280, 80, 42], [980, 856, 230, 70, 46], [1640, 852, 300, 86, 44]],
  [[90, 990, 520, 150, 50], [1840, 1000, 460, 140, 54]],
]

// Karst tower like the cover's cliffs: a noisy outline, plus a darker shadow facet
// made by squeezing the same outline toward its right flank.
const karst = (x: number, base: number, h: number, w: number, seed: string) => {
  const pts: Pt[] = []
  const n = 26
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1 - i / n)
    const px = x + Math.cos(a) * (w / 2) * (1 + 0.05 * noise2D(seed, i * 0.12, 0))
    const py = base - h * Math.pow(Math.sin(a), 0.55) * (0.95 + 0.05 * noise2D(seed, i * 0.15, 3))
    pts.push([px, py])
  }
  pts.unshift([x - w / 2, base])
  pts.push([x + w / 2, base])
  const right = x + w / 2
  const shade = pts.map(([px, py]) => [right - (right - px) * 0.42, py] as Pt)
  return { body: `${smooth(pts)} Z`, shade: `${smooth(shade)} Z` }
}

const cliffs = [
  { x: 170, h: 330, w: 220, tone: ['#8fb3c2', '#6f97ab'] },
  { x: 380, h: 220, w: 170, tone: ['#b3cad3', '#97b4c1'] },
  { x: 1580, h: 360, w: 240, tone: ['#8fb3c2', '#6f97ab'] },
  { x: 1770, h: 250, w: 180, tone: ['#b3cad3', '#97b4c1'] },
].map((c, i) => ({ ...c, ...karst(c.x, 722, c.h, c.w, `cliff${i}`) }))

// Nước & cọc: the sun is stamped like a seal, a vermilion brush crosses the paper,
// then the river rises and the piles break the surface one beat at a time.
export const Open: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const rise = spring({ frame, fps, config: { damping: 18, mass: 1.1 } })
  const sun = interpolate(frame, [4, 30], [0, 1], { ...clamp, easing: ease.out })
  const rings = interpolate(frame, [12, 44], [0, 1], { ...clamp, easing: ease.inOut })
  const brush = interpolate(frame, [6, 34], [0, 1], { ...clamp, easing: ease.out })
  const push = interpolate(frame, [0, 85], [1, 1.12], { easing: ease.inOut })
  const ripple = 0.028 + 0.006 * Math.sin(frame / 9)

  const brushTop = line(-100, W + 100, 60, x => 610 + 26 * Math.sin(x / 300) - x * 0.03)
  const brushPath = ribbon(brushTop, x => 4 + 34 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x + 100) / (W + 200)))) ** 1.4)

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '62% 58%' }}>
        <Img src={staticFile('art/paper.webp')} style={{ width: W, height: H, objectFit: 'cover' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <filter id="open-ripple" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency={`0.004 ${ripple}`} numOctaves={2} seed={7} />
              <feDisplacementMap in="SourceGraphic" scale={16} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <clipPath id="brush-reveal">
              <rect x={-100} y={0} width={(W + 200) * brush} height={H} />
            </clipPath>
          </defs>

          <g transform={`translate(${SUN.x - SUN.r} ${SUN.y - SUN.r + (1 - sun) * 60})`} opacity={Math.min(1, sun * 3)}>
            <Pie radius={SUN.r} progress={sun} closePath fill={C.sun} rotation={-Math.PI / 2} />
          </g>
          {[250, 310, 380].map((r, i) => {
            const ev = evolvePath(Math.max(0, Math.min(1, rings * 1.3 - i * 0.15)), ring(r))
            return <path key={r} d={ring(r)} fill="none" stroke={i === 1 ? C.vermilion : C.ochre} strokeWidth={i === 1 ? 3 : 2} opacity={0.7 - i * 0.15} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          })}

          {cliffs.map((c, i) => {
            const up = spring({ frame: frame - 6 - i * 3, fps, config: { damping: 16, mass: 1 } })
            return (
              <g key={i} opacity={0.95} transform={`translate(0 ${(1 - up) * (c.h + 40)})`}>
                <path d={c.body} fill={c.tone[0]} />
                <path d={c.shade} fill={c.tone[1]} />
              </g>
            )
          })}

          <path d={brushPath} fill={C.vermilion} clipPath="url(#brush-reveal)" opacity={0.92} />

          <g>
            {bands.map((band, i) => (
              <g key={i}>
                <g filter="url(#open-ripple)">
                  <WaterBands bands={[band]} seed={`open${i}`} lift={(1 - rise) * 420} />
                </g>
                {stakes[i].map(([x, y, h, w, at], j) => (
                  <Stake
                    key={x}
                    x={x}
                    y={y + (1 - rise) * 420 * (1 + i * 0.25)}
                    h={h}
                    w={w}
                    rise={spring({ frame: frame - at, fps, config: { damping: 11, mass: 0.7 } })}
                    lean={(i + j) % 2 ? 0.05 : -0.04}
                    dim={Math.max(0, 0.55 - i * 0.18)}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
        <Particles seed="open-spray" count={70} color={C.foam} size={[1.5, 4.5]} area={[0, 860, W, 1040]} drift={[0.8, -1.3]} opacity={0.75} start={40} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
