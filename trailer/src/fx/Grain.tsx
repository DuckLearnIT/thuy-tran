import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { W, H } from '../theme'

// Per-frame film grain plus a warm vignette, laid over every scene.
export const Finish: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <>
      <AbsoluteFill style={{ background: 'radial-gradient(120% 95% at 50% 45%, transparent 58%, rgba(35,21,17,0.38) 100%)' }} />
      <AbsoluteFill style={{ mixBlendMode: 'overlay', opacity: 0.16 }}>
        <svg width={W} height={H}>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={frame % 23} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W} height={H} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  )
}
