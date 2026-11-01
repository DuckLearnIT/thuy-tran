import { noise2D } from '@remotion/noise'
import { random } from 'remotion'
import { APEX, CX, CY, H, R, W, arcD, arcPts, arcY, groundD, normalAt, poly, rc, re, rl, rp, rpoly, tilt, type Pt } from './draw'

// f: frame inside the shot, p: 0..1 through it, t: seconds of global time, s(n): boiling seed.
export type Ctx = { f: number; p: number; t: number; s: (n: number) => number }
export type World = { bg: string; ink: string; draw: (c: Ctx) => React.ReactNode }

const INK = '#2b2220', PAPER = '#ebe9e3', SNOW = '#f4f1ea'

// Ground = clean colour underlay plus a rough hatch layer and a rough rim on top.
const ground = (c: Ctx, fill: string, hatch: string | null, rim: string, o: { gap?: number; angle?: number; style?: string; rimW?: number; weight?: number } = {}) => (
  <g key="ground">
    <path d={groundD()} fill={fill} />
    {hatch && rp(groundD(), { stroke: 'none', fill: hatch, fillStyle: o.style ?? 'hachure', hachureGap: o.gap ?? 9, hachureAngle: o.angle ?? -41, fillWeight: o.weight ?? 1.6, seed: c.s(1) }, 'hatch')}
    {rp(arcD(), { stroke: rim, strokeWidth: o.rimW ?? 4, roughness: 1.1, seed: c.s(2) }, 'rim')}
  </g>
)

const stars = (c: Ctx, n: number, color = SNOW, maxY = APEX - 40, key = 'stars') => (
  <g key={key}>
    {Array.from({ length: n }, (_, i) => {
      const x = random(`${key}x${i}`) * W, y = random(`${key}y${i}`) * Math.min(maxY, arcY(x) - 30)
      const tw = 0.5 + 0.5 * Math.sin(c.t * (2 + random(`${key}t${i}`) * 4) + i)
      const r = 1.2 + random(`${key}r${i}`) * 2.4
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={0.35 + 0.65 * tw} />
    })}
  </g>
)

const glow = (color: string, opacity: number, ry = 110, off = 30, key = 'glow') => (
  <ellipse key={key} cx={CX} cy={APEX + off} rx={1150} ry={ry} fill={color} opacity={opacity} filter="url(#hz-blur40)" />
)

const bands = (c: Ctx, list: [number, string, number][], key = 'bands') => (
  <g key={key}>{list.map(([off, color, w], i) => rp(arcD(off), { stroke: color, strokeWidth: w, roughness: 0.9, seed: c.s(10 + i) }, i))}</g>
)

// Reveal a list progressively, so line drawings appear to be drawn during the shot.
const upto = <T,>(list: T[], p: number) => list.slice(0, Math.ceil(list.length * Math.min(1, p)))

export const worlds: Record<string, World> = {
  dawn: {
    bg: '#0d1424', ink: SNOW,
    draw: c => [
      stars(c, 50),
      glow('#f08a3c', 0.45),
      bands(c, [[96, '#2f5f9a', 22], [62, '#4fa3b8', 14], [36, '#f5c84b', 10], [16, '#ef8a3c', 12]]),
      ground(c, '#121827', '#1d2638', '#0a0d14', { style: 'cross-hatch', gap: 10 }),
    ],
  },
  sun: {
    bg: '#0a0908', ink: SNOW,
    draw: c => [
      stars(c, 25, '#f7c35c', APEX - 60, 'sparks'),
      glow('#f5a33a', 0.5, 160, 10),
      ...[-620, -260, 180, 540].map((x, i) => {
        const h = (80 + 50 * i % 90) * (0.7 + 0.3 * Math.sin(c.t * 3 + i))
        const a = normalAt(CX + x, 0, 0), b = normalAt(CX + x + 160, 0, 0), top = normalAt(CX + x + 80, 0, h)
        return rp(`M${a} Q${top} ${b}`, { stroke: '#ef8a3c', strokeWidth: 6, roughness: 1.8, seed: c.s(20 + i) }, `prom${i}`)
      }),
      ground(c, '#ee9a36', '#d9742a', '#f7c35c', { gap: 10 }),
      <g key="granules">{Array.from({ length: 70 }, (_, i) => {
        const x = random(`gx${i}`) * W, y = arcY(x) + 18 + random(`gy${i}`) * 320
        return rc(x, y, 18 + random(`gd${i}`) * 34, { stroke: '#f9c86a', strokeWidth: 2, roughness: 1.5, seed: c.s(40 + i) }, i)
      })}</g>,
    ],
  },
  chalk: {
    bg: '#2c5d8c', ink: SNOW,
    draw: c => {
      const chalk = { stroke: '#eef2f2', strokeWidth: 3, roughness: 2.4, dash: '18 4 7 3' }
      const items: React.ReactNode[] = []
      for (let i = 0; i < 9; i++) {
        const th = (i - 4) * 0.11
        const a: Pt = [CX + (R - 600) * Math.sin(th), CY - (R - 600) * Math.cos(th)]
        const b: Pt = [CX + (R + 260) * Math.sin(th), CY - (R + 260) * Math.cos(th)]
        items.push(rl(a[0], a[1], b[0], b[1], { ...chalk, strokeWidth: 2, seed: c.s(30 + i) }, `rad${i}`))
      }
      for (let x = 40; x < W; x += 60) {
        const a = normalAt(x, 0, 0), b = normalAt(x, 0, x % 240 === 160 ? 34 : 16)
        items.push(rl(a[0], a[1], b[0], b[1], { ...chalk, strokeWidth: 2, seed: c.s(60 + x) }, `tick${x}`))
      }
      items.push(rc(CX + 240, APEX - 120, 520, { ...chalk, strokeWidth: 2, seed: c.s(5) }, 'compass'))
      items.push(rp(arcD(-70), { ...chalk, strokeWidth: 2, seed: c.s(6) }, 'inner'))
      return [rp(arcD(), { ...chalk, strokeWidth: 4, seed: c.s(2) }, 'rim'), ...upto(items, 0.25 + c.p * 1.2)]
    },
  },
  cells: {
    bg: '#0c0c0c', ink: SNOW,
    draw: c => [
      ground(c, '#cfcac2', '#b7b1a7', '#8d8a84', { gap: 12 }),
      <g key="cells">{Array.from({ length: 64 }, (_, i) => {
        const x = random(`cx${i}`) * (W + 100) - 50, d = 24 + random(`cd${i}`) * 80
        const y = arcY(x) - d * 0.25 + random(`cy${i}`) * 150 + Math.sin(c.t * 2 + i) * 3
        return rc(x, y, d, { stroke: '#6f6b64', strokeWidth: 2, fill: '#ebe8e2', fillStyle: 'solid', roughness: 1.1, seed: c.s(80 + i) }, i)
      })}</g>,
    ],
  },
  rocks: {
    bg: '#2b9cb3', ink: SNOW,
    draw: c => {
      const pts: Pt[] = []
      for (let x = -80; x <= W + 80; x += 24) {
        const n = noise2D('crag', x / 140, 0)
        pts.push([x, arcY(x) - Math.max(0, n) * 120 - Math.abs(noise2D('crag2', x / 40, 0)) * 26])
      }
      const d = `${poly(pts)} L${W + 80},${H + 80} L-80,${H + 80} Z`
      return [
        <path key="base" d={d} fill="#4a1a16" />,
        rp(d, { stroke: '#2a0e0b', strokeWidth: 3, fill: '#6e2a22', fillStyle: 'hachure', hachureGap: 8, roughness: 1.4, seed: c.s(3) }, 'rock'),
      ]
    },
  },
  pottery: {
    bg: '#12100e', ink: SNOW,
    draw: c => {
      const keys: React.ReactNode[] = []
      for (let x = 30; x < W; x += 92) {
        const [px, py] = normalAt(x, 0, -86)
        keys.push(
          <g key={x} transform={`translate(${px} ${py}) rotate(${(tilt(x) * 180) / Math.PI})`}>
            {rp('M-34,22 L-34,-22 L34,-22 L34,14 L-8,14 L-8,-4 L12,-4', { stroke: '#1c1410', strokeWidth: 6, roughness: 0.9, seed: c.s(100 + x) }, 'k')}
          </g>,
        )
      }
      return [
        ground(c, '#c46a43', '#a9532f', '#2b1a14', { gap: 11, rimW: 12 }),
        bands(c, [[-40, '#1c1410', 6], [-134, '#1c1410', 6]], 'meander-edges'),
        <g key="keys">{keys}</g>,
      ]
    },
  },
  hill: {
    bg: '#efe8d8', ink: INK,
    draw: c => {
      const sway = Math.sin(c.t * 2.2) * 18
      const kite: Pt = [640 + sway, 300 + Math.cos(c.t * 1.7) * 12]
      const tail = [0, 1, 2, 3, 4].map(k => [kite[0] - 20 - k * 26, kite[1] + 70 + k * 30 + Math.sin(c.t * 5 + k) * 10] as Pt)
      return [
        rc(1580, 230, 120, { stroke: '#e0a12e', fill: '#f5c84b', fillStyle: 'hachure', hachureGap: 6, seed: c.s(4) }, 'sun'),
        ground(c, '#9bbf62', '#7aa04a', INK),
        rl(1260, arcY(1260) + 4, 1262, arcY(1260) - 120, { stroke: '#6b4a2e', strokeWidth: 8, seed: c.s(6) }, 'trunk'),
        rc(1262, arcY(1260) - 170, 130, { stroke: INK, fill: '#4bab68', fillStyle: 'hachure', hachureGap: 6, seed: c.s(7) }, 'crown'),
        rp(`M${kite[0]},${kite[1] + 70} Q${kite[0] - 100},${kite[1] + 300} 520,${arcY(520) + 2}`, { stroke: INK, strokeWidth: 1.6, roughness: 0.8, seed: c.s(8) }, 'string'),
        rp(poly(tail), { stroke: '#e5533d', strokeWidth: 3, roughness: 1, seed: c.s(9) }, 'tail'),
        rpoly([[kite[0], kite[1] - 70], [kite[0] + 48, kite[1]], [kite[0], kite[1] + 70], [kite[0] - 48, kite[1]]], { stroke: INK, fill: '#e5533d', fillStyle: 'hachure', hachureGap: 5, seed: c.s(10) }, 'kite'),
      ]
    },
  },
  rainbow: {
    bg: '#08080c', ink: SNOW,
    draw: c => [
      stars(c, 30),
      bands(c, [[110, '#8b5bd6', 16], [92, '#3b8ed6', 16], [74, '#4bab68', 16], [56, '#f5c84b', 16], [38, '#ef8a3c', 16], [20, '#e5533d', 16]]),
      ground(c, '#121218', '#1d1d26', '#08080c', { gap: 10 }),
    ],
  },
  neural: {
    bg: '#14142e', ink: SNOW,
    draw: c => {
      const rows = [40, -60, -170, -290].map((off, r) => {
        const pts: Pt[] = []
        for (let x = 60 + (r % 2) * 70; x < W; x += 140) pts.push(normalAt(x, 0, off))
        return pts
      })
      const edges: [Pt, Pt][] = []
      rows.slice(0, -1).forEach((row, r) => row.forEach((a, i) => {
        const next = rows[r + 1]
        ;[i, i + 1].forEach(j => next[j] && edges.push([a, next[j]]))
      }))
      return [
        ground(c, '#1b1940', '#25225a', '#8b5bd6', { gap: 11 }),
        <g key="edges">{edges.map(([a, b], i) => rl(a[0], a[1], b[0], b[1], { stroke: '#8b5bd6', strokeWidth: 2, roughness: 1, seed: c.s(200 + i) }, i))}</g>,
        <g key="pulses" filter="url(#hz-blur4)">{edges.filter((_, i) => i % 3 === 0).map(([a, b], i) => {
          const k = (c.t * 1.6 + random(`pl${i}`)) % 1
          return <circle key={i} cx={a[0] + (b[0] - a[0]) * k} cy={a[1] + (b[1] - a[1]) * k} r={7} fill="#f5c84b" />
        })}</g>,
        <g key="nodes">{rows.flat().map(([x, y], i) => rc(x, y, 18, { stroke: '#f5c84b', fill: '#f5c84b', fillStyle: 'solid', strokeWidth: 2, roughness: 0.8, seed: c.s(400 + i) }, i))}</g>,
      ]
    },
  },
  scribble: {
    bg: PAPER, ink: INK,
    draw: c => {
      const lines = [-46, -104, -162, -220, -278].map((off, k) => {
        const len = Math.min(1, 0.15 + c.p * 1.6 - k * 0.12)
        if (len <= 0) return null
        const x1 = 120 + (1800 - 120) * len
        const pts: Pt[] = []
        for (let x = 120 + k * 40; x < x1; x += 9) {
          const [, y] = normalAt(x, 0, off + 16)
          pts.push([x + Math.sin(x * 0.21) * 7, y - Math.abs(Math.sin(x * 0.07 + k)) * 16 + Math.sin(x * 0.5) * 4])
        }
        return pts.length > 1 ? rp(poly(pts), { stroke: INK, strokeWidth: 3.4, roughness: 0.7, seed: c.s(500 + k) }, k) : null
      })
      return [
        ground(c, '#f4f2ec', null, INK, { rimW: 3 }),
        bands(c, [-46, -104, -162, -220, -278].map(o => [o, '#9fb7d6', 1.6] as [number, string, number]), 'rules'),
        <g key="script">{lines}</g>,
      ]
    },
  },
  rings: {
    bg: '#140d08', ink: SNOW,
    draw: c => [
      ground(c, '#d9a86c', null, '#4a2c18', { rimW: 18 }),
      <g key="rings">{Array.from({ length: 22 }, (_, k) => {
        const off = -24 - k * 17 - Math.pow(k, 1.25)
        const pts = arcPts(off, 48).map(([x, y]) => [x, y + noise2D('ring', x / 300, k * 0.3) * 6] as Pt)
        return rp(poly(pts), { stroke: k % 4 === 0 ? '#7a4a24' : '#a5713e', strokeWidth: k % 4 === 0 ? 5 : 2.2, roughness: 0.8, seed: c.s(600 + k) }, k)
      })}</g>,
      rl(CX + 140, arcY(CX + 140), CX + 210, APEX + 360, { stroke: '#4a2c18', strokeWidth: 3, roughness: 2.2, seed: c.s(12) }, 'crack'),
    ],
  },
  lace: {
    bg: '#050505', ink: SNOW,
    draw: c => {
      const lace = { stroke: '#f2f0ea', strokeWidth: 3, roughness: 0.9 }
      const scallops = arcPts(0, 70).slice(0, -1).map(([x], i) => {
        const a = normalAt(x, 0, 0), b = normalAt(x + 70, 0, 0), top = normalAt(x + 35, 0, 34)
        return rp(`M${a} Q${top} ${b}`, { ...lace, seed: c.s(700 + i) }, i)
      })
      const roses = arcPts(-70, 140).map(([x], i) => {
        const [px, py] = normalAt(x, 0, -72)
        return <g key={i}>{rc(px, py, 34, { ...lace, strokeWidth: 2, seed: c.s(800 + i) }, 'c')}{[0, 1, 2, 3, 4, 5].map(k => rc(px + Math.cos(k) * 30, py + Math.sin(k) * 30, 18, { ...lace, strokeWidth: 1.6, seed: c.s(900 + i * 6 + k) }, k))}</g>
      })
      return [
        rp(groundD(), { stroke: 'none', fill: '#efefe9', fillStyle: 'cross-hatch', hachureGap: 15, fillWeight: 1.2, seed: c.s(1) }, 'net'),
        <path key="hole" d={groundD(-120)} fill="#050505" opacity={0.55} />,
        <g key="scallops">{scallops}</g>,
        rp(arcD(), { ...lace, strokeWidth: 4, seed: c.s(2) }, 'rim'),
        <g key="roses">{roses}</g>,
      ]
    },
  },
  sand: {
    bg: '#0d0a07', ink: SNOW,
    draw: c => [
      <path key="base" d={groundD()} fill="#b9822a" />,
      rp(groundD(), { stroke: 'none', fill: '#f2c25a', fillStyle: 'dots', hachureGap: 9, fillWeight: 3, seed: c.s(1) }, 'dots'),
      rp(arcD(), { stroke: '#f2c25a', strokeWidth: 3, roughness: 1.6, seed: c.s(2) }, 'rim'),
      <g key="grains">{Array.from({ length: 90 }, (_, i) => {
        const life = (c.t * (0.5 + random(`sl${i}`)) + random(`so${i}`)) % 1
        const x0 = random(`sx${i}`) * W, x = x0 + life * 160
        const y = arcY(x0) - life * (60 + random(`sh${i}`) * 220)
        return <circle key={i} cx={x} cy={y} r={1.5 + random(`sr${i}`) * 2.5} fill="#f2c25a" opacity={Math.sin(Math.PI * life)} />
      })}</g>,
    ],
  },
  ocean: {
    bg: 'url(#hz-peach)', ink: INK,
    draw: c => {
      const shift = (c.t * 90) % 120
      const curls = arcPts(0, 120, -240, W + 120).map(([x], i) => {
        const bx = x + shift
        const a = normalAt(bx, 0, 0), top = normalAt(bx + 40, 0, 52), tip = normalAt(bx + 86, 0, 30), hook = normalAt(bx + 66, 0, 14)
        return rp(`M${a} Q${normalAt(bx + 6, 0, 46)} ${top} Q${normalAt(bx + 82, 0, 56)} ${tip} Q${normalAt(bx + 90, 0, 16)} ${hook}`, { stroke: '#f4f1ea', strokeWidth: 5, roughness: 0.9, seed: c.s(1000 + i) }, i)
      })
      return [
        rc(1450, 300, 150, { stroke: '#ef8a3c', fill: '#f5c84b', fillStyle: 'hachure', hachureGap: 6, seed: c.s(4) }, 'sun'),
        ground(c, '#2f6f9a', '#245b82', '#f4f1ea', { gap: 9, rimW: 5 }),
        <g key="curls">{curls}</g>,
        bands(c, [[-60, '#8fc0de', 3], [-130, '#8fc0de', 2]], 'swell'),
      ]
    },
  },
  collage: {
    bg: '#ece6d6', ink: INK,
    draw: c => {
      const cut = { stroke: 'none', fillStyle: 'solid', roughness: 2.2 } as const
      const pieces = [
        rc(700, 760, 170, { ...cut, fill: '#f5c84b', seed: c.s(1) }, 'sun'),
        rpoly([[1080, 660], [1130, 900], [1025, 900]], { ...cut, fill: '#e5533d', seed: c.s(2) }, 'leaf'),
        re(1320, 800, 300, 240, { ...cut, fill: '#4bab68', seed: c.s(3) }, 'blob'),
        rpoly([[470, 690], [540, 685], [548, 980], [478, 985]], { ...cut, fill: '#3b2219', seed: c.s(4) }, 'post'),
        rpoly([[1560, 720], [1600, 640], [1640, 720], [1690, 660], [1700, 900], [1550, 900]], { ...cut, fill: '#1c1c22', seed: c.s(5) }, 'spikes'),
      ]
      return [
        rp(groundD(), { stroke: 'none', fill: '#2b4fa3', fillStyle: 'solid', roughness: 2, seed: c.s(9) }, 'ground'),
        ...pieces.slice(0, 1 + Math.floor(c.f / 3)),
      ]
    },
  },
  honeycomb: {
    bg: '#1a1206', ink: SNOW,
    draw: c => {
      const s = 46, cells: React.ReactNode[] = []
      for (let row = 0; row < 12; row++) for (let col = 0; col < 26; col++) {
        const x = col * s * 1.5 - 30, y = APEX - 40 + row * s * Math.sqrt(3) + (col % 2) * s * Math.sqrt(3) / 2
        if (y < arcY(x) - 10) continue
        const hex = [0, 1, 2, 3, 4, 5].map(k => [x + s * Math.cos((k * Math.PI) / 3), y + s * Math.sin((k * Math.PI) / 3)] as Pt)
        const full = random(`hc${row}-${col}`) > 0.6
        cells.push(rpoly(hex, { stroke: '#a8650f', strokeWidth: 3, roughness: 1.1, fill: full ? '#f6c453' : undefined, fillStyle: 'hachure', hachureGap: 6, seed: c.s(1100 + row * 30 + col) }, `${row}-${col}`))
      }
      return [
        <path key="base" d={groundD()} fill="#e8a02c" />,
        <g key="cells" clipPath="url(#hz-ground)">{cells}</g>,
        rp(arcD(), { stroke: '#a8650f', strokeWidth: 5, seed: c.s(2) }, 'rim'),
      ]
    },
  },
  strings: {
    bg: '#f4efe6', ink: INK,
    draw: c => {
      const top = arcPts(0, 1, 0, 0).length ? Array.from({ length: 30 }, (_, i) => [i * 66 + 3, arcY(i * 66 + 3)] as Pt) : []
      const bottom = Array.from({ length: 30 }, (_, i) => [i * 66 + 3, H + 10] as Pt)
      const lines: React.ReactNode[] = []
      top.forEach((a, i) => {
        const b = bottom[(i + 9) % 30], d = bottom[(i + 21) % 30], e = top[(i + 12) % 30]
        lines.push(rl(a[0], a[1], b[0], b[1], { stroke: INK, strokeWidth: 2, roughness: 0.6, seed: c.s(1200 + i) }, `k${i}`))
        lines.push(rl(a[0], a[1], d[0], d[1], { stroke: '#e5533d', strokeWidth: 2.2, roughness: 0.6, seed: c.s(1300 + i) }, `r${i}`))
        lines.push(rl(a[0], a[1], e[0], e[1] + 0.1, { stroke: '#3b8ed6', strokeWidth: 2.2, roughness: 0.6, seed: c.s(1400 + i) }, `b${i}`))
      })
      return [
        <g key="lines" clipPath="url(#hz-ground)">{upto(lines, 0.3 + c.p * 1.1)}</g>,
        rp(arcD(), { stroke: INK, strokeWidth: 3, seed: c.s(2) }, 'rim'),
        <g key="pins">{top.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill={INK} />)}</g>,
      ]
    },
  },
  waveform: {
    bg: '#0f1020', ink: SNOW,
    draw: c => [
      ground(c, '#191a33', '#22234a', '#3b3d6e', { gap: 11 }),
      <g key="bars">{Array.from({ length: 84 }, (_, i) => {
        const x = 10 + i * 23
        // Bars duck under the word at the apex so the line stays readable.
        const clear = Math.min(1, Math.abs(x - CX) / 330) ** 2
        const h = (12 + 150 * Math.abs(noise2D('wave', x / 160, c.t * 1.4)) * (0.6 + 0.4 * Math.sin(i * 0.35 + c.t * 6))) * (0.15 + 0.85 * clear)
        const [ax, ay] = normalAt(x, 0, 6), [bx, by] = normalAt(x, 0, 6 + h)
        const hue = ['#8b5bd6', '#3b8ed6', '#4bab68', '#f5c84b', '#ef8a3c', '#e5533d'][Math.floor((i / 84) * 6)]
        return rl(ax, ay, bx, by, { stroke: hue, strokeWidth: 9, roughness: 0.6, seed: c.s(1500 + i) }, i)
      })}</g>,
    ],
  },
  galaxy: {
    bg: '#04050b', ink: SNOW,
    draw: c => [
      stars(c, 160),
      glow('#e8b07a', 0.55, 90, 10, 'core'),
      glow('#9b6fd6', 0.35, 170, 40, 'halo'),
      <path key="base" d={groundD()} fill="#0a0a14" />,
      bands(c, [[28, '#9b6fd6', 18], [12, '#e8b07a', 16], [0, '#f4e6c8', 8]]),
      rp(poly(arcPts(16, 40).map(([x, y]) => [x, y + Math.sin(x / 90 + c.t) * 5] as Pt)), { stroke: '#1a1020', strokeWidth: 9, roughness: 1.4, seed: c.s(5) }, 'dust'),
    ],
  },
  night: {
    bg: '#0d1424', ink: SNOW,
    draw: c => [stars(c, 70), rp(arcD(), { stroke: '#56637d', strokeWidth: 2, roughness: 0.8, seed: c.s(2) }, 'rim')],
  },
}
