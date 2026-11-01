import { Composition } from 'remotion'
import { DURATION, Trailer } from './Trailer'
import { FPS, H, W } from './theme'

export const Root: React.FC = () => (
  <Composition id="Trailer" component={Trailer} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
)
