import { loadFont } from '@remotion/google-fonts/Fraunces'
import { useLayoutEffect, useRef } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { poly, re, rl, rp } from '../horizon/draw'
import { blob, crayon, ink, paper, wobble, type P } from './brush'

const { fontFamily } = loadFont('normal', { weights: ['400'], subsets: ['latin'] })
export const BRUSH_FRAMES = 96
const HALF = 960, GY = 780, CX = 480
const C = { body: '#7cc6a4', dark: '#3f8a6b', light: '#c9eedb', leaf: '#5fb35a', leafDark: '#2f7a3a', ink: '#2b2220' }

// Shared animation for both renderers: breathe, anticipate, hop, land, blink, smile.
const pose = (f: number) => {
  const hop = f >= 30 && f < 46 ? Math.sin((Math.PI * (f - 30)) / 16) : 0
  const squash = f >= 22 && f < 30 ? Math.sin((Math.PI * (f - 22)) / 8) : f >= 46 && f < 62 ? Math.exp(-(f - 46) / 4) * Math.cos((f - 46) * 0.55) : 0
  const sy = 1 + 0.015 * Math.sin(f / 5) - 0.14 * squash + 0.1 * hop
  return { y: -150 * hop, sx: 1 / Math.sqrt(sy), sy, air: hop > 0.05, blink: f === 66 || f === 67, happy: f >= 74, leaf: Math.sin(f / 6) * 0.08 - 0.35 * hop + 0.25 * squash }
}
type Pose = ReturnType<typeof pose>

// Character in local space: origin at the feet, +y down. `tf` applies squash/stretch about the feet.
const rig = (p: Pose) => {
  const tf = ([x, y]: P): P => [CX + x * p.sx, GY + p.y + y * p.sy]
  const body = blob(0, -175, 150, 108).map(tf)
  const leg = (x: number): P[] => [tf([x, -72]), tf([x + (p.air ? -6 : 0), p.air ? -18 : 0])]
  const eye = (s: number): P => tf([s * 52, -190])
  const stem: P[] = [[0, -282], [6, -310], [2, -336]].map(q => tf(q as P))
  const leafPts = (dir: number): P[] => {
    const base = stem[2], ang = -Math.PI / 2 + dir * (0.95 + p.leaf * dir)
    return Array.from({ length: 40 }, (_, i) => {
      const t = i < 20 ? i / 19 : (39 - i) / 19, side = i < 20 ? 1 : -1
      const along = 70 * t, across = side * 22 * Math.sin(Math.PI * t) ** 0.8
      return [base[0] + Math.cos(ang) * along - Math.sin(ang) * across, base[1] + Math.sin(ang) * along + Math.cos(ang) * across] as P
    })
  }
  return { body, legs: [-92, -36, 36, 92].map(leg), eyes: [eye(-1), eye(1)], stem, leaves: [leafPts(-1), leafPts(1)] }
}

// Left: the current approach - SVG paths through roughjs, flat fills with hachure on top.
const VectorHalf: React.FC<{ f: number }> = ({ f }) => {
  const p = pose(f), g = rig(p), s = (n: number) => n * 131 + Math.floor(f / 2) + 1
  const lift = Math.min(1, -p.y / 150)
  return (
    <svg width={HALF} height={1080} style={{ position: 'absolute', left: 0 }}>
      <rect width={HALF} height={1080} fill="#ebe9e3" />
      <ellipse cx={CX} cy={GY + 4} rx={170 * (1 - 0.35 * lift)} ry={12} fill="#2b2220" opacity={0.12 * (1 - 0.5 * lift)} />
      {rl(60, GY, 900, GY, { stroke: '#8d8a84', strokeWidth: 2, roughness: 0.8, seed: s(1) }, 'ground')}
      {g.legs.map(([a, b], i) => rl(a[0], a[1], b[0], b[1], { stroke: C.ink, strokeWidth: 7, seed: s(10 + i) }, `leg${i}`))}
      {rp(poly(g.body) + ' Z', { stroke: C.ink, strokeWidth: 4, fill: C.body, fillStyle: 'hachure', hachureGap: 6, fillWeight: 2, seed: s(2) }, 'body')}
      {rp(poly(g.stem), { stroke: C.ink, strokeWidth: 4, seed: s(3) }, 'stem')}
      {g.leaves.map((l, i) => rp(poly(l) + ' Z', { stroke: C.ink, strokeWidth: 3, fill: C.leaf, fillStyle: 'hachure', hachureGap: 5, seed: s(20 + i) }, `leaf${i}`))}
      {g.eyes.map(([x, y], i) => p.happy
        ? rp(`M${x - 13},${y + 5} Q${x},${y - 14} ${x + 13},${y + 5}`, { stroke: C.ink, strokeWidth: 4, seed: s(30 + i) }, `eye${i}`)
        : p.blink ? rl(x - 12, y, x + 12, y, { stroke: C.ink, strokeWidth: 4, seed: s(30 + i) }, `eye${i}`)
        : re(x, y, 17, 27, { stroke: C.ink, fill: C.ink, fillStyle: 'solid', strokeWidth: 2, seed: s(30 + i) }, `eye${i}`))}
    </svg>
  )
}

// Right: raster brush engine on canvas - pressure ink, crayon hatching, edge pooling, paper tooth.
const RasterHalf: React.FC<{ f: number }> = ({ f }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    const p = pose(f), boil = Math.floor(f / 2) * 7919
    const j = (pts: P[], amp: number, k: number) => wobble(pts, amp, boil + k)
    const g = rig(p)
    const lift = Math.min(1, -p.y / 150)
    paper(ctx, HALF, 1080)
    ctx.save()
    ctx.filter = 'blur(10px)'
    ctx.globalAlpha = 0.28 * (1 - 0.5 * lift)
    ctx.fillStyle = C.ink
    ctx.beginPath()
    ctx.ellipse(CX, GY + 4, 175 * (1 - 0.35 * lift), 13, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ink(ctx, Array.from({ length: 60 }, (_, i) => [60 + i * 14.2, GY + Math.sin(i * 0.7 + boil) * 0.8] as P), { w: 2.2, color: '#8d8a84', seed: boil + 2, passes: 1 })
    g.legs.forEach(([a, b], i) => ink(ctx, [a, [(a[0] + b[0]) / 2 + 1.5, (a[1] + b[1]) / 2], b], { w: 8, color: C.ink, seed: boil + 10 + i }))
    const body = j(g.body, 2.2, 3)
    crayon(ctx, body, { base: C.body, dark: C.dark, light: C.light, seed: boil + 4 })
    ink(ctx, body, { w: 5, color: C.ink, seed: boil + 5, closed: true })
    ink(ctx, g.stem, { w: 5, color: C.ink, seed: boil + 6 })
    g.leaves.forEach((l, i) => {
      const leaf = j(l, 1.2, 20 + i)
      crayon(ctx, leaf, { base: C.leaf, dark: C.leafDark, light: '#bfe8a8', seed: boil + 21 + i, angle: 0.6, gap: 4 })
      ink(ctx, leaf, { w: 3.6, color: C.ink, seed: boil + 23 + i, closed: true })
      ink(ctx, [leaf[0], leaf[10], leaf[19]], { w: 2, color: C.leafDark, seed: boil + 25 + i })
    })
    g.eyes.forEach(([x, y], i) => {
      if (p.happy) ink(ctx, [[x - 14, y + 6], [x - 6, y - 6], [x, y - 9], [x + 6, y - 6], [x + 14, y + 6]], { w: 5, color: C.ink, seed: boil + 30 + i })
      else if (p.blink) ink(ctx, [[x - 13, y], [x, y + 1], [x + 13, y]], { w: 5, color: C.ink, seed: boil + 30 + i })
      else {
        const eye = j(blob(x, y, 9, 14, 2.4, 40), 0.6, 30 + i)
        ctx.fillStyle = C.ink
        ctx.beginPath()
        eye.forEach(([ex, ey], k) => (k ? ctx.lineTo(ex, ey) : ctx.moveTo(ex, ey)))
        ctx.fill()
        ctx.fillStyle = '#f4f1ea'
        ctx.beginPath()
        ctx.arc(x + 3, y - 6, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }, [f])
  return <canvas ref={ref} width={HALF} height={1080} style={{ position: 'absolute', left: HALF }} />
}

export const BrushTest: React.FC = () => {
  const f = useCurrentFrame()
  const label = (text: string, left: number) => (
    <div style={{ position: 'absolute', left, width: HALF, top: 60, textAlign: 'center', fontFamily, fontSize: 40, color: '#2b2220' }}>{text}</div>
  )
  return (
    <AbsoluteFill style={{ background: '#ebe9e3' }}>
      <VectorHalf f={f} />
      <RasterHalf f={f} />
      <div style={{ position: 'absolute', left: HALF - 1, top: 0, width: 2, height: 1080, background: '#2b2220', opacity: 0.25 }} />
      {label('SVG + roughjs (hiện tại)', 0)}
      {label('Bút raster trên canvas', HALF)}
    </AbsoluteFill>
  )
}
