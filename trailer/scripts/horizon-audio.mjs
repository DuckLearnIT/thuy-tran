// Synthesises the Horizon score from the same timeline the picture uses, so every cut,
// word and the title land on their frames. Writes public/audio/horizon.wav (48 kHz stereo).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tl = JSON.parse(readFileSync(join(root, 'src/horizon/timeline.json'), 'utf8'))
const SR = 48000, DUR = tl.frames / tl.fps, N = Math.ceil(DUR * SR)
const L = new Float32Array(N), Rt = new Float32Array(N), send = new Float32Array(N)
const sec = f => f / tl.fps
const hz = m => 440 * 2 ** ((m - 69) / 12)

let seed = 7
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2147483648) - 1

const add = (t0, len, fn, pan = 0, wet = 0.3) => {
  const s0 = Math.floor(t0 * SR)
  for (let i = 0; i < len * SR && s0 + i < N; i++) {
    if (s0 + i < 0) continue
    const v = fn(i / SR)
    L[s0 + i] += v * (1 - pan) * 0.5 + v * 0.5 * (pan < 0 ? 1 : 1 - pan)
    Rt[s0 + i] += v * (1 + pan) * 0.5 + v * 0.5 * (pan > 0 ? 1 : 1 + pan)
    send[s0 + i] += v * wet
  }
}

// Pad: four chords, 4 s each, ending on the opening chord so the loop seam is silent.
const chords = [[45, 52, 55, 59, 60], [41, 48, 52, 57], [48, 55, 59, 64], [43, 50, 52, 59], [45, 52, 55, 59, 60]]
chords.forEach((notes, k) => {
  const t0 = k * 4 - (k ? 0.6 : 0), len = 4 + (k ? 1.2 : 0.6)
  notes.forEach((m, j) => {
    const f = hz(m)
    add(t0, len, t => {
      const env = Math.min(1, t / 0.9) * Math.min(1, (len - t) / 1.0)
      const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 0.3 * t + j)
      return env * 0.045 * (Math.sin(2 * Math.PI * f * vib * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.003 * t) + 0.2 * Math.sin(2 * Math.PI * f * 0.5 * t))
    }, (j % 2 ? 0.35 : -0.35), 0.45)
  })
})

// Each cut: a pencil tick plus a rising pentatonic pluck.
const penta = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]
tl.worlds.slice(1, -1).forEach(([, from], i) => {
  const t0 = sec(from)
  let lp = 0, lp2 = 0
  add(t0, 0.04, t => { const x = noise(); lp += 0.5 * (x - lp); lp2 += 0.08 * (lp - lp2); return (lp - lp2) * 0.6 * Math.exp(-t * 120) }, i % 2 ? 0.5 : -0.5, 0.1)
  const f = hz(penta[i % penta.length])
  add(t0, 0.9, t => 0.12 * Math.exp(-t * 6) * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 14)), i % 2 ? 0.3 : -0.3, 0.35)
})

const bell = (t0, notes, amp, decay) => notes.forEach((m, j) => {
  const f = hz(m)
  add(t0, decay * 1.6, t => amp * Math.exp(-t / decay) * (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 3) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 6)), (j - 1) * 0.3, 0.6)
})
const thump = (t0, amp) => add(t0, 0.7, t => amp * Math.exp(-t * 7) * Math.sin(2 * Math.PI * (52 + 60 * Math.exp(-t * 30)) * t), 0, 0.15)

// Words: thump + bell, a different note per word. Soft heartbeat on downbeats under the words.
tl.words.forEach(([, from], i) => { thump(sec(from), 0.55); bell(sec(from), [[81], [84], [88]][i], 0.09, 1.4) })
for (let f = tl.words[0][1]; f < tl.title[1]; f += 60) if (!tl.words.some(w => w[1] === f)) thump(sec(f), 0.22)

// Title: a breath of filtered noise rising into a bell chord and a sub boom.
const tt = sec(tl.title[1])
{ let lp = 0; add(tt - 1.2, 1.2, t => { lp += 0.04 * (noise() - lp); return lp * 1.6 * (t / 1.2) ** 3 }, 0, 0.5) }
thump(tt, 0.7)
bell(tt, [69, 76, 83, 84], 0.07, 2.6)

// Closing pan: a slow whoosh that hands back to the opening chord.
{ const [a, b] = tl.pan.map(sec); let lp = 0; add(a, b - a, t => { lp += 0.03 * (noise() - lp); return lp * 1.4 * Math.sin(Math.PI * t / (b - a)) ** 2 }, 0, 0.6) }

// Small Schroeder reverb on the send bus.
const comb = (x, d, g) => { const y = new Float32Array(N); for (let i = 0; i < N; i++) y[i] = x[i] + (i >= d ? g * y[i - d] : 0); return y }
const allpass = (x, d, g) => { const y = new Float32Array(N); for (let i = 0; i < N; i++) y[i] = -g * x[i] + (i >= d ? x[i - d] + g * y[i - d] : 0); return y }
const combs = [1557, 1617, 1491, 1422].map(d => comb(send, Math.round(d * SR / 44100), 0.82))
let wet = new Float32Array(N)
for (let i = 0; i < N; i++) wet[i] = (combs[0][i] + combs[1][i] + combs[2][i] + combs[3][i]) * 0.12
wet = allpass(allpass(wet, Math.round(225 * SR / 44100), 0.5), Math.round(556 * SR / 44100), 0.5)
for (let i = 0; i < N; i++) { L[i] += wet[i]; Rt[i] += wet[i] * 0.96 + (i > 30 ? wet[i - 30] * 0.04 : 0) }

// Soft limiter: drive into tanh so transients round off and the bed comes up toward
// streaming loudness, then normalise to -1 dBFS peak and report RMS as a check.
let pre = 0
for (let i = 0; i < N; i++) pre = Math.max(pre, Math.abs(L[i]), Math.abs(Rt[i]))
const DRIVE = 2.1
for (let i = 0; i < N; i++) { L[i] = Math.tanh((L[i] / pre) * DRIVE); Rt[i] = Math.tanh((Rt[i] / pre) * DRIVE) }
let peak = 0, sum = 0
for (let i = 0; i < N; i++) { peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rt[i])); sum += L[i] * L[i] + Rt[i] * Rt[i] }
const gain = 10 ** (-1 / 20) / peak
const rms = 20 * Math.log10(Math.sqrt(sum / (2 * N)) * gain)

const b = Buffer.alloc(44 + N * 4)
b.write('RIFF', 0); b.writeUInt32LE(36 + N * 4, 4); b.write('WAVEfmt ', 8)
b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22)
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34)
b.write('data', 36); b.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4)
  b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rt[i] * gain)) * 32767), 46 + i * 4)
}
mkdirSync(join(root, 'public/audio'), { recursive: true })
writeFileSync(join(root, 'public/audio/horizon.wav'), b)
console.log(`horizon.wav: ${DUR}s, peak -1 dBFS, RMS ${rms.toFixed(1)} dBFS`)
