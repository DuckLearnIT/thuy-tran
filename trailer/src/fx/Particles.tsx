import { useLayoutEffect, useRef } from 'react'
import { random, useCurrentFrame } from 'remotion'
import { W, H } from '../theme'

// Deterministic canvas particles (spray, mist, dust): every frame is recomputed from the seed.
export const Particles: React.FC<{
  seed: string; count: number; color: string; size: [number, number]
  area: [number, number, number, number]; drift: [number, number]; streak?: number; opacity?: number; start?: number
}> = ({ seed, count, color, size, area, drift, streak = 0, opacity = 1, start = 0 }) => {
  const frame = useCurrentFrame()
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    const t = Math.max(0, frame - start)
    const [x0, y0, x1, y1] = area
    for (let i = 0; i < count; i++) {
      const life = 30 + random(`${seed}l${i}`) * 50
      const birth = random(`${seed}b${i}`) * life
      const age = (t + birth) % life
      const k = age / life
      const speed = 0.6 + random(`${seed}s${i}`)
      const x = x0 + random(`${seed}x${i}`) * (x1 - x0) + drift[0] * age * speed
      const y = y0 + random(`${seed}y${i}`) * (y1 - y0) + drift[1] * age * speed
      const r = size[0] + random(`${seed}r${i}`) * (size[1] - size[0])
      ctx.globalAlpha = opacity * Math.sin(Math.PI * k) * (t > 0 ? 1 : 0)
      if (streak) {
        ctx.lineWidth = r
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - drift[0] * streak * speed, y - drift[1] * streak * speed)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [frame, seed, count, color, size, area, drift, streak, opacity, start])
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />
}
