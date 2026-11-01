import { ThreeCanvas } from '@remotion/three'
import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Camera, Floor, H, Lights, W, serif } from './common'
import { makeFigure, walk, type Look } from './kit'

// Shot 1 (0–5.8 s): high-angle drift over the lobby floor; the title sits on the
// floor plane's screen position while visitors stroll across and in front of it.
type Visitor = { look: Look; x: number; z: number; heading: number; speed: number; phase: number; behind?: boolean }

const visitors: Visitor[] = [
  { look: { skin: '#e8c2a6', hair: '#eeeeea', top: '#7b4a2e', pants: '#c8ad86', shoes: '#4a3a30', hairStyle: 'short' }, x: -3.7, z: -0.4, heading: Math.PI, speed: 0.22, phase: 0, behind: true },
  { look: { skin: '#f0c9ac', hair: '#7a4b34', top: '#b37cc7', pants: '#e9e4ea', shoes: '#56485a', hairStyle: 'pony' }, x: 2.7, z: -2.3, heading: Math.PI + 0.25, speed: 0.55, phase: 1 },
  { look: { skin: '#e9bf9f', hair: '#8b5a3c', top: '#6f8fd8', pants: '#7d5a8f', shoes: '#3c3448', hairStyle: 'bun' }, x: 2.0, z: 0.9, heading: Math.PI - 0.35, speed: 0.6, phase: 2.2 },
  { look: { skin: '#d9a888', hair: '#3b2a22', top: '#e9e2dc', pants: '#7d7a52', shoes: '#4a3a30', hairStyle: 'long', scale: 0.92 }, x: -1.45, z: 2.3, heading: Math.PI * 0.5, speed: 0, phase: 0 },
  { look: { skin: '#f2cdb0', hair: '#d9a666', top: '#5fb3c9', pants: '#e3b98f', shoes: '#c9906a', hairStyle: 'bun', dress: true, scale: 0.9 }, x: -0.95, z: 2.25, heading: -Math.PI * 0.55, speed: 0, phase: 0 },
]

const People: React.FC<{ t: number }> = ({ t }) => {
  const figures = useMemo(() => visitors.map(v => makeFigure(v.look)), [])
  return (
    <>
      {figures.map((f, i) => {
        const v = visitors[i]
        const moving = v.speed > 0
        f.root.position.set(v.x + Math.sin(v.heading) * v.speed * t, 0, v.z + Math.cos(v.heading) * v.speed * t)
        f.root.rotation.y = v.heading
        walk(f, v.phase + t * (moving ? 5.2 * (0.6 + v.speed) : 0), moving ? 0.8 : 0, v.behind)
        // The two friends chat: small head turns and a nod instead of a stride.
        if (!moving) {
          f.head.rotation.y = Math.sin(t * 1.3 + i) * 0.25
          f.head.rotation.x = Math.sin(t * 2.1 + i) * 0.06
          f.shR.rotation.x = -0.2 + Math.sin(t * 1.7 + i) * 0.2
        }
        return <primitive key={i} object={f.root} />
      })}
    </>
  )
}

export const ShotLobby: React.FC = () => {
  const frame = useCurrentFrame()
  const t = frame / 30
  const camZ = 0.6 + t * 0.42
  const cam = { pos: [0.3, 10.5, camZ + 6.2] as [number, number, number], look: [0.3, 0, camZ] as [number, number, number], fov: 34 }
  return (
    <AbsoluteFill style={{ background: '#cfa595' }}>
      {/* Floor pass: floor, shadows and the visitors that cast them. */}
      <ThreeCanvas width={W} height={H} shadows>
        <Camera {...cam} />
        <Lights target={cam.look} />
        <Floor />
        <People t={t} />
      </ThreeCanvas>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', fontFamily: serif, fontSize: 86, lineHeight: 1.02, letterSpacing: '0.01em', color: '#6d4a51', textShadow: '0 1px 0 rgba(255,235,225,0.25)' }}>
        THE MUSEUM OF
        <br />
        WHAT COULD BE
      </div>
      {/* Figure pass on top of the title, so visitors walk in front of the lettering. */}
      <ThreeCanvas width={W} height={H} shadows style={{ position: 'absolute', inset: 0 }}>
        <Camera {...cam} />
        <Lights target={cam.look} />
        <People t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
