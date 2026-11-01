import { CameraMotionBlur } from '@remotion/motion-blur'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Particles } from '../fx/Particles'
import { Stake } from '../fx/Water'
import { C, W, H, clamp, ease } from '../theme'
import { Chip } from './Chip'

const SCALED_H = (W / 1080) * 1440 // cover shown full-bleed at frame width

// Tilt up the painted cover from the boats to the title, with foreground piles and
// drifting mist at faster parallax so the flat painting reads as deep space.
const Camera: React.FC = () => {
  const frame = useCurrentFrame()
  const p = interpolate(frame, [0, 74], [0, 1], { ...clamp, easing: ease.inOut })
  const ty = interpolate(p, [0, 1], [-(SCALED_H - H) + 30, 0])
  const scale = interpolate(p, [0, 1], [1.16, 1.0])
  const fg = (ty + (SCALED_H - H)) * 2.1
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: C.paper }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: '50% 40%' }}>
        <Img src={staticFile('art/cover.webp')} style={{ position: 'absolute', left: 0, top: ty, width: W, height: SCALED_H }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateY(${fg * 0.6}px)` }}>
        <div style={{ position: 'absolute', left: -200, right: -200, top: 380, height: 260, background: 'linear-gradient(180deg, transparent, rgba(246,233,215,0.75) 50%, transparent)', filter: 'blur(18px)' }} />
      </AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', transform: `translateY(${fg}px)` }}>
        <Stake x={140} y={1180} h={760} w={190} rise={1} lean={0.04} />
        <Stake x={1790} y={1240} h={860} w={220} rise={1} lean={-0.05} />
        <Stake x={1560} y={1500} h={520} w={150} rise={1} lean={0.03} />
      </svg>
    </AbsoluteFill>
  )
}

export const Cover: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const chip = spring({ frame: frame - 62, fps, config: { damping: 16 } })
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <CameraMotionBlur shutterAngle={200} samples={10}>
        <Camera />
      </CameraMotionBlur>
      <Particles seed="cover-mist" count={36} color={C.card} size={[2, 6]} area={[0, 300, W, H]} drift={[0.8, -1.2]} opacity={0.4} />
      <Chip text="BOARD GAME CHIẾN THUẬT" open={chip} letters={interpolate(frame, [66, 90], [0, 1], { ...clamp, easing: ease.out })} y={878} />
    </AbsoluteFill>
  )
}
