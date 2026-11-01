import * as THREE from 'three'
import { mat } from './kit'
import { heroLook, makePen } from './hero'

// A right hand gripping the stylus, built in pen space (pen along +y, nib at the origin),
// with the cardigan sleeve running back up the forearm.
export const makeWritingHand = () => {
  const g = new THREE.Group()
  const skin = mat(heroLook.skin, 0.55)
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], r: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.set(...p)
    mesh.rotation.set(...r)
    mesh.scale.set(...s)
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  g.add(makePen(0.2))
  add(new THREE.CapsuleGeometry(0.0105, 0.05, 6, 12), skin, [-0.006, 0.058, 0.012], [0.12, 0, 0.1])
  add(new THREE.CapsuleGeometry(0.0115, 0.042, 6, 12), skin, [0.017, 0.055, -0.004], [0, 0, 0.45])
  add(new THREE.CapsuleGeometry(0.0105, 0.035, 6, 12), skin, [0.006, 0.045, 0.02], [0.5, 0, 0.2])
  add(new THREE.SphereGeometry(0.014, 12, 10), skin, [0.027, 0.062, 0.022])
  add(new THREE.SphereGeometry(0.013, 12, 10), skin, [0.04, 0.074, 0.018])
  add(new THREE.SphereGeometry(0.043, 20, 14), skin, [0.03, 0.103, 0.004], [0, 0, -0.3], [0.95, 1.2, 0.68])
  add(new THREE.CylinderGeometry(0.03, 0.033, 0.06, 16), skin, [0.045, 0.15, 0.0], [0, 0, -0.35])
  add(new THREE.CylinderGeometry(0.04, 0.046, 0.55, 20), mat(heroLook.sleeve!, 0.85), [0.12, 0.43, -0.01], [0, 0, -0.32])
  add(new THREE.TorusGeometry(0.038, 0.007, 8, 24), mat('#2c5fa8', 0.85), [0.065, 0.19, 0], [Math.PI / 2, 0.35, 0])
  return g
}
