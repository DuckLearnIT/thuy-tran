import * as THREE from 'three'
import { makeFigure, mat, type Look } from './kit'

// The writer: auburn bun, round glasses, blue cardigan over a pale vest.
export const heroLook: Look = {
  skin: '#f3c8aa', hair: '#9a5532', top: '#2c5fa8', sleeve: '#3f7fcf', vest: '#d8e6f4',
  pants: '#b49bc2', shoes: '#4b3d55', hairStyle: 'bun', glasses: true,
}

export const makeHero = () => makeFigure(heroLook)

// Stylus: pearl barrel, silver ferrule and a ring clip near the top, tip at the origin.
export const makePen = (len = 0.2) => {
  const pen = new THREE.Group()
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.008, len, 20), mat('#f2f1f5', 0.25))
  barrel.position.y = len / 2 + 0.02
  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 20), mat('#c9ccd4', 0.2))
  nib.rotation.x = Math.PI
  nib.position.y = 0.015
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 24), mat('#c9ccd4', 0.2))
  ring.position.set(0.012, len * 0.82, 0)
  ring.rotation.y = Math.PI / 2
  for (const m of [barrel, nib, ring]) {
    m.castShadow = true
    pen.add(m)
  }
  return pen
}

export const pedestal = (w: number, h: number, d: number, color = '#d9ad8c') => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, 0.65))
  mesh.position.y = h / 2
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}
