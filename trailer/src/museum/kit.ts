import * as THREE from 'three'

// Toy-figurine people built from capsules: every joint is a pivot group so shots can pose them.
export type Look = {
  skin: string; hair: string; top: string; pants: string; shoes: string
  sleeve?: string; vest?: string; hairStyle: 'short' | 'bun' | 'pony' | 'long' | 'bald'
  glasses?: boolean; dress?: boolean; scale?: number
}

export type Figure = {
  root: THREE.Group; head: THREE.Group; torso: THREE.Group
  hipL: THREE.Group; hipR: THREE.Group; kneeL: THREE.Group; kneeR: THREE.Group
  shL: THREE.Group; shR: THREE.Group; elL: THREE.Group; elR: THREE.Group
  handL: THREE.Group; handR: THREE.Group
}

const mats = new Map<string, THREE.MeshStandardMaterial>()
export const mat = (color: string, roughness = 0.72) => {
  const key = `${color}-${roughness}`
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }))
  return mats.get(key)!
}

const solid = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// A capsule hanging below its pivot, `len` from pivot to the next joint.
const limb = (r: number, len: number, material: THREE.Material) => {
  const mesh = solid(new THREE.CapsuleGeometry(r, len, 6, 18), material)
  mesh.position.y = -len / 2
  return mesh
}

const joint = (parent: THREE.Object3D, x: number, y: number, z = 0) => {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  parent.add(g)
  return g
}

export const makeFigure = (look: Look): Figure => {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  body.scale.setScalar(look.scale ?? 1)
  const skin = mat(look.skin, 0.6)
  const pants = mat(look.pants)
  const top = mat(look.top)
  const sleeve = mat(look.sleeve ?? look.top)
  const shoes = mat(look.shoes, 0.5)

  const pelvis = solid(new THREE.SphereGeometry(0.15, 24, 16), pants)
  pelvis.scale.set(1.05, 0.7, 0.8)
  pelvis.position.y = 0.9
  body.add(pelvis)

  const leg = (side: number) => {
    const hip = joint(body, side * 0.085, 0.88)
    hip.add(limb(0.072, 0.38, look.dress ? skin : pants))
    const knee = joint(hip, 0, -0.38)
    knee.add(limb(0.064, 0.36, look.dress ? skin : pants))
    const foot = solid(new THREE.CapsuleGeometry(0.052, 0.12, 6, 14), shoes)
    foot.rotation.x = Math.PI / 2
    foot.position.set(0, -0.43, 0.05)
    knee.add(foot)
    return { hip, knee }
  }
  const L = leg(1), R = leg(-1)

  const torso = joint(body, 0, 0.9)
  // Tapered torso: narrower waist, broader chest, so figures read less like cylinders.
  const chestGeo = new THREE.CapsuleGeometry(0.16, 0.3, 8, 24)
  const cp = chestGeo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < cp.count; i++) {
    const k = 0.82 + 0.18 * THREE.MathUtils.smoothstep(cp.getY(i), -0.25, 0.12)
    cp.setX(i, cp.getX(i) * k)
  }
  chestGeo.computeVertexNormals()
  const chest = solid(chestGeo, look.vest ? sleeve : top)
  chest.scale.set(1, 1, 0.74)
  chest.position.y = 0.28
  torso.add(chest)
  if (look.vest) {
    // Open cardigan: pale vest panels either side of a shirt placket, all on the chest front.
    const shirt = solid(new THREE.CapsuleGeometry(0.05, 0.22, 6, 12), top)
    shirt.scale.set(1, 1, 0.45)
    shirt.position.set(0, 0.31, 0.098)
    torso.add(shirt)
    for (const s of [1, -1]) {
      const panel = solid(new THREE.CapsuleGeometry(0.06, 0.22, 6, 12), mat(look.vest))
      panel.scale.set(1.1, 1, 0.32)
      panel.position.set(s * 0.078, 0.29, 0.102)
      panel.rotation.z = s * 0.16
      torso.add(panel)
    }
  }
  if (look.dress) {
    const skirt = solid(new THREE.CylinderGeometry(0.15, 0.27, 0.5, 28, 1, true), top)
    skirt.position.y = -0.18
    torso.add(skirt)
  }

  const neck = solid(new THREE.CylinderGeometry(0.048, 0.055, 0.12, 14), skin)
  neck.position.y = 0.6
  torso.add(neck)

  const head = joint(torso, 0, 0.76)
  const skull = solid(new THREE.SphereGeometry(0.145, 32, 24), skin)
  skull.scale.set(0.95, 1.05, 1)
  head.add(skull)
  for (const s of [1, -1]) {
    const ear = solid(new THREE.SphereGeometry(0.028, 12, 10), skin)
    ear.position.set(s * 0.138, 0, 0)
    head.add(ear)
    const white = solid(new THREE.SphereGeometry(0.024, 16, 12), mat('#fbf7f2', 0.3))
    white.position.set(s * 0.05, 0.012, 0.126)
    head.add(white)
    const pupil = solid(new THREE.SphereGeometry(0.013, 12, 10), mat('#2a1d1a', 0.2))
    pupil.position.set(s * 0.05, 0.012, 0.147)
    head.add(pupil)
    const brow = solid(new THREE.CapsuleGeometry(0.006, 0.03, 4, 8), mat(look.hair))
    brow.rotation.z = Math.PI / 2 + s * 0.15
    brow.position.set(s * 0.052, 0.058, 0.133)
    head.add(brow)
    if (look.glasses) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.0065, 8, 28), mat('#d9dde3', 0.25))
      rim.position.set(s * 0.053, 0.012, 0.152)
      head.add(rim)
    }
  }
  if (look.glasses) {
    const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.02, 4, 8), mat('#d9dde3', 0.25))
    bridge.rotation.z = Math.PI / 2
    bridge.position.set(0, 0.022, 0.158)
    head.add(bridge)
  }
  const nose = solid(new THREE.SphereGeometry(0.02, 12, 10), skin)
  nose.position.set(0, -0.02, 0.145)
  head.add(nose)
  // Smile: a half torus opening upward.
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0055, 8, 18, Math.PI), mat('#9c4f4a', 0.4))
  mouth.rotation.z = Math.PI
  mouth.position.set(0, -0.052, 0.134)
  head.add(mouth)
  for (const s of [1, -1]) {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), new THREE.MeshStandardMaterial({ color: '#f09a8c', transparent: true, opacity: 0.35, roughness: 0.6 }))
    blush.scale.set(1, 0.6, 0.4)
    blush.position.set(s * 0.085, -0.035, 0.115)
    head.add(blush)
  }

  const hairMat = mat(look.hair, 0.85)
  if (look.hairStyle !== 'bald') {
    const cap = solid(new THREE.SphereGeometry(0.156, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat)
    cap.rotation.x = -0.62
    cap.position.set(0, 0.018, -0.012)
    head.add(cap)
    // Side locks framing the face, and a swept fringe.
    for (const s of [1, -1]) {
      const lock = solid(new THREE.SphereGeometry(0.06, 16, 12), hairMat)
      lock.scale.set(0.55, 1.15, 0.8)
      lock.position.set(s * 0.122, 0.02, 0.03)
      head.add(lock)
    }
    const fringe = solid(new THREE.SphereGeometry(0.1, 20, 12), hairMat)
    fringe.scale.set(1.25, 0.42, 0.75)
    fringe.position.set(0.02, 0.105, 0.06)
    fringe.rotation.z = -0.25
    head.add(fringe)
  }
  if (look.hairStyle === 'bun') {
    const bun = solid(new THREE.SphereGeometry(0.06, 20, 14), hairMat)
    bun.position.set(0, 0.13, -0.09)
    head.add(bun)
  }
  if (look.hairStyle === 'pony') {
    const tail = solid(new THREE.CapsuleGeometry(0.045, 0.2, 6, 12), hairMat)
    tail.position.set(0, -0.08, -0.15)
    tail.rotation.x = 0.25
    head.add(tail)
  }
  if (look.hairStyle === 'long') {
    const fall = solid(new THREE.CapsuleGeometry(0.12, 0.16, 6, 16), hairMat)
    fall.scale.set(1.05, 1, 0.55)
    fall.position.set(0, -0.1, -0.08)
    head.add(fall)
  }

  const arm = (side: number) => {
    const sh = joint(torso, side * 0.205, 0.5)
    sh.add(limb(0.052, 0.25, sleeve))
    const el = joint(sh, 0, -0.25)
    el.add(limb(0.046, 0.21, sleeve))
    const hand = joint(el, 0, -0.27)
    const palm = solid(new THREE.SphereGeometry(0.052, 16, 12), skin)
    palm.scale.set(0.8, 1.1, 0.6)
    hand.add(palm)
    sh.rotation.z = side * 0.08
    return { sh, el, hand }
  }
  const AL = arm(1), AR = arm(-1)

  return { root, head, torso, hipL: L.hip, hipR: R.hip, kneeL: L.knee, kneeR: R.knee, shL: AL.sh, shR: AR.sh, elL: AL.el, elR: AR.el, handL: AL.hand, handR: AR.hand }
}

// Walk cycle: `phase` in radians, `amount` 0 (standing) to 1 (full stride).
export const walk = (f: Figure, phase: number, amount = 1, armsBehind = false) => {
  const s = Math.sin(phase) * amount
  f.hipL.rotation.x = s * 0.45
  f.hipR.rotation.x = -s * 0.45
  f.kneeL.rotation.x = Math.max(0, -Math.cos(phase)) * 0.6 * amount
  f.kneeR.rotation.x = Math.max(0, Math.cos(phase)) * 0.6 * amount
  f.root.children[0].position.y = Math.abs(Math.cos(phase)) * 0.025 * amount
  if (armsBehind) {
    f.shL.rotation.set(0.38, 0, 0.1)
    f.shR.rotation.set(0.38, 0, -0.1)
    f.elL.rotation.set(0.25, 0, -0.4)
    f.elR.rotation.set(0.25, 0, 0.4)
  } else {
    f.shL.rotation.x = -s * 0.4
    f.shR.rotation.x = s * 0.4
    f.elL.rotation.x = -0.25 - Math.max(0, -s) * 0.3
    f.elR.rotation.x = -0.25 - Math.max(0, s) * 0.3
  }
}

export const canvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d')!)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// Soft round sprite used for every glow, sparkle and light pool.
export const glowTexture = (inner = 'rgba(255,255,255,1)', mid = 'rgba(255,240,210,0.35)') =>
  canvasTexture(256, 256, ctx => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, inner)
    g.addColorStop(0.25, mid)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  })

// Warm museum floor: rose-beige base with broad curved light bands, as if from skylights.
export const floorTexture = () =>
  canvasTexture(2048, 2048, ctx => {
    ctx.fillStyle = '#cfa595'
    ctx.fillRect(0, 0, 2048, 2048)
    ctx.filter = 'blur(60px)'
    ctx.strokeStyle = 'rgba(246,214,196,0.75)'
    ctx.lineWidth = 120
    for (const [cx, cy, r] of [[300, 2100, 1300], [1900, 2400, 1500], [-200, 300, 900]]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.lineWidth = 260
    ctx.strokeStyle = 'rgba(185,140,128,0.35)'
    ctx.beginPath()
    ctx.arc(2300, -300, 1500, 0, Math.PI * 2)
    ctx.stroke()
    ctx.filter = 'none'
  })
