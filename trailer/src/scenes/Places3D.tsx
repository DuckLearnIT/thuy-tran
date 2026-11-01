import { useThree } from '@react-three/fiber'
import { ThreeCanvas } from '@remotion/three'
import { useLayoutEffect, useMemo } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { C, W, H, clamp, ease, font } from '../theme'
import { useTextures } from '../three'

// The 24 locations, Bạch Đằng placed near the centre of the wall.
const PLACES = [
  'cua-nam-trieu', 'song-chanh', 'trang-kenh', 'luong-xam', 'song-cam', 'gia-vien', 'cua-bien-an-bang', 'bo-lau',
  'bai-coc-ngam', 'ben-chuyen-go', 'khuc-song-cong', 'bach-dang', 'bai-bun-trieu', 'lach-nuoc-sau', 'nga-ba-dong-nuoc', 'go-dat-cao',
  'ben-tap-ket', 'ben-thuyen-nhe', 'bai-tiep-luong', 'bai-chuan-bi-coc', 'rung-ven-song', 'vung-nuoc-lang', 'bo-dat-thap', 'loi-song-hep',
]
const COLS = 8, ROWS = 3, SIZE = 1, GAP = 1.12, RADIUS = 9

const Wall: React.FC<{ textures: THREE.Texture[] }> = ({ textures }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = useThree(s => s.camera)
  const geometry = useMemo(() => new THREE.PlaneGeometry(SIZE, SIZE), [])
  const materials = useMemo(
    () => textures.map(map => new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.4, side: THREE.FrontSide, toneMapped: false })),
    [textures],
  )

  useLayoutEffect(() => {
    const p = interpolate(frame, [0, 60], [0, 1], { ...clamp, easing: ease.out })
    camera.position.set(interpolate(p, [0, 1], [-0.8, 0]), interpolate(p, [0, 1], [0.3, -0.25]), interpolate(p, [0, 1], [4.2, 9.4]))
    camera.lookAt(0, -0.15, 0)
    camera.rotateZ(0.05 * (1 - p))
    camera.updateProjectionMatrix()
  }, [frame, camera])

  return (
    <group>
      {PLACES.map((id, i) => {
        const c = i % COLS, r = Math.floor(i / COLS)
        const theta = (c - (COLS - 1) / 2) * (GAP / RADIUS)
        const dist = Math.hypot(c - (COLS - 1) / 2, (r - 1) * 1.3)
        const flip = spring({ frame: frame - 4 - dist * 2.6, fps, config: { damping: 13, mass: 0.6 } })
        const lift = Math.sin(Math.min(1, flip) * Math.PI) * 0.45
        return (
          <group key={id} position={[RADIUS * Math.sin(theta), (1 - r) * GAP, RADIUS * (1 - Math.cos(theta)) + lift]} rotation={[0, -theta + Math.PI * (1 - flip), 0]}>
            <mesh geometry={geometry} material={materials[i * 2]} />
            <mesh geometry={geometry} material={materials[i * 2 + 1]} rotation={[0, Math.PI, 0]} />
          </group>
        )
      })}
    </group>
  )
}

const Count: React.FC = () => {
  const frame = useCurrentFrame()
  const k = interpolate(frame, [14, 40], [0, 1], { ...clamp, easing: ease.out })
  const n = Math.round(interpolate(frame, [6, 40], [1, 24], { ...clamp, easing: ease.out }))
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 918, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
      <span style={{ fontFamily: font.display, fontSize: 96, lineHeight: 1, color: C.sun, minWidth: 110, textAlign: 'right' }}>{n}</span>
      <span style={{ fontFamily: font.body, fontWeight: 700, fontSize: 34, letterSpacing: '0.45em', color: C.card }}>ĐỊA DANH</span>
    </div>
  )
}

export const Places3D: React.FC = () => {
  const textures = useTextures(PLACES.flatMap(p => [`art/locations/${p}-front.webp`, `art/locations/${p}-back.webp`]))
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 70% at 50% 42%, #2c5a84 0%, ${C.indigo} 48%, ${C.deep} 100%)` }}>
      {textures ? (
        <ThreeCanvas width={W} height={H} camera={{ fov: 34, position: [0, 0, 9] }} gl={{ antialias: true }}>
          <Wall textures={textures} />
        </ThreeCanvas>
      ) : null}
      <Count />
    </AbsoluteFill>
  )
}
