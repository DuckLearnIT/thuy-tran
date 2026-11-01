import { ThreeCanvas } from '@remotion/three'
import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import * as THREE from 'three'
import { Camera, H, Lights, W, span } from './common'
import { glowTexture, mat } from './kit'
import { makeWritingHand } from './hand'
import { LINE, PAPER, Paper, usePaper } from './paper'

const HAND_SCALE = 1.75
const PEN_DIR = new THREE.Vector3(-0.42, 1, -0.78).normalize()

// Shot 3 (9.6–11.6 s): overhead close-up. The line is written facing the writer, so to
// us it reads upside down and grows from right to left, the nib trailing a blue glint.
const Scene: React.FC<{ f: number }> = ({ f }) => {
  const paper = usePaper()
  const hand = useMemo(() => {
    const h = makeWritingHand()
    h.scale.setScalar(HAND_SCALE)
    h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), PEN_DIR)
    return h
  }, [])
  const desk = useMemo(() => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 1.8), mat('#d7ad95', 0.55))
    m.position.y = -0.15
    m.receiveShadow = true
    return m
  }, [])
  const glint = useMemo(() => glowTexture('rgba(255,255,255,1)', 'rgba(140,200,255,0.5)'), [])
  const halo = useMemo(() => glowTexture('rgba(255,255,255,0.9)', 'rgba(255,230,240,0.25)'), [])

  const chars = span(f, 3, 56) * LINE.length
  const caret = paper.update(chars, 1)
  const x = -(caret.u - 0.5) * PAPER.w
  const z = -(caret.v - 0.5) * PAPER.h
  const stroke = Math.max(0, Math.sin(f * 1.9)) * 0.012
  hand.position.set(x + Math.sin(f * 2.3) * 0.006, 0.004 + stroke, z + Math.cos(f * 1.9) * 0.01)
  const writing = chars > 0 && chars < LINE.length

  return (
    <>
      <Lights target={[0, 0, 0]} dir={[-2.5, 6, -3.5]} intensity={2.0} />
      <primitive object={desk} />
      <Paper texture={paper.texture} position={[0, 0.002, 0]} />
      <sprite position={[0, 0.05, 0]} scale={[1.9, 1.4, 1]} renderOrder={1}>
        <spriteMaterial map={halo} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </sprite>
      <primitive object={hand} />
      <sprite position={[hand.position.x, 0.02, hand.position.z]} scale={[0.1, 0.1, 1]} renderOrder={2}>
        <spriteMaterial map={glint} transparent opacity={writing ? 0.9 : 0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </sprite>
    </>
  )
}

export const ShotWriting: React.FC = () => {
  const f = useCurrentFrame()
  const drift = span(f, 0, 60)
  return (
    <AbsoluteFill style={{ background: '#c99f8a' }}>
      <ThreeCanvas width={W} height={H} shadows>
        <Camera pos={[0.1 - drift * 0.1, 1.45 - drift * 0.08, 0.55]} look={[0.0 - drift * 0.06, 0, 0.0]} fov={34} roll={-0.03} />
        <Scene f={f} />
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
