// Raster "brush engine" for canvas: strokes and fills are built from many small marks with
// seeded jitter, so surfaces read as crayon on paper rather than flat vector shapes.
export type P = [number, number]

export const rng = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// Rounded box as a superellipse; m≈4 gives soft corners that are never quite even.
export const blob = (cx: number, cy: number, a: number, b: number, m = 4.2, n = 180): P[] =>
  Array.from({ length: n }, (_, i) => {
    const th = (i / n) * Math.PI * 2
    const c = Math.cos(th), s = Math.sin(th)
    return [cx + a * Math.sign(c) * Math.abs(c) ** (2 / m), cy + b * Math.sign(s) * Math.abs(s) ** (2 / m)]
  })

// Low-frequency wobble along the outline's normal: a hand never draws the same box twice.
export const wobble = (pts: P[], amp: number, seed: number): P[] => {
  const r = rng(seed)
  const waves = [0, 1, 2].map(k => ({ f: 2 + k * 3 + Math.floor(r() * 3), ph: r() * 6.28, a: amp / (1 + k) }))
  const n = pts.length
  return pts.map(([x, y], i) => {
    const [px, py] = pts[(i - 1 + n) % n], [nx, ny] = pts[(i + 1) % n]
    const tx = nx - px, ty = ny - py, len = Math.hypot(tx, ty) || 1
    const d = waves.reduce((s, w) => s + w.a * Math.sin((i / n) * Math.PI * 2 * w.f + w.ph), 0)
    return [x + (-ty / len) * d, y + (tx / len) * d]
  })
}

const trace = (ctx: CanvasRenderingContext2D, pts: P[], closed = true) => {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  if (closed) ctx.closePath()
}

// Ink line with pen pressure: swells mid-stroke, tapers at the ends, overshoots a little,
// and a second faint pass slightly off the first, like a re-inked line.
// Subdivide so pressure varies smoothly even along a two-point line.
const resample = (pts: P[], step = 4): P[] => {
  const out: P[] = [pts[0]]
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step))
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
  }
  return out
}

export const ink = (ctx: CanvasRenderingContext2D, pts: P[], o: { w: number; color: string; seed: number; closed?: boolean; passes?: number }) => {
  const r = rng(o.seed)
  const path = resample(o.closed ? [...pts, pts[0], pts[1]] : pts)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = o.color
  for (let pass = 0; pass < (o.passes ?? 2); pass++) {
    const ox = (r() - 0.5) * 1.6 * pass, oy = (r() - 0.5) * 1.6 * pass
    const phase = r() * 6.28
    ctx.globalAlpha = pass ? 0.35 : 0.92
    for (let i = 0; i < path.length - 1; i++) {
      const t = i / (path.length - 1)
      const taper = o.closed ? 1 : Math.min(1, Math.sin(Math.PI * t) * 3 + 0.25)
      const pressure = taper * (0.78 + 0.22 * Math.sin(t * 9 + phase) + 0.12 * (r() - 0.5))
      if (r() < 0.006) continue // the pen skips now and then
      ctx.lineWidth = Math.max(0.6, o.w * pressure)
      ctx.beginPath()
      ctx.moveTo(path[i][0] + ox, path[i][1] + oy)
      ctx.lineTo(path[i + 1][0] + ox + (r() - 0.5) * 0.6, path[i + 1][1] + oy + (r() - 0.5) * 0.6)
      ctx.stroke()
    }
  }
  ctx.restore()
}

// Static paper tooth, generated once: where it is high, crayon fails to deposit.
let tooth: HTMLCanvasElement | null = null
export const paperTooth = (w: number, h: number) => {
  if (tooth && tooth.width === w) return tooth
  tooth = document.createElement('canvas')
  tooth.width = w
  tooth.height = h
  const ctx = tooth.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const r = rng(99)
  for (let i = 0; i < w * h; i++) {
    // Mostly fine grain, with occasional larger pits along a faint horizontal fibre.
    const v = r() ** 3.2 + (((i / w) | 0) % 7 === 0 ? r() * 0.08 : 0)
    img.data[i * 4 + 3] = Math.min(255, v * 255)
  }
  ctx.putImageData(img, 0, 0)
  return tooth
}

// Crayon fill: a thin mottled base, then hundreds of short hatch marks of varying length,
// weight and angle, a darker band hugging the edge, and paper tooth knocked out of it all.
export const crayon = (ctx: CanvasRenderingContext2D, pts: P[], o: { base: string; dark: string; light: string; seed: number; angle?: number; gap?: number }) => {
  const r = rng(o.seed)
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, diag = Math.hypot(x1 - x0, y1 - y0) / 2 + 10
  const layer = document.createElement('canvas')
  layer.width = ctx.canvas.width
  layer.height = ctx.canvas.height
  const l = layer.getContext('2d')!
  trace(l, pts)
  l.clip()
  l.globalAlpha = 0.88
  l.fillStyle = o.base
  l.fill()
  l.lineCap = 'round'
  const hatch = (color: string, angle: number, gap: number, alpha: [number, number], width: [number, number]) => {
    const ca = Math.cos(angle), sa = Math.sin(angle)
    for (let s = -diag; s < diag; s += gap * (0.7 + r() * 0.6)) {
      let u = -diag - r() * 40
      while (u < diag) {
        const len = 18 + r() * 70
        if (r() < 0.86) {
          const tilt = (r() - 0.5) * 0.06
          const ax = cx + ca * u - sa * s, ay = cy + sa * u + ca * s
          const bx = ax + Math.cos(angle + tilt) * len, by = ay + Math.sin(angle + tilt) * len
          l.globalAlpha = alpha[0] + r() * (alpha[1] - alpha[0])
          l.lineWidth = width[0] + r() * (width[1] - width[0])
          l.strokeStyle = color
          l.beginPath()
          l.moveTo(ax, ay)
          l.quadraticCurveTo((ax + bx) / 2 + (r() - 0.5) * 3, (ay + by) / 2 + (r() - 0.5) * 3, bx, by)
          l.stroke()
        }
        u += len + r() * 14
      }
    }
  }
  const angle = o.angle ?? -0.72
  hatch(o.dark, angle, o.gap ?? 5.5, [0.18, 0.55], [1, 2.6])
  hatch(o.light, angle + 0.1, (o.gap ?? 5.5) * 2.4, [0.15, 0.4], [1, 2])
  // Pigment pools at the edge.
  l.filter = 'blur(5px)'
  l.globalAlpha = 0.4
  l.strokeStyle = o.dark
  l.lineWidth = 16
  trace(l, pts)
  l.stroke()
  l.filter = 'none'
  l.globalAlpha = 0.55
  l.globalCompositeOperation = 'destination-out'
  l.drawImage(paperTooth(layer.width, layer.height), 0, 0)
  ctx.drawImage(layer, 0, 0)
}

// Paper: warm off-white, faint blotches, ink specks and the same tooth as a soft shadow.
export const paper = (ctx: CanvasRenderingContext2D, w: number, h: number, color = '#ebe9e3') => {
  const r = rng(7)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.filter = 'blur(60px)'
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.05
    ctx.fillStyle = r() > 0.5 ? '#d8d4ca' : '#f4f2ec'
    ctx.beginPath()
    ctx.arc(r() * w, r() * h, 80 + r() * 260, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.filter = 'none'
  ctx.globalAlpha = 0.09
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(paperTooth(w, h), 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#5a524a'
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.15 + r() * 0.3
    ctx.beginPath()
    ctx.arc(r() * w, r() * h, 0.6 + r() * 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
