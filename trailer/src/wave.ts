import { noise2D } from '@remotion/noise'

export type Pt = [number, number]

// A travelling swell: two sines for the rolling crest plus noise so no two bands match.
export const swell = (x: number, t: number, o: { amp: number; len: number; speed: number; seed: string }) =>
  o.amp * Math.sin((x / o.len) * Math.PI * 2 + t * o.speed) +
  o.amp * 0.35 * Math.sin((x / (o.len * 0.47)) * Math.PI * 2 - t * o.speed * 1.7) +
  o.amp * 0.5 * noise2D(o.seed, x / (o.len * 1.6), t * 0.12)

export const line = (x0: number, x1: number, step: number, f: (x: number) => number): Pt[] => {
  const pts: Pt[] = []
  for (let x = x0; x <= x1 + 0.1; x += step) pts.push([x, f(x)])
  return pts
}

// Catmull-Rom through the samples, emitted as cubic Béziers for smooth SVG curves.
export const smooth = (pts: Pt[], move = true) => {
  let d = move ? `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}` : `L${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

// Ribbon of varying thickness: top edge forward, bottom edge back — the cover's brush-wave look.
export const ribbon = (top: Pt[], thick: (x: number, i: number) => number) => {
  const bottom = top.map(([x, y], i) => [x, y + thick(x, i)] as Pt).reverse()
  return `${smooth(top)} ${smooth(bottom, false)} Z`
}
