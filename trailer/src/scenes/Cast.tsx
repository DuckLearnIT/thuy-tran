import { CameraMotionBlur } from '@remotion/motion-blur'
import { evolvePath } from '@remotion/paths'
import { Pie } from '@remotion/shapes'
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { WaterBands } from '../fx/Water'
import { C, W, H, clamp, ease, font } from '../theme'

// Role names follow src/data/cards.ts; files are the full-body cut-outs from the hero.
const cast = [
  { file: 'huong-dao', role: 'Hướng Đạo', x: 300, h: 700, delay: 0, z: 0, head: [24, 0.13] },
  { file: 'thuyen-nhe', role: 'Thuyền Nhẹ', x: 560, h: 760, delay: 6, z: 1, head: [26, 0.07] },
  { file: 'nha-binh', role: 'Nha Binh', x: 805, h: 800, delay: 12, z: 2, head: [10, 0.06] },
  { file: 'nha-tuong', role: 'Nha Tướng', x: 1065, h: 900, delay: 30, z: 5, head: [-10, 0.13] },
  { file: 'tham-quan', role: 'Thám Quân', x: 1330, h: 800, delay: 18, z: 3, head: [0, 0.06] },
  { file: 'truyen-lenh', role: 'Truyền Lệnh', x: 1590, h: 740, delay: 24, z: 1, head: [18, 0.08] },
] as const
const FEET = 1010
const SUN = { x: 1065, y: 470, r: 330 }
const LAND = 30 + 12 // Nha Tướng touches down

const Stage: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sun = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: ease.out })
  const quake = Math.max(0, 1 - (frame - LAND) / 10) * (frame >= LAND ? 1 : 0)
  const shakeX = (random(`sx${frame}`) - 0.5) * 22 * quake
  const shakeY = (random(`sy${frame}`) - 0.5) * 14 * quake
  const push = interpolate(frame, [0, 115], [1, 1.06])
  const ordered = [...cast].sort((a, b) => a.z - b.z)

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: C.paper }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${push})`, transformOrigin: '55% 60%' }}>
        <Img src={staticFile('art/paper.webp')} style={{ width: W, height: H, objectFit: 'cover' }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(${SUN.x - SUN.r} ${SUN.y - SUN.r})`}>
            <Pie radius={SUN.r} progress={sun} closePath fill={C.sun} rotation={Math.PI / 2} />
          </g>
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r + 40} fill="none" stroke={C.ochre} strokeWidth={2} strokeDasharray="2 14" opacity={0.8 * sun} transform={`rotate(${frame * 0.6} ${SUN.x} ${SUN.y})`} />
          {[0, 6].map(lag => {
            const k = interpolate(frame, [LAND + lag, LAND + lag + 26], [0, 1], { ...clamp, easing: ease.out })
            return k > 0 && k < 1 ? <circle key={lag} cx={SUN.x} cy={SUN.y} r={SUN.r + k * 520} fill="none" stroke={lag ? C.ochre : C.vermilion} strokeWidth={10 * (1 - k)} opacity={1 - k} /> : null
          })}
          <WaterBands seed="cast-back" bands={[{ y: 860, amp: 10, len: 700, speed: 1, color: '#6fa3c4', foam: 3 }]} />
        </svg>

        {ordered.map(c => {
          const s = spring({ frame: frame - c.delay, fps, config: { damping: 15, mass: 0.85 } })
          const w = c.h / 2
          const x = c.x + (1 - s) * -1500
          const arc = -Math.sin(Math.min(1, s) * Math.PI) * 110
          return (
            <Img key={c.file} src={staticFile(`art/cast/${c.file}.webp`)} style={{
              position: 'absolute', left: x - w / 2, top: FEET - c.h + arc, width: w, height: c.h,
              transform: `rotate(${(1 - s) * -12}deg)`, transformOrigin: '50% 100%', opacity: s > 0.02 ? 1 : 0,
            }} />
          )
        })}

        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <WaterBands seed="cast-front" bands={[
            { y: 935, amp: 14, len: 820, speed: 1.2, color: '#3f7fae', foam: 4 },
            { y: 1005, amp: 18, len: 980, speed: 1.5, color: '#1f5684', foam: 5 },
          ]} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// Names hang from vermilion threads drawn down to each head once the figure lands.
const Labels: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {cast.map((c, i) => {
          const lead = c.file === 'nha-tuong'
          const y = lead ? 92 : i % 2 ? 222 : 160
          const head = FEET - c.h + c.h * c.head[1]
          const d = `M${c.x},${y + 18} L${c.x + c.head[0]},${head}`
          const k = interpolate(frame, [c.delay + 16, c.delay + 30], [0, 1], { ...clamp, easing: ease.inOut })
          const ev = evolvePath(k, d)
          return (
            <g key={c.file}>
              <path d={d} stroke={C.vermilion} strokeWidth={lead ? 3 : 2} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
              <circle cx={c.x + c.head[0]} cy={head} r={lead ? 7 : 5} fill={C.vermilion} opacity={k >= 1 ? 1 : 0} />
            </g>
          )
        })}
      </svg>
      {cast.map((c, i) => {
        const lead = c.file === 'nha-tuong'
        const y = lead ? 92 : i % 2 ? 222 : 160
        const size = lead ? 76 : 50
        const k = interpolate(frame, [c.delay + 12, c.delay + 24], [0, 1], { ...clamp, easing: ease.out })
        return (
          <div key={c.file} style={{ position: 'absolute', left: c.x, top: y - size * 1.05, transform: 'translateX(-50%)', overflow: 'hidden', padding: '0 8px' }}>
            <div style={{ fontFamily: font.display, fontSize: size, lineHeight: 1.3, color: lead ? C.vermilion : C.ink, whiteSpace: 'nowrap', transform: `translateY(${(1 - k) * 110}%)` }}>{c.role}</div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

export const Cast: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <CameraMotionBlur shutterAngle={180} samples={10}>
      <Stage />
    </CameraMotionBlur>
    <Labels />
  </AbsoluteFill>
)
