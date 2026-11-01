import { loadFont } from '@remotion/google-fonts/Fraunces'
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { APEX, CX, H, W, groundD } from './draw'
import tl from './timeline.json'
import { worlds, type Ctx } from './worlds'

const { fontFamily } = loadFont('normal', { weights: ['400'], subsets: ['latin'] })
export const HORIZON_FRAMES = tl.frames
const [PAN_A, PAN_B] = tl.pan
const PAN = 620
const glide = Easing.bezier(0.65, 0, 0.35, 1)

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="hz-dawnsky" gradientUnits="userSpaceOnUse" x1="0" y1={APEX - 560} x2="0" y2={APEX}>
      <stop offset="0" stopColor="#2a4466" stopOpacity="0" />
      <stop offset="1" stopColor="#3b5a80" stopOpacity="1" />
    </linearGradient>
    <linearGradient id="hz-peach" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={APEX}>
      <stop offset="0" stopColor="#f8d9b4" />
      <stop offset="1" stopColor="#f2a488" />
    </linearGradient>
    <filter id="hz-blur40" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="40" /></filter>
    <filter id="hz-blur4"><feGaussianBlur stdDeviation="4" /></filter>
    <clipPath id="hz-ground"><path d={groundD()} /></clipPath>
  </defs>
)

// One world under the shared arc. The camera creeps in 3.5% about the apex during each shot;
// `dy` slides the whole world for the closing pan, `bare` drops its sky so a layer below shows.
const WorldLayer: React.FC<{ id: string; F: number; from: number; to: number; dy?: number; push?: boolean; bare?: boolean }> = ({ id, F, from, to, dy = 0, push = true, bare = false }) => {
  const world = worlds[id]
  const f = F - from
  const p = Math.min(1, Math.max(0, f / (to - from)))
  const ctx: Ctx = { f, p, t: F / tl.fps, s: n => n * 131 + Math.floor(F / 2) + 1 }
  const zoom = push ? 1 + 0.035 * p : 1
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      {!bare && <rect x={-200} y={-1400} width={W + 400} height={H + 2800} fill={world.bg} />}
      <g transform={`translate(0 ${dy}) translate(${CX} ${APEX}) scale(${zoom}) translate(${-CX} ${-APEX})`}>
        {id === 'dawn' && <rect x={-200} y={APEX - 560} width={W + 400} height={600} fill="url(#hz-dawnsky)" />}
        {world.draw(ctx)}
      </g>
    </svg>
  )
}

// Paper tooth over everything, re-seeded every two frames like the line boil.
const Grain: React.FC<{ F: number }> = ({ F }) => (
  <>
    <AbsoluteFill style={{ mixBlendMode: 'overlay', opacity: 0.22 }}>
      <svg width={W} height={H}>
        <filter id="hz-grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={Math.floor(F / 2) % 37} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width={W} height={H} filter="url(#hz-grain)" />
      </svg>
    </AbsoluteFill>
    <AbsoluteFill style={{ background: 'radial-gradient(125% 100% at 50% 55%, transparent 62%, rgba(0,0,0,0.28) 100%)' }} />
  </>
)

const Word: React.FC<{ text: string; color: string; age: number; size: number; y: number }> = ({ text, color, age, size, y }) => {
  const k = interpolate(age, [0, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y - size * 1.05, textAlign: 'center', fontFamily, fontSize: size, lineHeight: 1.2, letterSpacing: '-0.01em', color, opacity: k, transform: `translateY(${(1 - k) * 12}px)` }}>
      {text}
    </div>
  )
}

export const Horizon: React.FC = () => {
  const F = useCurrentFrame()
  const shot = tl.worlds.find(([, a, b]) => F >= (a as number) && F < (b as number)) ?? tl.worlds[0]
  const [id, from, to] = shot as [string, number, number]
  const pan = glide(Math.min(1, Math.max(0, (F - PAN_A) / (PAN_B - 1 - PAN_A))))
  const panning = F >= PAN_A
  const word = tl.words.find(([, a, b]) => F >= (a as number) && F < (b as number)) as [string, number, number] | undefined
  const [title, tFrom] = tl.title as [string, number, number]

  return (
    <AbsoluteFill style={{ background: '#0d1424' }}>
      <WorldLayer id={id} F={F} from={from} to={to} dy={panning ? -PAN * pan : 0} />
      {panning && <WorldLayer id="dawn" F={F} from={PAN_A} to={PAN_B} dy={PAN * (1 - pan)} push={false} bare />}
      {word && <Word text={word[0]} color={worlds[id].ink} age={F - word[1]} size={92} y={APEX - 22} />}
      {F >= tFrom && <Word text={title} color="#f4f1ea" age={F - tFrom} size={150} y={APEX - 150 - PAN * pan} />}
      <Grain F={F} />
      <Audio src={staticFile('audio/horizon.wav')} />
    </AbsoluteFill>
  )
}
