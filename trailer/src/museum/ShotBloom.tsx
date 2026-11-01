import { ThreeCanvas } from '@remotion/three'
import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import * as THREE from 'three'
import { Camera, Floor, H, Lights, W, span } from './common'
import { makeFlower } from './flower'
import { makeFigure, mat, walk } from './kit'
import { makeHero, makePen, pedestal } from './hero'
import { LINE, Paper, usePaper } from './paper'

const CAM = { pos: [0.25, 1.42, 2.55] as [number, number, number], look: [0.35, 1.28, -0.6] as [number, number, number], fov: 34 }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Background pass, blurred in CSS for depth of field: hazy hall, planted pedestals, visitors.
const Hall: React.FC<{ f: number }> = ({ f }) => {
  const set = useMemo(() => {
    const g = new THREE.Group()
    const spots: [number, number, number][] = [[-2.6, -2.5, 1.0], [-1.4, -4.2, 0.9], [2.9, -3.0, 0.8], [1.2, -5.5, 1.0], [4.2, -5.0, 0.9]]
    spots.forEach(([x, z, h], i) => {
      const box = pedestal(1.2, h, 1.0, '#d5b6a8')
      box.position.set(x, 0, z)
      g.add(box)
      const green = new THREE.Mesh(i % 2 ? new THREE.ConeGeometry(0.28, 0.7, 12) : new THREE.SphereGeometry(0.3, 16, 12), mat(i % 2 ? '#7fae5c' : '#a8cf7a', 0.8))
      green.position.set(x, h + 0.3, z)
      g.add(green)
    })
    return g
  }, [])
  const visitors = useMemo(() => [
    makeFigure({ skin: '#d9a888', hair: '#3b2a22', top: '#9cc07a', pants: '#e6d7b8', shoes: '#4a3a30', hairStyle: 'short' }),
    makeFigure({ skin: '#f0c9ac', hair: '#7a4b34', top: '#e9e2dc', pants: '#8c9aa8', shoes: '#4a3a30', hairStyle: 'long' }),
    makeFigure({ skin: '#e8c2a6', hair: '#2d2420', top: '#f1ece2', pants: '#cdbb9a', shoes: '#4a3a30', hairStyle: 'short' }),
  ], [])
  const t = f / 30
  const placed: [number, number, number][] = [[-3.2, -6.2, 0.6], [-2.7, -6.3, -0.4], [2.6, -7.0, Math.PI * 0.6]]
  visitors.forEach((v, i) => {
    v.root.position.set(placed[i][0] + (i === 2 ? t * 0.25 : 0), 0, placed[i][1])
    v.root.rotation.y = placed[i][2]
    walk(v, t * 5 + i, i === 2 ? 0.7 : 0)
  })
  return (
    <>
      <fog attach="fog" args={['#d9b4a9', 4, 16]} />
      <Lights target={[0, 0, -3]} dir={[-4, 7, 2]} intensity={1.8} />
      <Floor />
      <primitive object={set} />
      {visitors.map((v, i) => <primitive key={i} object={v.root} />)}
    </>
  )
}

// Foreground pass: the writer at her desk, finishing the line, then looking up as the
// flower she described blooms in the air beside her.
const Writer: React.FC<{ f: number }> = ({ f }) => {
  const hero = useMemo(makeHero, [])
  const pen = useMemo(() => {
    const p = makePen()
    p.position.set(0.0, -0.04, 0.03)
    p.rotation.set(2.1, 0.2, 0.3)
    hero.handR.add(p)
    return p
  }, [hero])
  const desk = useMemo(() => {
    const m = pedestal(2.2, 1.04, 0.9)
    m.position.set(0.1, 0.52, 0.16)
    return m
  }, [])
  const flower = useMemo(makeFlower, [])
  const paper = usePaper()
  paper.update(LINE.length, 1)
  pen.visible = true

  const look = span(f, 18, 40)
  const t = f / 30
  hero.root.position.set(-0.2, 0, -0.5)
  hero.root.rotation.y = 0.15
  hero.torso.rotation.x = lerp(0.2, 0.08, look)
  hero.head.rotation.x = lerp(0.38, -0.3, look)
  hero.head.rotation.y = lerp(-0.05, 0.6, look)
  hero.head.rotation.z = lerp(0, -0.1, look)
  // Forearms rest on the desk top: the right hand keeps the stylus on the sheet.
  hero.shR.rotation.set(-0.55 + Math.sin(t * 3) * 0.03 * (1 - look), 0, 0.1)
  hero.elR.rotation.set(-0.8, 0, 0)
  hero.shL.rotation.set(-0.5, 0, -0.08)
  hero.elL.rotation.set(-0.85, 0, 0)

  flower.group.position.set(1.32, 1.82, -0.9)
  flower.group.rotation.set(0.25, -0.4, -0.2)
  flower.update(Math.max(0, (f - 10) / 30))

  return (
    <>
      <Lights target={[0, 1, -0.5]} dir={[-3, 6, 4]} intensity={2.1} />
      <pointLight position={[1.55, 2.2, -0.9]} intensity={span(f, 10, 40) * 3 * (1 - span(f, 80, 102))} color="#f2ffd8" distance={4} />
      <primitive object={hero.root} />
      <primitive object={desk} />
      <Paper texture={paper.texture} position={[0.05, 1.042, 0.12]} scale={0.72} />
      <primitive object={flower.group} />
    </>
  )
}

export const ShotBloom: React.FC = () => {
  const f = useCurrentFrame()
  const drift = span(f, 0, 102)
  const cam = { ...CAM, pos: [CAM.pos[0] - drift * 0.12, CAM.pos[1] + drift * 0.04, CAM.pos[2] - drift * 0.2] as [number, number, number] }
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(115deg, #e9bfa5 0%, #dcb4ad 45%, #a99cb8 100%)' }}>
      <ThreeCanvas width={W} height={H} shadows style={{ position: 'absolute', inset: 0, filter: 'blur(7px)' }}>
        <Camera {...cam} />
        <Hall f={f} />
      </ThreeCanvas>
      <ThreeCanvas width={W} height={H} shadows style={{ position: 'absolute', inset: 0 }}>
        <Camera {...cam} />
        <Writer f={f} />
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
