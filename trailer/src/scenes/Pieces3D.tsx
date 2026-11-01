import { useThree } from '@react-three/fiber'
import { evolvePath } from '@remotion/paths'
import { ThreeCanvas } from '@remotion/three'
import { useLayoutEffect, useMemo } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { C, W, H, clamp, ease, font } from '../theme'
import { useStandees } from '../three'

const PIECES = [
  { id: 'nha-tuong', name: 'Nha Tướng' },
  { id: 'thuyen-nhe', name: 'Thuyền Nhẹ' },
  { id: 'tham-quan', name: 'Thám Quân' },
  { id: 'huong-dao-luc', name: 'Hướng Đạo' },
  { id: 'truyen-lenh-lam', name: 'Truyền Lệnh' },
  { id: 'nha-binh', name: 'Nha Binh' },
]
const STEP = 22, MOVE = 13, FIRST = 26, R = 1.6
const SLICE = (Math.PI * 2) / PIECES.length

// Turntable that clicks one piece forward per beat instead of spinning continuously.
const turn = (f: number) => {
  if (f < FIRST) return 0
  const n = Math.floor((f - FIRST) / STEP)
  const local = f - FIRST - n * STEP
  return n + ease.inOut(Math.min(1, local / MOVE))
}

const Rig: React.FC<{ pieces: THREE.Group[] }> = ({ pieces }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = useThree(s => s.camera)
  const intro = spring({ frame, fps, config: { damping: 20, mass: 1.2 } })
  const rings = useMemo(() => [0, 1, 2, 3].map(() => new THREE.MeshBasicMaterial({ color: C.ochre, transparent: true })), [])

  useLayoutEffect(() => {
    const orbit = interpolate(frame, [0, 105], [-0.22, 0.12])
    const dist = interpolate(intro, [0, 1], [9.4, 7.4])
    camera.position.set(Math.sin(orbit) * dist + 0.2, interpolate(intro, [0, 1], [3.4, 1.35]), Math.cos(orbit) * dist)
    // Aim left of the turntable so it sits in the right half, clear of the caption.
    camera.lookAt(-0.55, 0.62, 0)
    camera.updateProjectionMatrix()
  }, [frame, camera, intro])

  const spin = -turn(frame) * SLICE
  const t = frame / 30
  return (
    <>
      <fog attach="fog" args={[C.deep, 6.5, 13]} />
      <ambientLight intensity={0.55} color="#ffe6c4" />
      <directionalLight position={[2.6, 4.2, 4]} intensity={2.6} color="#ffd9a0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} />
      <directionalLight position={[-3, 2.2, -3]} intensity={1.6} color="#7fb4ff" />
      <pointLight position={[0.85, 2.6, -3.2]} intensity={6} color={C.sun} distance={7} />

      <group position={[0.85, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[9, 96]} />
          <meshStandardMaterial color="#10284a" roughness={0.42} metalness={0.15} />
        </mesh>
        {rings.map((m, k) => {
          const r = ((t * 0.45 + k * 0.8) % 3.2) + 0.2
          m.opacity = 0.55 * (1 - r / 3.4) * intro
          return (
            <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={m}>
              <ringGeometry args={[r, r + 0.012, 128]} />
            </mesh>
          )
        })}
        <group rotation={[0, spin, 0]} scale={interpolate(intro, [0, 1], [0.7, 1])} position={[0, (intro - 1) * 0.6, 0]}>
          {pieces.map((piece, i) => {
            const a = i * SLICE
            const bob = Math.sin(t * 2.2 + i) * 0.02
            return (
              <group key={PIECES[i].id} position={[Math.sin(a) * R, bob, Math.cos(a) * R]} rotation={[0, a, 0]}>
                <primitive object={piece} />
              </group>
            )
          })}
        </group>
      </group>
    </>
  )
}

const Caption: React.FC = () => {
  const frame = useCurrentFrame()
  const front = (i: number) => (i === 0 ? 6 : FIRST + (i - 1) * STEP + 7)
  const kicker = interpolate(frame, [4, 18], [0, 1], { ...clamp, easing: ease.out })
  const rule = evolvePath(interpolate(frame, [8, 28], [0, 1], { ...clamp, easing: ease.inOut }), 'M0,2 L520,2')
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 150, top: 380, fontFamily: font.body, fontWeight: 700, fontSize: 28, letterSpacing: '0.4em', color: C.ochre, opacity: kicker, transform: `translateX(${(1 - kicker) * -40}px)` }}>
        QUÂN MICA
      </div>
      <svg width={560} height={6} style={{ position: 'absolute', left: 150, top: 432 }}>
        <path d="M0,2 L520,2" stroke={C.vermilion} strokeWidth={4} strokeDasharray={rule.strokeDasharray} strokeDashoffset={rule.strokeDashoffset} />
      </svg>
      <div style={{ position: 'absolute', left: 140, top: 450, width: 640, height: 190, overflow: 'hidden' }}>
        {PIECES.map((p, i) => {
          const inK = interpolate(frame, [front(i) + 4, front(i) + 14], [0, 1], { ...clamp, easing: ease.out })
          const outK = interpolate(frame, [front(i + 1), front(i + 1) + 5], [0, 1], { ...clamp, easing: ease.in })
          if (inK <= 0 || outK >= 1) return null
          return (
            <div key={p.id} style={{ position: 'absolute', left: 10, top: 0, fontFamily: font.display, fontSize: 124, lineHeight: 1.4, color: C.card, whiteSpace: 'nowrap', transform: `translateY(${(1 - inK) * 100 - outK * 100}%)` }}>
              {p.name}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// Models load before the canvas mounts: while rendering, R3F only draws on frame changes.
export const Pieces3D: React.FC = () => {
  const pieces = useStandees(PIECES.map(p => p.id), 1.45)
  return (
    <AbsoluteFill style={{ background: `radial-gradient(55% 65% at 64% 34%, #3a6d96 0%, ${C.indigo} 42%, ${C.deep} 100%)` }}>
      <div style={{ position: 'absolute', left: 1220 - 260, top: 140, width: 520, height: 520, borderRadius: '50%', background: C.sun, opacity: 0.22, filter: 'blur(60px)' }} />
      {pieces ? (
        <ThreeCanvas width={W} height={H} shadows camera={{ fov: 30, position: [0, 1.25, 6.3] }} gl={{ antialias: true }}>
          <Rig pieces={pieces} />
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.deep}e6 0%, ${C.deep}99 28%, transparent 46%)` }} />
      <Caption />
    </AbsoluteFill>
  )
}
