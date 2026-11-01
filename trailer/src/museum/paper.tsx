import { useMemo } from 'react'
import * as THREE from 'three'
import { serif } from './common'

export const LINE = 'A BRILLIANT BLOOM'
export const PAPER = { w: 1.0, h: 0.7, cw: 1400, ch: 980 }
const TEXT_Y = 0.5

// Glowing sheet: pale luminous face, iridescent rim, and the line written up to `chars`
// (fractional: the letter being formed fades in with a blue halo).
const draw = (ctx: CanvasRenderingContext2D, chars: number, glow: number) => {
  const { cw, ch } = PAPER
  ctx.clearRect(0, 0, cw, ch)
  const face = ctx.createRadialGradient(cw * 0.45, ch * 0.4, 40, cw * 0.5, ch * 0.5, cw * 0.75)
  face.addColorStop(0, '#ffffff')
  face.addColorStop(1, '#e9ecf4')
  ctx.fillStyle = face
  ctx.fillRect(0, 0, cw, ch)
  ctx.save()
  ctx.filter = 'blur(10px)'
  const rim = ctx.createLinearGradient(0, 0, cw, ch)
  rim.addColorStop(0, `rgba(255,170,210,${0.8 * glow})`)
  rim.addColorStop(0.35, `rgba(170,230,255,${0.8 * glow})`)
  rim.addColorStop(0.7, `rgba(255,236,170,${0.8 * glow})`)
  rim.addColorStop(1, `rgba(200,170,255,${0.8 * glow})`)
  ctx.strokeStyle = rim
  ctx.lineWidth = 26
  ctx.strokeRect(10, 10, cw - 20, ch - 20)
  ctx.restore()

  ctx.font = `86px ${serif}`
  ctx.textBaseline = 'middle'
  const full = ctx.measureText(LINE).width
  let x = (cw - full) / 2
  const y = ch * TEXT_Y
  const n = Math.floor(chars)
  for (let i = 0; i < LINE.length && i <= n; i++) {
    const c = LINE[i]
    const a = i < n ? 1 : chars - n
    if (a > 0) {
      ctx.save()
      ctx.globalAlpha = a
      ctx.shadowColor = 'rgba(120,180,255,0.9)'
      ctx.shadowBlur = i >= n - 1 ? 30 : 6
      ctx.fillStyle = '#3d4b63'
      ctx.fillText(c, x, y)
      ctx.restore()
    }
    x += ctx.measureText(c).width
  }
  // Return the caret in normalised paper coordinates (0..1 across, 0..1 down).
  return { u: x / cw, v: TEXT_Y }
}

export const usePaper = () => {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = PAPER.cw
    c.height = PAPER.ch
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { canvas: c, texture: t }
  }, [])
  const update = (chars: number, glow = 1) => {
    const caret = draw(canvas.getContext('2d')!, chars, glow)
    texture.needsUpdate = true
    return caret
  }
  return { texture, update }
}

// A sheet lying on a desk top, flipped so its writing faces the person across the desk.
export const Paper: React.FC<{ texture: THREE.Texture; position: [number, number, number]; opacity?: number; scale?: number }> = ({ texture, position, opacity = 1, scale = 1 }) => (
  <group position={position} rotation={[0, Math.PI, 0]} scale={scale}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PAPER.w, PAPER.h]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  </group>
)
