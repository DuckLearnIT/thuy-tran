import * as THREE from 'three'
import { preloadedImages, whenLoaded } from '../assetQueue'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createPieceScene, piecePacking, type PieceSelection, type PieceLabel } from './pieceScene'
import { pieces } from '../data/pieces'

export type BoxState = {
  elev: number
  yaw: number
  zoom: number
  shift: number
  lift: number
  lidTilt: number
  lidTurn: number
  rise: number
  drop: number
  swap: number
  fan2: number[]
  ring: number
  fan: number[]
  locationsReveal: number
  locationsExit: number
  piecesReveal: number
  piecesExit: number
  boxClose: number
  boxDismiss: number
}

type Opts = {
  canvas: HTMLCanvasElement
  cover: string
  cards: string[]
  extra: string[]
  locations: { image: string; back: string }[]
  onPieceChange?: (selection: PieceSelection) => void
  onPieceLayout?: (positions: PieceLabel[]) => void
}

// All 13 character and strategy cards share this pixel size, so late files do not resize the meshes.
const cardArt = { width: 1500, height: 2078 }
const W = 3
const D = 4
const HB = 0.62
const HL = 0.66
const WALL = 0.13
const FLOOR = 0.1

export function createBoxScene({ canvas, cover, cards, extra, locations, onPieceChange, onPieceLayout }: Opts) {
  const n = cards.length
  const mid = (n - 1) / 2
  const state: BoxState = {
    elev: 1.12,
    yaw: -0.32,
    zoom: 1,
    shift: 0,
    lift: 0,
    lidTilt: 0,
    lidTurn: 0,
    rise: 0,
    drop: 0,
    swap: 0,
    ring: 0,
    fan2: Array.from({ length: extra.length }, () => 0),
    fan: Array.from({ length: n }, () => 0),
    locationsReveal: 0,
    locationsExit: 0,
    piecesReveal: 0,
    piecesExit: 0,
    boxClose: 0,
    boxDismiss: 0,
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  scene.environmentIntensity = 0.55

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  const inspectionCanvas = canvas as HTMLCanvasElement & { __boxScene?: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; frameState: number[] } }
  if (import.meta.env.DEV) inspectionCanvas.__boxScene = { scene, camera, frameState: [] }

  const sun = new THREE.DirectionalLight(0xfff2dd, 2.6)
  sun.position.set(-3, 11, 4)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -6
  sun.shadow.camera.right = 6
  sun.shadow.camera.top = 6
  sun.shadow.camera.bottom = -6
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 25
  sun.shadow.radius = 5
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  scene.add(sun)
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x6a3a10, 0.5))
  // A cool grazing light reveals the acrylic edge without recolouring the unlit prints.
  const rim = new THREE.DirectionalLight(0xe4eeff, 3.2)
  rim.position.set(0, 5, -9)
  rim.visible = false
  scene.add(rim)

  const anis = renderer.capabilities.getMaxAnisotropy()
  const textureTasks: Promise<void>[] = []
  let disposed = false
  // Artwork outside the first screen streams in; a paper-coloured stand-in holds each slot until it lands.
  const stand = document.createElement('canvas')
  stand.width = stand.height = 2
  const standContext = stand.getContext('2d')!
  standContext.fillStyle = '#f3e6cd'
  standContext.fillRect(0, 0, 2, 2)
  // GPU uploads of late textures run one per frame so scrolling does not hitch.
  const uploads: THREE.Texture[] = []
  let uploadFrame = 0
  const pumpUploads = () => {
    if (uploadFrame || disposed || !uploads.length) return
    uploadFrame = requestAnimationFrame(() => {
      uploadFrame = 0
      const next = uploads.shift()
      if (next && !disposed) renderer.initTexture(next)
      pumpUploads()
    })
  }
  const loadTex = (src: string, cb?: (width: number, height: number) => void, planned?: { width: number; height: number }) => {
    const image = preloadedImages.get(src)
    const t = new THREE.Texture(image ?? stand)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = anis
    t.needsUpdate = true
    // Run sizing callbacks once their card meshes have been constructed.
    textureTasks.push(Promise.resolve().then(() => {
      if (disposed) return
      if (image) {
        cb?.(image.width, image.height)
        renderer.initTexture(t)
      } else if (planned) {
        cb?.(planned.width, planned.height)
      }
    }))
    if (!image) {
      whenLoaded(src).then((loaded) => {
        if (disposed) return
        // Immutable GPU storage cannot change size, so release the stand-in before swapping in the file.
        t.dispose()
        t.image = loaded
        t.needsUpdate = true
        cb?.(loaded.width, loaded.height)
        uploads.push(t)
        pumpUploads()
      }).catch(() => {})
    }
    return t
  }

  const root = new THREE.Group()
  scene.add(root)

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.2, color: 0x3a2200 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.001
  ground.receiveShadow = true
  root.add(ground)

  const blue = new THREE.MeshStandardMaterial({ color: 0x1f55a0, roughness: 0.55, metalness: 0.02 })
  const deep = new THREE.MeshStandardMaterial({ color: 0x15345f, roughness: 0.6 })
  const liner = new THREE.MeshStandardMaterial({ color: 0xb5362b, roughness: 0.85 })
  const linerWall = new THREE.MeshStandardMaterial({ color: 0x8e2a21, roughness: 0.9 })

  const shadowed = (m: THREE.Mesh) => {
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  // base: floor + 4 walls + inner liner
  const base = new THREE.Group()
  base.name = 'box-base'
  root.add(base)
  const floor = shadowed(new THREE.Mesh(new RoundedBoxGeometry(W, FLOOR, D, 3, 0.03), blue))
  floor.name = 'box-floor'
  floor.position.y = FLOOR / 2
  base.add(floor)
  const wallH = HB - FLOOR
  const wy = FLOOR + wallH / 2
  const mkWall = (w: number, d: number, x: number, z: number) => {
    const m = shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, wallH, d, 3, 0.03), blue))
    m.name = 'box-wall'
    m.position.set(x, wy, z)
    base.add(m)
  }
  mkWall(W, WALL, 0, (D - WALL) / 2)
  mkWall(W, WALL, 0, -(D - WALL) / 2)
  mkWall(WALL, D - WALL * 2, (W - WALL) / 2, 0)
  mkWall(WALL, D - WALL * 2, -(W - WALL) / 2, 0)

  const iw = W - WALL * 2
  const id = D - WALL * 2
  const pad = new THREE.Mesh(new THREE.BoxGeometry(iw, 0.02, id), liner)
  pad.name = 'box-floor'
  pad.position.y = FLOOR + 0.01
  pad.receiveShadow = true
  base.add(pad)
  const lw = 0.03
  const mkLiner = (w: number, d: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, wallH - 0.1, d), linerWall)
    m.name = 'box-wall'
    m.position.set(x, FLOOR + (wallH - 0.1) / 2 + 0.02, z)
    m.receiveShadow = true
    base.add(m)
  }
  mkLiner(iw, lw, 0, id / 2 - lw / 2)
  mkLiner(iw, lw, 0, -id / 2 + lw / 2)
  mkLiner(lw, id, iw / 2 - lw / 2, 0)
  mkLiner(lw, id, -iw / 2 + lw / 2, 0)

  // lid: top plate (cover art) + skirt
  const lid = new THREE.Group()
  lid.name = 'box-lid'
  root.add(lid)
  const ow = W + 0.1
  const od = D + 0.1
  const plateT = 0.09
  const coverTex = loadTex(cover)
  const plateMats = [deep, deep, new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.42, metalness: 0 }), deep, deep, deep]
  const plate = shadowed(new THREE.Mesh(new THREE.BoxGeometry(ow, plateT, od), plateMats))
  plate.name = 'box-ceiling'
  plate.position.y = HL - plateT / 2
  lid.add(plate)
  const sk = 0.07
  const skH = HL - plateT
  const mkSkirt = (w: number, d: number, x: number, z: number) => {
    const m = shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, skH, d, 3, 0.02), deep))
    m.name = 'box-wall'
    m.position.set(x, skH / 2, z)
    lid.add(m)
  }
  mkSkirt(ow, sk, 0, (od - sk) / 2)
  mkSkirt(ow, sk, 0, -(od - sk) / 2)
  mkSkirt(sk, od - sk * 2, (ow - sk) / 2, 0)
  mkSkirt(sk, od - sk * 2, -(ow - sk) / 2, 0)
  lid.position.y = HB + 0.004

  // cards
  const cardMeshes: THREE.Mesh[] = []
  const cardGroups: THREE.Group[] = []
  const CW = 2.0
  let CH = 2.9
  const GH = 2.9
  cards.forEach((src, i) => {
    const g = new THREE.Group()
    const geo = new THREE.BoxGeometry(CW, GH, 0.014)
    const side = new THREE.MeshStandardMaterial({ color: 0xf3e6cd, roughness: 0.8 })
    const tex = loadTex(src, (width, height) => {
      const h = CW * (height / width)
      mesh.scale.y = h / GH
      CH = h
      cardMeshes.forEach((m) => (m.position.y = h / 2))
    }, cardArt)
    const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, alphaTest: 0.5 })
    const mesh = shadowed(new THREE.Mesh(geo, [side, side, side, side, front, new THREE.MeshStandardMaterial({ color: 0x0c2a52 })]))
    mesh.position.y = GH / 2
    g.add(mesh)
    g.rotation.order = 'YXZ'
    root.add(g)
    cardMeshes.push(mesh)
    cardGroups.push(g)
  })

  const backTex = (() => {
    const c = document.createElement('canvas')
    c.width = 400
    c.height = 560
    const x = c.getContext('2d')!
    x.fillStyle = '#f3e6cd'
    x.fillRect(0, 0, 400, 560)
    x.fillStyle = '#1f55a0'
    x.beginPath()
    x.roundRect(22, 22, 356, 516, 26)
    x.fill()
    x.strokeStyle = '#f3e6cd'
    x.lineWidth = 3
    x.beginPath()
    x.roundRect(40, 40, 320, 480, 18)
    x.stroke()
    x.fillStyle = '#ffb627'
    x.save()
    x.translate(200, 280)
    x.rotate(Math.PI / 4)
    x.fillRect(-56, -56, 112, 112)
    x.fillStyle = '#b5362b'
    x.fillRect(-34, -34, 68, 68)
    x.restore()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const m = extra.length
  const xGroups: THREE.Group[] = []
  extra.forEach((src) => {
    const g = new THREE.Group()
    const side = new THREE.MeshStandardMaterial({ color: 0xf3e6cd, roughness: 0.8 })
    const tex = loadTex(src, (width, height) => {
      const h = CW * (height / width)
      mesh.scale.y = h / GH
      mesh.position.y = h / 2
    }, cardArt)
    const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, alphaTest: 0.5 })
    const mesh = shadowed(new THREE.Mesh(new THREE.BoxGeometry(CW, GH, 0.014), [side, side, side, side, front, new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.6 })]))
    mesh.position.y = GH / 2
    g.add(mesh)
    g.rotation.order = 'YXZ'
    g.visible = false
    root.add(g)
    xGroups.push(g)
  })

  // One square outline serves all 24 two-sided paper tiles.
  const tile = 1.05
  const pitch = tile + 0.09
  const radius = tile * 0.04
  const half = tile / 2
  const outline = new THREE.Shape()
  outline.moveTo(-half + radius, -half)
  outline.lineTo(half - radius, -half)
  outline.quadraticCurveTo(half, -half, half, -half + radius)
  outline.lineTo(half, half - radius)
  outline.quadraticCurveTo(half, half, half - radius, half)
  outline.lineTo(-half + radius, half)
  outline.quadraticCurveTo(-half, half, -half, half - radius)
  outline.lineTo(-half, -half + radius)
  outline.quadraticCurveTo(-half, -half, -half + radius, -half)
  const faceGeometry = new THREE.ShapeGeometry(outline, 8)
  const vertices = faceGeometry.attributes.position
  const uv = faceGeometry.attributes.uv
  for (let i = 0; i < vertices.count; i++) uv.setXY(i, (vertices.getX(i) + half) / tile, (vertices.getY(i) + half) / tile)
  const paperGeometry = new THREE.ExtrudeGeometry(outline, { depth: 0.014, bevelEnabled: false, curveSegments: 8, steps: 1 })
  paperGeometry.translate(0, 0, -0.007)
  const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xf3e6cd, roughness: 0.85 })
  const board = new THREE.Group()
  board.name = 'location-board'
  board.position.y = 1.75
  board.visible = false
  root.add(board)
  const rows = [2, 4, 6, 6, 4, 2]
  const slots = rows.flatMap((count, row) => Array.from({ length: count }, (_, column) => ({
    x: (column - (count - 1) / 2) * pitch,
    y: (2.5 - row) * pitch,
  })))
  const tiles = locations.map((card, index) => {
    const group = new THREE.Group()
    group.name = `location-${index}`
    group.rotation.order = 'YXZ'
    const paper = new THREE.Mesh(paperGeometry, paperMaterial)
    paper.name = 'paper'
    group.add(paper)
    // Discard transparent artwork corners so black RGB padding cannot cover the paper.
    const front = new THREE.Mesh(faceGeometry, new THREE.MeshBasicMaterial({ map: loadTex(card.image), alphaTest: 0.5, toneMapped: false }))
    front.position.z = 0.008
    const back = new THREE.Mesh(faceGeometry, new THREE.MeshBasicMaterial({ map: loadTex(card.back), alphaTest: 0.5, toneMapped: false }))
    back.rotation.y = Math.PI
    back.position.z = -0.008
    group.add(front, back)
    board.add(group)
    return group
  })
  const pieceScene = createPieceScene({ canvas, root, camera, assets: pieces, slots, onChange: onPieceChange, onLayout: onPieceLayout })
  // A shared soft paper shadow avoids 24 extra shadow-map passes.
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 128
  const shadowContext = shadowCanvas.getContext('2d')!
  shadowContext.shadowColor = '#231511'
  shadowContext.shadowBlur = 10
  shadowContext.fillStyle = '#231511'
  shadowContext.beginPath()
  shadowContext.roundRect(14, 14, 100, 100, 4)
  shadowContext.fill()
  const tileShadow = new THREE.CanvasTexture(shadowCanvas)
  const shadowGeometry = new THREE.PlaneGeometry(tile * 1.24, tile * 1.24)
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: tileShadow, transparent: true, opacity: 0.15, depthWrite: false, toneMapped: false })
  tiles.forEach(group => {
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.position.set(0.035, -0.045, -0.045)
    group.add(shadow)
  })
  const tableShadow = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 7.2), new THREE.ShadowMaterial({ opacity: 0.2, color: 0x3a2200 }))
  tableShadow.position.z = 0.009
  tableShadow.receiveShadow = true
  tableShadow.visible = false
  board.add(tableShadow)
  let pointerX = 0
  let pointerY = 0
  let parallaxX = 0
  let parallaxY = 0
  const pointerMedia = matchMedia('(hover: hover) and (pointer: fine)')
  const pointerMove = (event: PointerEvent) => {
    if (!pointerMedia.matches) return
    const rect = canvas.getBoundingClientRect()
    pointerX = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * Math.PI / 45
    pointerY = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * Math.PI / 45
  }
  const pointerLeave = () => { pointerX = 0; pointerY = 0 }
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerleave', pointerLeave)

  let visible = true
  let raf = 0
  let aspect = 1
  let wideBoard = false
  let boardHeight = 0.64
  let boardOffsetY = -100
  const look = new THREE.Vector3()
  const cameraTarget = new THREE.Vector3()
  const heldLook = new THREE.Vector3(0, 2.22, 5.3)
  let lastFrame = performance.now()
  const ease = (t: number) => 1 - Math.pow(1 - t, 3)
  const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t) }
  const exitOffsetY = () => -smooth(state.boxDismiss) * Math.max(28, 16 / aspect)

  const place = () => {
    const r = ease(THREE.MathUtils.clamp(state.rise, 0, 1))
    const sc = THREE.MathUtils.lerp(1, 1.22, r)
    const sw = ease(THREE.MathUtils.clamp(state.swap, 0, 1))
    const rg = ease(THREE.MathUtils.clamp(state.ring, 0, 1))
    const transfer = ease(THREE.MathUtils.clamp(state.locationsReveal / (3 / 11), 0, 1))
    for (let i = 0; i < n; i++) {
      const g = cardGroups[i]
      const f = ease(THREE.MathUtils.clamp(state.fan[i], 0, 1))
      const d = i - mid
      const trayY = FLOOR + 0.04 + i * 0.02
      const airY = 0.5 + i * 0.02
      g.scale.setScalar(sc)
      g.position.set(
        d * 0.22 * f,
        THREE.MathUtils.lerp(trayY, airY, r) - sw * 7.5,
        THREE.MathUtils.lerp(CH / 2, 0, r) + i * 0.012,
      )
      g.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, -0.1, r)
      g.rotation.y = 0
      g.rotation.z = -d * 0.15 * f
      g.visible = sw < 0.999
    }
    const R = 3.7
    for (let j = 0; j < m; j++) {
      const g = xGroups[j]
      const f = ease(THREE.MathUtils.clamp(state.fan2[j], 0, 1))
      const d = j - (m - 1) / 2
      const a = (j / m) * Math.PI * 2
      g.visible = sw > 0.001 && transfer < 0.999
      g.scale.setScalar(1.22 * THREE.MathUtils.lerp(1, 0.86, rg))
      const fy = THREE.MathUtils.lerp(-7.5, 0.5, sw) - transfer * 12
      g.position.set(
        THREE.MathUtils.lerp(d * 0.3 * f, Math.sin(a) * R, rg),
        fy,
        THREE.MathUtils.lerp(j * 0.012, (Math.cos(a) - 1) * R, rg),
      )
      g.rotation.x = -0.1
      g.rotation.y = a * rg
      g.rotation.z = -d * 0.13 * f * (1 - rg)
    }
    const spread = THREE.MathUtils.clamp((state.locationsReveal - 3 / 11) / (8 / 11), 0, 1)
    const tabletop = smooth(state.piecesReveal / 0.3)
    tableShadow.visible = tabletop > 0.99 && state.locationsExit < 0.001
    shadowMaterial.opacity = 0.15 * (1 - smooth(state.locationsExit / 0.18))
    board.visible = state.locationsReveal > 0.001 && state.boxDismiss < 1
    board.position.y = THREE.MathUtils.lerp(1.75, 0.025, tabletop) + exitOffsetY()
    board.position.x = -tabletop * (aspect < 0.8 ? 0 : 1)
    board.position.z = 0
    parallaxX += (pointerX - parallaxX) * 0.12
    parallaxY += (pointerY - parallaxY) * 0.12
    board.rotation.x = THREE.MathUtils.lerp(-0.08 + parallaxY, -Math.PI / 2, tabletop)
    board.rotation.y = (-0.04 + parallaxX) * (1 - tabletop)
    tiles.forEach((group, i) => {
      const slot = slots[i]
      const wave = (slot.x / pitch + 2.5) / 5
      const opening = ease(THREE.MathUtils.clamp((spread - wave * 0.2) / 0.8, 0, 1))
      group.position.set(slot.x * opening, slot.y * opening - (1 - transfer) * 12, (1 - opening) * i * 0.018)
      group.rotation.y = (1 - opening) * Math.PI * 0.88
      group.rotation.z = (1 - opening) * (i - 11.5) * 0.008
      if (state.locationsExit > 0) {
        // Separate the paper layers before gathering. Carry the entire stack
        // above the rim, then lower it vertically into the free rear compartment.
        const lift = smooth(state.locationsExit / 0.18)
        const gather = smooth((state.locationsExit - 0.18) / 0.27)
        const turn = smooth((state.locationsExit - 0.45) / 0.17) * Math.PI / 2
        const travel = smooth((state.locationsExit - 0.62) / 0.2)
        const lower = smooth((state.locationsExit - 0.82) / 0.18)
        const midLayer = (tiles.length - 1) * piecePacking.cardStep / 2
        const layer = i * piecePacking.cardStep - midLayer
        const stackX = piecePacking.deckFirstX + midLayer - board.position.x
        group.position.x = THREE.MathUtils.lerp(slot.x, stackX, gather) + Math.sin(turn) * layer * lift
        group.position.y = slot.y * (1 - gather) - (piecePacking.deckZ + (aspect < 0.8 ? piecePacking.portraitOffsetZ : 0)) * travel
        group.position.z = THREE.MathUtils.lerp((1.3 + midLayer) * lift, piecePacking.deckY - 0.025, lower) + Math.cos(turn) * layer * lift
        group.rotation.set(0, turn, 0)
      }
    })
  }

  const frame = () => {
    raf = requestAnimationFrame(frame)
    if (!visible) {
      // Pinning and viewport changes can race an IntersectionObserver delivery.
      const bounds = canvas.getBoundingClientRect()
      if (bounds.bottom <= 0 || bounds.top >= innerHeight) return
      visible = true
    }
    const now = performance.now()
    const dt = Math.min((now - lastFrame) / 1000, 0.05)
    lastFrame = now
    place()
    pieceScene.update(state.piecesReveal, state.piecesExit, dt, aspect < 0.8, exitOffsetY(), state.boxDismiss >= 1)

    const tabletop = smooth(state.piecesReveal / 0.3)
    const boxReturn = smooth(state.piecesExit / 0.12)
    const boxSlide = smooth(state.piecesExit / 0.06)
    const boxRise = smooth((state.piecesExit - 0.06) / 0.06)
    const boxZ = piecePacking.boxZ + (aspect < 0.8 ? piecePacking.portraitOffsetZ : 0)
    const closeLift = smooth(state.boxClose / 0.25)
    const closeSlide = smooth((state.boxClose - 0.25) / 0.5)
    const closeLower = smooth((state.boxClose - 0.75) / 0.25)
    const openLidY = state.piecesExit > 0 ? 0.04 - state.drop * (1 - boxRise) : HB + 0.004 + state.lift
    const closingLidY = THREE.MathUtils.lerp(openLidY, HB + 1.004, closeLift)
    rim.visible = tabletop > 0.01
    lid.position.set(state.piecesExit > 0 ? 3.7 * (1 - closeSlide) : 0,
      THREE.MathUtils.lerp(closingLidY, HB + 0.004, closeLower) + Math.sin(closeSlide * Math.PI) * 0.2 * (1 - closeLower) + exitOffsetY(), boxSlide * boxZ)
    sun.castShadow = (state.lift < 3.5 && state.rise < 0.05) || tabletop > 0.1
    base.position.set(0, -state.drop * (1 - boxRise) + exitOffsetY(), boxSlide * boxZ)
    ;(ground.material as THREE.ShadowMaterial).opacity = Math.max(0.2 * (1 - Math.min(1, state.rise * 2)), tabletop * 0.17)
    lid.rotation.x = state.lidTilt * (1 - boxReturn)
    lid.rotation.y = state.lidTurn * (1 - boxReturn)
    lid.rotation.z = 0

    const transfer = ease(THREE.MathUtils.clamp(state.locationsReveal / (3 / 11), 0, 1))
    // The wider board camera must not bring the already-dismissed box back into view.
    lid.visible = base.visible = state.locationsReveal <= 0 || (boxReturn > 0 && state.boxDismiss < 1)
    const elev = THREE.MathUtils.lerp(THREE.MathUtils.lerp(state.elev, 0.05, transfer), 0.7 + boxReturn * 0.16, tabletop)
    const yaw = state.yaw + boxReturn * 0.16
    const fit = Math.max(12.5, 8.4 / aspect)
    const boardExtent = pitch * 6 + 0.35
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const boardDistance = Math.max(boardExtent / (2 * tangent * boardHeight),
      boardExtent / (2 * tangent * aspect * (wideBoard ? 0.62 : 0.9)))
    const tableDistance = Math.max((aspect < 0.8 ? 7.2 : 6.2) / (2 * tangent * 0.76), (aspect < 0.8 ? 7.5 : 11.3) / (2 * tangent * aspect * 0.93))
    const returnDistance = Math.max(tableDistance + 5.5, 10.5 / (2 * tangent * aspect * 0.92))
    let dist = THREE.MathUtils.lerp(THREE.MathUtils.lerp(fit / state.zoom, boardDistance, transfer), THREE.MathUtils.lerp(tableDistance, returnDistance, boxReturn), tabletop)
    look.set(0, 0.35 + THREE.MathUtils.lerp(0, 1.4, ease(THREE.MathUtils.clamp(state.rise, 0, 1))), 0)
    look.y = THREE.MathUtils.lerp(look.y, 0.4, tabletop)
    look.z = (aspect < 0.8 ? tabletop * 1.2 : 0) * (1 - boxReturn) + boxReturn * (2.1 + (aspect < 0.8 ? piecePacking.portraitOffsetZ * 0.5 : 0))
    const focus = pieceScene.focus
    const dimensions = pieceScene.dimensions
    if (dimensions) {
      const narrow = canvas.clientWidth <= 600
      // Leave room for the header and inventory on short laptop screens.
      const verticalRoom = narrow ? 0.68 : Math.min(0.8, Math.max(0.3, 1 - 240 / canvas.clientHeight))
      const heldDistance = Math.max((narrow ? 2 : 1.8) / (2 * tangent * verticalRoom),
        (dimensions.width + dimensions.depth) * 1.32 / dimensions.height / (2 * tangent * aspect * (narrow ? 0.82 : 0.6)))
      dist = THREE.MathUtils.lerp(dist, heldDistance, focus)
      look.lerp(heldLook, focus)
    }
    camera.position.set(Math.sin(yaw) * Math.cos(elev) * dist, Math.sin(elev) * dist + look.y, Math.cos(yaw) * Math.cos(elev) * dist + look.z)
    cameraTarget.set(0, look.y + Math.sin(0.24) * dist, look.z + Math.cos(0.24) * dist)
    camera.position.lerp(cameraTarget, focus)
    camera.lookAt(look)
    const offsetX = THREE.MathUtils.lerp(-state.shift * (aspect > 1.3 ? 1 : 0) * 110 * aspect, wideBoard ? -155 * aspect : 0, transfer) * (1 - tabletop)
      - focus * (canvas.clientWidth > 600 ? 160 * aspect : 0)
    camera.setViewOffset(1000 * aspect, 1000, offsetX, boardOffsetY * transfer * (1 - tabletop)
      + tabletop * (65 + 35 * (1 - boxReturn)) * (1 - focus) + focus * (canvas.clientWidth <= 600 ? 50 : 0), 1000 * aspect, 1000)
    camera.updateProjectionMatrix()
    pieceScene.projectLabels()
    renderer.render(scene, camera)
    if (import.meta.env.DEV && inspectionCanvas.__boxScene) inspectionCanvas.__boxScene.frameState = [
      state.locationsReveal, state.piecesReveal, state.piecesExit, state.locationsExit, state.boxClose, state.boxDismiss,
    ]
  }

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    aspect = w / h
    wideBoard = w >= 1000 && aspect > 1.35
    const caption = canvas.parentElement?.querySelector<HTMLElement>('.bx-locations-copy')
    const boardTop = caption ? (caption.offsetTop + caption.offsetHeight + 24) / h : 0.29
    boardHeight = wideBoard ? 0.8 : Math.max(0.25, 0.93 - boardTop)
    boardOffsetY = wideBoard ? 0 : (0.5 - (boardTop + 0.93) / 2) * 1000
    renderer.setSize(w, h, false)
    camera.aspect = aspect
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  })
  io.observe(canvas)

  frame()

  const ready = Promise.all([Promise.all(textureTasks), pieceScene.ready]).then(async () => {
    if (disposed) return
    renderer.initTexture(backTex)
    renderer.initTexture(tileShadow)
    board.visible = true
    pieceScene.collection.visible = true
    await renderer.compileAsync(scene, camera)
    pieceScene.collection.visible = false
    board.visible = state.locationsReveal > 0.001 && state.boxDismiss < 1
  })

  return {
    state,
    ready,
    piecesReady: pieceScene.ready,
    pieces: pieceScene,
    dispose() {
      disposed = true
      if (import.meta.env.DEV) delete inspectionCanvas.__boxScene
      cancelAnimationFrame(raf)
      cancelAnimationFrame(uploadFrame)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerleave', pointerLeave)
      pieceScene.dispose()
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) geometries.add(m.geometry)
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => {
          const map = (x as THREE.MeshStandardMaterial).map
          if (map) textures.add(map)
          materials.add(x)
        })
      })
      geometries.forEach(item => item.dispose())
      materials.forEach(item => item.dispose())
      textures.forEach(item => item.dispose())
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
