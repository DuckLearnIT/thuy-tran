import { Composition } from 'remotion'
import { BrushTest, BRUSH_FRAMES } from './brush/BrushTest'
import { Horizon, HORIZON_FRAMES } from './horizon/Horizon'
import { Museum, MUSEUM_FRAMES } from './museum/Museum'
import { DURATION, Trailer } from './Trailer'
import { FPS, H, W } from './theme'

export const Root: React.FC = () => (
  <>
    <Composition id="Trailer" component={Trailer} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="Museum" component={Museum} durationInFrames={MUSEUM_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Horizon" component={Horizon} durationInFrames={HORIZON_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="BrushTest" component={BrushTest} durationInFrames={BRUSH_FRAMES} fps={FPS} width={W} height={H} />
  </>
)
