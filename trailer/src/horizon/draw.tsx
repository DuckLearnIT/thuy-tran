import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'
import type { Drawable } from 'roughjs/bin/core'

// Fixed horizon: every world shares this arc, apex at 2/3 height, so cuts match on the curve.
export const W = 1920, H = 1080, CX = 960, APEX = 700, R = 2600, CY = APEX + R
export type Pt = [number, number]

export const arcY = (x: number, off = 0) => CY - Math.sqrt((R + off) ** 2 - (x - CX) ** 2)
export const tilt = (x: number, off = 0) => Math.asin((x - CX) / (R + off))
export const arcPts = (off = 0, step = 64, x0 = -80, x1 = W + 80): Pt[] => {
  const pts: Pt[] = []
  for (let x = x0; x <= x1 + 0.1; x += step) pts.push([x, arcY(x, off)])
  return pts
}
export const poly = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')
export const arcD = (off = 0, step = 64) => poly(arcPts(off, step))
export const groundD = (off = 0, step = 64) => `${arcD(off, step)} L${W + 80},${H + 80} L-80,${H + 80} Z`
// Point `d` px out along the arc's outward normal, from the arc at x (offset `off`).
export const normalAt = (x: number, off: number, d: number): Pt => {
  const th = tilt(x, off), r = R + off + d
  return [CX + r * Math.sin(th), CY - r * Math.cos(th)]
}

// Rough.js renders strokes and crayon hatching as plain SVG paths, seeded so renders repeat.
const gen = rough.generator()
export type O = Options & { dash?: string; opacity?: number; blend?: string }
const base: Options = { roughness: 1.3, bowing: 0.8, strokeWidth: 3, stroke: '#2b2220', hachureGap: 8, hachureAngle: -41, fillWeight: 1.7 }

const paths = (dr: Drawable, o: O, key: string | number) => (
  <g key={key} opacity={o.opacity} style={o.blend ? { mixBlendMode: o.blend as React.CSSProperties['mixBlendMode'] } : undefined}>
    {gen.toPaths(dr).map((p, i) => (
      <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? 'none'} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={o.dash} />
    ))}
  </g>
)
const opt = (o: O): Options => {
  const { dash: _d, opacity: _o, blend: _b, ...rest } = o
  return { ...base, ...rest }
}

export const rp = (d: string, o: O, key: string | number = 'p') => paths(gen.path(d, opt(o)), o, key)
export const rc = (x: number, y: number, diam: number, o: O, key: string | number = 'c') => paths(gen.circle(x, y, diam, opt(o)), o, key)
export const re = (x: number, y: number, w: number, h: number, o: O, key: string | number = 'e') => paths(gen.ellipse(x, y, w, h, opt(o)), o, key)
export const rl = (x1: number, y1: number, x2: number, y2: number, o: O, key: string | number = 'l') => paths(gen.line(x1, y1, x2, y2, opt(o)), o, key)
export const rpoly = (pts: Pt[], o: O, key: string | number = 'g') => paths(gen.polygon(pts, opt(o)), o, key)
export const rcurve = (pts: Pt[], o: O, key: string | number = 'v') => paths(gen.curve(pts, opt(o)), o, key)
