import { useThree } from '@react-three/fiber'
import { loadFont } from '@remotion/google-fonts/Marcellus'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { floorTexture } from './kit'

export const { fontFamily: serif } = loadFont('normal', { weights: ['400'], subsets: ['latin'] })

export const W = 1920, H = 1080

export const Camera: React.FC<{ pos: [number, number, number]; look: [number, number, number]; fov?: number; roll?: number }> = ({ pos, look, fov = 30, roll = 0 }) => {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera
  useLayoutEffect(() => {
    camera.fov = fov
    camera.position.set(...pos)
    camera.up.set(0, 1, 0)
    camera.lookAt(...look)
    if (roll) camera.rotateZ(roll)
    camera.updateProjectionMatrix()
  })
  return null
}

// Warm skylight fill plus one soft key from upper right, shadows falling to lower left.
export const Lights: React.FC<{ target?: [number, number, number]; intensity?: number; dir?: [number, number, number] }> = ({ target = [0, 0, 0], intensity = 2.2, dir = [4, 8, -5] }) => {
  const light = useMemo(() => new THREE.DirectionalLight('#fff1e2', intensity), [intensity])
  useLayoutEffect(() => {
    light.position.set(target[0] + dir[0], target[1] + dir[1], target[2] + dir[2])
    light.target.position.set(...target)
    light.target.updateMatrixWorld()
  })
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  light.shadow.radius = 6
  light.shadow.bias = -0.0005
  Object.assign(light.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 40 })
  return (
    <>
      <hemisphereLight args={['#fde9df', '#c79a90', 1.5]} />
      <ambientLight intensity={0.35} color="#ffe2d6" />
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  )
}

export const Floor: React.FC<{ size?: number; color?: string }> = ({ size = 60, color }) => {
  const map = useMemo(() => {
    const t = floorTexture()
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping
    t.repeat.set(size / 20, size / 20)
    return t
  }, [size])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={map} color={color ?? '#ffffff'} roughness={0.9} />
    </mesh>
  )
}

export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
export const span = (f: number, a: number, b: number) => ease((f - a) / (b - a))
