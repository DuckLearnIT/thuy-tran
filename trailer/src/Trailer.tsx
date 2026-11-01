import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { AbsoluteFill } from 'remotion'
import './fonts'
import { Finish } from './fx/Grain'
import { tideWipe } from './fx/TideWipe'
import { Cast } from './scenes/Cast'
import { Cover } from './scenes/Cover'
import { Open } from './scenes/Open'
import { Outro } from './scenes/Outro'
import { Pieces3D } from './scenes/Pieces3D'
import { Places3D } from './scenes/Places3D'
import { ease } from './theme'

// 85+115+115+105+60+70 = 550 frames, minus five 20-frame tide wipes = 450 (15 s).
const scenes = [
  { C: Open, d: 85 },
  { C: Cover, d: 115 },
  { C: Cast, d: 115 },
  { C: Pieces3D, d: 105 },
  { C: Places3D, d: 60 },
  { C: Outro, d: 70 },
]
export const TRANSITION = 20
export const DURATION = scenes.reduce((s, x) => s + x.d, 0) - TRANSITION * (scenes.length - 1)

export const Trailer: React.FC = () => (
  <AbsoluteFill style={{ background: '#ecdcc0' }}>
    <TransitionSeries>
      {scenes.flatMap(({ C, d }, i) => [
        ...(i ? [<TransitionSeries.Transition key={`t${i}`} presentation={tideWipe()} timing={linearTiming({ durationInFrames: TRANSITION, easing: ease.inOut })} />] : []),
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={d}>
          <C />
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
    <Finish />
  </AbsoluteFill>
)
