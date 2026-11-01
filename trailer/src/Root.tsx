import { Composition } from 'remotion'
import { Museum, MUSEUM_FRAMES } from './museum/Museum'
import { DURATION, Trailer } from './Trailer'
import { FPS, H, W } from './theme'

export const Root: React.FC = () => (
  <>
    <Composition id="Trailer" component={Trailer} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="Museum" component={Museum} durationInFrames={MUSEUM_FRAMES} fps={FPS} width={W} height={H} />
  </>
)
