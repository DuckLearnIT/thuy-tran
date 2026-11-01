import { random } from 'remotion'
import * as THREE from 'three'
import { glowTexture } from './kit'

const PETALS = 6

// Lily petal: tapered blade, cupped at the base and recurved at the tip, green-to-white.
const petalGeometry = () => {
  const len = 0.62
  const g = new THREE.PlaneGeometry(0.2, len, 8, 24)
  g.translate(0, len / 2, 0)
  const pos = g.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const base = new THREE.Color('#b8d98e'), tip = new THREE.Color('#fbfdf2')
  for (let i = 0; i < pos.count; i++) {
    const v = pos.getY(i) / len
    const width = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.08)), 0.75) * (1 - 0.25 * v) + 0.06
    const x = pos.getX(i) * width
    pos.setXYZ(i, x, pos.getY(i), 0.32 * v * v - 0.42 * v * v * v + 0.6 * x * x)
    const c = base.clone().lerp(tip, Math.min(1, v * 1.6))
    colors.push(c.r, c.g, c.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

const ribbon = (points: [number, number, number][], color: string) => {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
  const geometry = new THREE.TubeGeometry(curve, 120, 0.011, 8, false)
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4, transparent: true })
  return new THREE.Mesh(geometry, material)
}

const sparkleField = (count: number, seed: string, size: number, texture: THREE.Texture) => {
  const positions = new Float32Array(count * 3)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ map: texture, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#fff6e0' })
  const points = new THREE.Points(geometry, material)
  const seeds = Array.from({ length: count }, (_, i) => [random(`${seed}a${i}`), random(`${seed}b${i}`), random(`${seed}c${i}`)])
  return { points, positions, seeds, material, geometry }
}

// Glowing lily: a bud that swells, opens, trails silk ribbons, then breaks into sparkles.
export const makeFlower = () => {
  const group = new THREE.Group()
  const petalGeo = petalGeometry()
  const petalMat = new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#dff0bf', emissiveIntensity: 0.4, roughness: 0.45, side: THREE.DoubleSide, transparent: true })
  const petals = Array.from({ length: PETALS }, (_, i) => {
    const pivot = new THREE.Group()
    pivot.rotation.y = (i / PETALS) * Math.PI * 2 + (i % 2) * 0.2
    const tilt = new THREE.Group()
    const mesh = new THREE.Mesh(petalGeo, petalMat)
    tilt.add(mesh)
    pivot.add(tilt)
    group.add(pivot)
    return { tilt, mesh, inner: i % 2 === 0 }
  })
  const stamens = Array.from({ length: 6 }, (_, i) => {
    const s = new THREE.Group()
    const filament = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 6), new THREE.MeshStandardMaterial({ color: '#f2d7e6', emissive: '#f0b4d4', emissiveIntensity: 0.6 }))
    filament.position.y = 0.16
    const anther = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshStandardMaterial({ color: '#d4609a', emissive: '#c0407e', emissiveIntensity: 0.7 }))
    anther.position.y = 0.33
    s.add(filament, anther)
    s.rotation.set(0.35, (i / 6) * Math.PI * 2, 0)
    s.rotation.order = 'YXZ'
    group.add(s)
    return s
  })
  const glowTex = glowTexture('rgba(255,255,240,1)', 'rgba(240,255,210,0.35)')
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  glow.position.y = 0.25
  group.add(glow)
  const ribbons = [
    ribbon([[0, 0, 0], [0.12, -0.35, 0.1], [-0.05, -0.75, 0.15], [0.2, -1.1, 0.05], [0.05, -1.45, 0.1]], '#e489b4'),
    ribbon([[0, 0, 0], [-0.15, -0.3, 0.05], [0.05, -0.65, -0.05], [-0.25, -1.0, 0.0], [-0.55, -1.25, 0.1]], '#7d5fd6'),
    ribbon([[0, 0, 0], [0.25, -0.2, 0.0], [0.4, -0.55, 0.1], [0.3, -0.9, 0.0]], '#c46fd0'),
  ]
  ribbons.forEach(r => group.add(r))
  const sparkTex = glowTexture('rgba(255,255,255,1)', 'rgba(255,240,220,0.4)')
  const fields = [sparkleField(70, 'sa', 0.035, sparkTex), sparkleField(40, 'sb', 0.06, sparkTex)]
  fields.forEach(s => group.add(s.points))

  // t: seconds since the bud appears.
  const update = (t: number) => {
    const appear = THREE.MathUtils.smoothstep(t, 0, 0.45)
    const open = THREE.MathUtils.smoothstep(t, 0.35, 1.5)
    const fade = 1 - THREE.MathUtils.smoothstep(t, 2.3, 3.2)
    group.scale.setScalar(0.2 + 0.4 * appear)
    petals.forEach(({ tilt, inner }, i) => {
      tilt.rotation.x = (inner ? 0.12 : 0.18) + open * (inner ? 1.05 : 1.3) + Math.sin(t * 2 + i) * 0.03
      tilt.scale.setScalar(0.55 + 0.45 * open)
    })
    petalMat.opacity = appear * fade
    stamens.forEach(s => {
      s.scale.setScalar(open)
      s.visible = open > 0.02 && fade > 0.02
    })
    glow.scale.setScalar((1.6 + 2.6 * open) * (0.6 + 0.4 * fade))
    glow.material.opacity = appear * (0.85 + 0.15 * Math.sin(t * 5)) * (0.4 + 0.6 * fade)
    ribbons.forEach((r, i) => {
      const grow = THREE.MathUtils.smoothstep(t, 0.4 + i * 0.12, 1.9 + i * 0.15)
      const index = r.geometry.index!.count
      r.geometry.setDrawRange(0, Math.floor((index * grow) / 6) * 6)
      ;(r.material as THREE.MeshStandardMaterial).opacity = fade
    })
    // Sparkles orbit while it blooms, then scatter up and left as the petals dissolve.
    const scatter = THREE.MathUtils.smoothstep(t, 2.1, 3.4)
    fields.forEach(({ positions, seeds, material, geometry }, k) => {
      seeds.forEach(([a, b, c], i) => {
        const ang = a * Math.PI * 2 + t * (0.4 + b * 0.6) * (k ? -1 : 1)
        const rad = 0.2 + b * 0.55 + scatter * (0.4 + c * 1.2)
        positions[i * 3] = Math.cos(ang) * rad - scatter * c * 0.5
        positions[i * 3 + 1] = 0.25 + (c - 0.4) * 0.8 + scatter * (0.3 + a * 0.9)
        positions[i * 3 + 2] = Math.sin(ang) * rad * 0.5
      })
      geometry.attributes.position.needsUpdate = true
      material.opacity = THREE.MathUtils.smoothstep(t, 0.2, 0.8) * (0.55 + 0.45 * Math.sin(t * 9 + k * 2))
    })
  }
  return { group, update }
}
