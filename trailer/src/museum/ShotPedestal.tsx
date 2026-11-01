import { ThreeCanvas } from '@remotion/three'
import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import * as THREE from 'three'
import { Camera, Floor, H, Lights, W, span } from './common'
import { glowTexture, mat } from './kit'
import { makeHero, makePen, pedestal } from './hero'
import { Paper, usePaper } from './paper'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Shot 2 (5.8–9.6 s): high angle on the writer at her pedestal. She pauses, raises a hand,
// takes up the stylus, and a glowing sheet resolves on the pedestal top.
const Scene: React.FC<{ f: number }> = ({ f }) => {
  const hero = useMemo(makeHero, [])
  const deskPen = useMemo(() => makePen(), [])
  const handPen = useMemo(() => {
    const pen = makePen()
    pen.position.set(0, -0.05, 0.02)
    pen.rotation.set(1.2, 0, 0)
    hero.handR.add(pen)
    return pen
  }, [hero])
  const desk = useMemo(() => pedestal(1.0, 1.0, 0.72), [])
  const props = useMemo(() => {
    const g = new THREE.Group()
    const spots: [number, number, number, string][] = [[-2.5, -1.9, 0.9, '#c9a088'], [2.3, -2.3, 1.0, '#c3a091'], [2.9, 1.0, 0.8, '#cfa48c'], [-2.9, 0.9, 0.95, '#c49a84']]
    spots.forEach(([x, z, h, c], i) => {
      const box = pedestal(0.9, h, 0.9, c)
      box.position.x = x
      box.position.z = z
      g.add(box)
      const thing = new THREE.Mesh(i % 2 ? new THREE.IcosahedronGeometry(0.22, 1) : new THREE.SphereGeometry(0.2, 20, 14), mat(i === 2 ? '#c9d36a' : '#f2efe9', 0.8))
      thing.scale.set(1.2, 0.6, 1)
      thing.position.set(x, h + 0.12, z)
      thing.castShadow = true
      g.add(thing)
    })
    return g
  }, [])
  const glow = useMemo(() => glowTexture('rgba(255,255,255,1)', 'rgba(220,235,255,0.35)'), [])
  const paper = usePaper()
  paper.update(0, 1)

  const raise = span(f, 18, 40)
  const reach = span(f, 44, 62)
  const lift = span(f, 64, 84)
  const sheet = span(f, 74, 98)
  const grabbed = f >= 60
  handPen.visible = grabbed

  hero.root.position.set(0, 0, -0.62)
  hero.head.rotation.x = lerp(0.42, 0.12, raise) + 0.2 * reach - 0.15 * lift
  hero.head.rotation.y = 0.08 * Math.sin(f / 14)
  hero.torso.rotation.x = 0.06 + 0.1 * reach
  // Right arm: palm up and out, down to the stylus, then lifted with it.
  hero.shR.rotation.set(lerp(lerp(-0.1, -0.55, raise), -0.95, reach) + 0.25 * lift, 0, lerp(-0.1, -0.35, raise) + 0.2 * reach)
  hero.elR.rotation.set(lerp(lerp(-0.2, -1.75, raise), -0.55, reach) - 1.15 * lift, 0, 0)
  hero.shL.rotation.set(-0.35, 0, 0.12)
  hero.elL.rotation.set(-0.7, 0, 0)

  return (
    <>
      <Lights target={[0, 0.8, 0]} dir={[-5, 9, -3]} intensity={2.4} />
      <Floor />
      <primitive object={props} />
      <primitive object={desk} />
      <primitive object={hero.root} />
      <primitive object={deskPen} position={[-0.32, 1.012, 0.1]} rotation={[0, 0, Math.PI / 2 - 0.5]} visible={!grabbed} />
      <Paper texture={paper.texture} position={[0, 1.004, 0.04]} opacity={sheet} scale={0.8} />
      <sprite position={[0, 1.08, 0.04]} scale={[1.7 * sheet, 1.1 * sheet, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.55 * sheet} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </>
  )
}

export const ShotPedestal: React.FC = () => {
  const f = useCurrentFrame()
  const push = span(f, 0, 114)
  return (
    <AbsoluteFill style={{ background: '#cfa595' }}>
      <ThreeCanvas width={W} height={H} shadows>
        <Camera pos={[lerp(0.25, 0.12, push), lerp(4.9, 4.2, push), lerp(4.3, 3.5, push)]} look={[0, 0.85, -0.25]} fov={30} />
        <Scene f={f} />
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
