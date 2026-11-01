import { AbsoluteFill, Sequence } from 'remotion'
import { ShotBloom } from './ShotBloom'
import { ShotLobby } from './ShotLobby'
import { ShotPedestal } from './ShotPedestal'
import { ShotWriting } from './ShotWriting'

// Study of the first 15 s of "The Museum of What Could Be": four hard cuts, same timings.
export const MUSEUM_FRAMES = 450

export const Museum: React.FC = () => (
  <AbsoluteFill style={{ background: '#cfa595' }}>
    <Sequence durationInFrames={174}><ShotLobby /></Sequence>
    <Sequence from={174} durationInFrames={114}><ShotPedestal /></Sequence>
    <Sequence from={288} durationInFrames={60}><ShotWriting /></Sequence>
    <Sequence from={348} durationInFrames={102}><ShotBloom /></Sequence>
    <AbsoluteFill style={{ background: 'radial-gradient(130% 100% at 50% 45%, transparent 60%, rgba(70,40,50,0.28) 100%)', pointerEvents: 'none' }} />
  </AbsoluteFill>
)
