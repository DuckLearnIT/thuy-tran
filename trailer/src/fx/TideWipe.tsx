import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { noise2D } from '@remotion/noise'
import { AbsoluteFill } from 'remotion'
import { C, W, H } from '../theme'
import { smooth, type Pt } from '../wave'

type Props = Record<string, never>

// The one transition of the film: a slanted tide front sweeps left→right, trailing
// vermilion, foam and indigo ribbons, and the next scene rides in behind it.
const edge = (p: number, offset: number, seed: string): Pt[] => {
  const pts: Pt[] = []
  const X = -420 + (W + 840) * p
  for (let y = -60; y <= H + 60; y += 45) {
    pts.push([X + offset + (y - H / 2) * 0.28 + 70 * Math.sin(y * 0.007 + p * 7 + offset * 0.01) + 45 * noise2D(seed, y * 0.004, p * 3), y])
  }
  return pts
}

const TideWipe: React.FC<TransitionPresentationComponentProps<Props>> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === 'exiting') {
    // Overscale stays ahead of the drift so no edge of the frame is ever exposed.
    return <AbsoluteFill style={{ transform: `translateX(${-p * 60}px) scale(${1 + p * 0.08})` }}>{children}</AbsoluteFill>
  }
  const front = edge(p, 0, 'tide')
  const clip = `M-200,-200 ${smooth(front).replace(/^M/, 'L')} L-200,${H + 200} Z`
  const strip = (offset: number, width: number, color: string, opacity = 1) => (
    <path d={smooth(edge(p, offset, 'tide'))} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} />
  )
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `path('${clip}')` }}>
        <AbsoluteFill style={{ transform: `scale(${1 + (1 - p) * 0.1})`, transformOrigin: '0% 50%' }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {strip(18, 46, C.indigo)}
        {strip(4, 16, C.foam)}
        {strip(52, 26, C.vermilion)}
        {strip(84, 8, C.ochre, 0.9)}
        {strip(130, 4, C.foam, 0.6)}
      </svg>
    </AbsoluteFill>
  )
}

export const tideWipe = (): TransitionPresentation<Props> => ({ component: TideWipe, props: {} })
