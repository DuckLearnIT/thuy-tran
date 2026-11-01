import { evolvePath } from '@remotion/paths'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Particles } from '../fx/Particles'
import { Stake, WaterBands } from '../fx/Water'
import { C, W, H, clamp, ease, font } from '../theme'
import { line, ribbon } from '../wave'
import { Chip } from './Chip'

const TITLE = 'Thủy Trận'

// End card: the sun rises behind the title, brush-waves wrap it like the box cover,
// then the pre-order chip and address settle for a clean hold.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sun = spring({ frame, fps, config: { damping: 22, mass: 1.2 } })
  const waves = interpolate(frame, [6, 34], [0, 1], { ...clamp, easing: ease.inOut })
  const sub = interpolate(frame, [22, 40], [0, 1], { ...clamp, easing: ease.out })
  const chip = spring({ frame: frame - 30, fps, config: { damping: 16 } })
  const url = interpolate(frame, [42, 56], [0, 1], { ...clamp, easing: ease.out })
  const t = Math.min(frame, 60) / 30 // the brush-waves come to rest for the hold

  const band = (y: number, amp: number, phase: number, th: number) =>
    ribbon(line(-60, W + 60, 48, x => y + amp * Math.sin(x / 210 + phase + t * 1.4) + amp * 0.4 * Math.sin(x / 90 - t)), x => th * (0.35 + 0.65 * Math.abs(Math.sin(x / 260 + phase))))
  const rule = (d: string) => evolvePath(sub, d)
  const leftRule = 'M500,632 L690,632', rightRule = 'M1420,632 L1230,632'

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <Img src={staticFile('art/paper.webp')} style={{ width: W, height: H, objectFit: 'cover' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id="outro-waves">
            <rect x={W / 2 - (W / 2 + 80) * waves} y={0} width={(W + 160) * waves} height={H} />
          </clipPath>
        </defs>
        <circle cx={W / 2} cy={420 + (1 - sun) * 380} r={250} fill={C.sun} opacity={Math.min(1, sun * 1.5)} />
        <g clipPath="url(#outro-waves)">
          <path d={band(520, 22, 0, 40)} fill={C.indigo} opacity={0.92} />
          <path d={band(548, 16, 1.4, 14)} fill={C.foam} />
          <path d={band(574, 18, 2.6, 26)} fill="#2f6f9a" />
        </g>
        <WaterBands seed="outro" t={t} bands={[
          { y: 985, amp: 10, len: 700, speed: 1, color: '#6fa3c4', foam: 3 },
          { y: 1035, amp: 14, len: 900, speed: 1.3, color: '#1f5684', foam: 4 },
        ]} />
        <Stake x={180} y={995} h={210} w={62} rise={spring({ frame: frame - 18, fps, config: { damping: 12 } })} lean={0.04} />
        <Stake x={1730} y={1000} h={260} w={74} rise={spring({ frame: frame - 24, fps, config: { damping: 12 } })} lean={-0.05} />
        {[leftRule, rightRule].map(d => {
          const ev = rule(d)
          return <path key={d} d={d} stroke={C.vermilion} strokeWidth={3} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        })}
      </svg>
      <Particles seed="outro-dust" count={40} color={C.ochre} size={[1.5, 3.5]} area={[200, 150, 1720, 900]} drift={[0.3, -0.8]} opacity={0.5} />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: font.display, fontSize: 250, lineHeight: 1.2, color: C.indigo, whiteSpace: 'nowrap' }}>
        {[...TITLE].map((ch, i) => {
          const k = spring({ frame: frame - 8 - i * 2.2, fps, config: { damping: 12, mass: 0.7 } })
          return (
            <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * -120}px) rotate(${(1 - k) * -14}deg)`, transformOrigin: '50% 100%' }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          )
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', fontFamily: font.body, fontWeight: 700, fontSize: 40, letterSpacing: '0.6em', paddingLeft: '0.6em', color: C.vermilion, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
        BẠCH ĐẰNG
      </div>
      <Chip text="ĐẶT TRƯỚC · 599.000₫" open={chip} letters={interpolate(frame, [34, 52], [0, 1], { ...clamp, easing: ease.out })} y={712} size={38} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 838, textAlign: 'center', fontFamily: font.body, fontSize: 30, letterSpacing: '0.18em', color: C.ink, opacity: url }}>
        thuy-tran.pages.dev
      </div>
    </AbsoluteFill>
  )
}
