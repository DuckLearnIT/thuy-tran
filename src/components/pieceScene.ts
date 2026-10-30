import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { PieceAsset } from '../data/pieces'

export type PieceSelection = { index: number; held: boolean }
export type PieceLabel = { index: number; x: number; y: number; visible: boolean }
export const piecePacking = { boxZ: 5.8, portraitOffsetZ: 3.1, deckZ: 4.5, deckY: 0.655, deckFirstX: -1.3, cardStep: 0.017 }
export function disposePiece(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
  object.traverse(node => {
    const mesh = node as THREE.Mesh
    if (mesh.geometry) geometries.add(mesh.geometry)
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
      materials.add(material)
      Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value) })
    })
  })
  geometries.forEach(value => value.dispose())
  materials.forEach(value => value.dispose())
  textures.forEach(value => { value.dispose(); if (typeof ImageBitmap !== 'undefined' && value.image instanceof ImageBitmap) value.image.close() })
}

export async function loadPiece(asset: PieceAsset, signal?: AbortSignal) {
  const response = await fetch(asset.model, { signal })
  if (!response.ok) throw Error('Standee could not load')
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), new URL('.', new URL(asset.model, location.href)).href)
  const source = gltf.scene
  source.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(source)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  const normalized = new THREE.Group()
  // At rest a pawn's 25 mm base is 30% of the 1.05-unit location tile.
  // Inspection restores a larger scale without changing the supplied mesh.
  const base = source.getObjectByName('RoundBaseWithSlot')
  const baseWidth = base ? new THREE.Box3().setFromObject(base).getSize(new THREE.Vector3()).x : size.x
  const scale = asset.kind === 'character' ? 0.315 / baseWidth : 1.32 / size.y
  source.position.set(-center.x, -bounds.min.y, -center.z)
  normalized.scale.setScalar(scale)
  normalized.add(source)
  const plate = new THREE.Group()
  source.add(plate)
  // Artwork is a sibling of CharacterPlate in these exports, not its child.
  for (const name of ['CharacterPlate', 'ArtworkFront', 'ArtworkBack']) {
    const node = source.getObjectByName(name)
    if (node) plate.attach(node)
  }
  source.traverse(node => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = !mesh.name.includes('Artwork')
    mesh.receiveShadow = false
    const material = mesh.material as THREE.MeshStandardMaterial
    if (material.map) material.map.anisotropy = 8
    if (material.transparent) {
      material.depthWrite = false
    }
    if (material instanceof THREE.MeshPhysicalMaterial && material.transparent) {
      // Preserve the source tint/roughness; grazing angles catch a stronger acrylic edge.
      material.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
          float acrylicEdge = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
          diffuseColor.a = max(diffuseColor.a, acrylicEdge * 0.62);
          outgoingLight += vec3(0.10, 0.13, 0.16) * acrylicEdge;
          #include <opaque_fragment>
        `)
      }
      material.customProgramCacheKey = () => 'standee-acrylic-edge-v1'
    }
  })
  normalized.updateMatrixWorld(true)
  const plateDepth = new THREE.Box3().setFromObject(plate).getSize(new THREE.Vector3()).z
  return { object: normalized, plate, plateDepth, height: size.y * scale, width: size.x * scale, depth: size.z * scale }
}

type LoadedPiece = Awaited<ReturnType<typeof loadPiece>> & { group: THREE.Group; slot: THREE.Vector3; baseY: number }
export function createPieceScene(options: {
  canvas: HTMLCanvasElement; root: THREE.Group; camera: THREE.PerspectiveCamera; assets: PieceAsset[];
  slots: { x: number; y: number }[]; onChange?: (selection: PieceSelection) => void;
  onLayout?: (positions: PieceLabel[]) => void
}) {
  const { canvas, root, camera, assets, slots, onChange } = options
  const collection = new THREE.Group()
  collection.visible = false
  root.add(collection)
  const loaded: LoadedPiece[] = []
  const selectionRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0xb5362b, side: THREE.DoubleSide, toneMapped: false }))
  selectionRing.rotation.x = -Math.PI / 2
  selectionRing.visible = false
  collection.add(selectionRing)
  const abort = new AbortController()
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2()
  const hitMeshes: THREE.Object3D[] = []
  let disposed = false, usable = false, interactive = false, active = 0, held = -1, desired = -1, pending = -1
  let mix = 0, yaw = 0, pitch = 0, velocityX = 0, velocityY = 0, hover = -1
  let drag: { id: number; x: number; y: number; lastX: number; lastY: number; moved: boolean; touch: boolean; hit: number } | null = null
  const clamp = THREE.MathUtils.clamp
  const smooth = (value: number) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t) }
  const notify = () => { onChange?.({ index: held >= 0 ? held : active, held: held >= 0 }); canvas.dataset.heldPiece = held >= 0 ? assets[held].id : ''; canvas.dataset.activePiece = assets[active].id }
  const setActive = (index: number) => { active = clamp(index, 0, assets.length - 1); notify() }
  const putDown = () => { desired = -1; pending = -1; cancel() }
  const pick = (index: number) => {
    if (!interactive || !loaded[index]) return
    active = index
    if (held === index) { desired = index; return }
    if (held >= 0) { pending = index; desired = -1 }
    else { held = desired = index; yaw = pitch = velocityX = velocityY = 0; notify() }
  }
  const hit = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1)
    camera.updateMatrixWorld()
    collection.updateMatrixWorld(true)
    ray.setFromCamera(pointer, camera)
    return ray.intersectObjects(hitMeshes, false)[0]?.object.userData.pieceIndex ?? -1
  }
  const down = (event: PointerEvent) => {
    if (!interactive || event.button !== 0) return
    const index = hit(event)
    if (index < 0 && held < 0) return
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, touch: event.pointerType === 'touch', hit: index }
    velocityX = velocityY = 0
  }
  const move = (event: PointerEvent) => {
    if (!interactive) return
    if (!drag || drag.id !== event.pointerId) {
      hover = event.pointerType === 'mouse' ? hit(event) : -1
      canvas.style.cursor = hover >= 0 ? (held === hover ? 'grab' : 'pointer') : ''
      return
    }
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y
    if (!drag.moved) {
      if (drag.touch && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag = null; return }
      if (Math.hypot(dx, dy) < 8) return
      drag.moved = true
      if (held < 0) return
      canvas.setPointerCapture(event.pointerId)
    }
    if (held < 0) return
    velocityX = clamp((event.clientX - drag.lastX) * 0.01, -0.14, 0.14)
    velocityY = drag.touch ? 0 : clamp((event.clientY - drag.lastY) * 0.006, -0.06, 0.06)
    yaw += velocityX
    pitch = clamp(pitch + velocityY, -Math.PI / 9, Math.PI / 9)
    drag.lastX = event.clientX; drag.lastY = event.clientY
    canvas.style.cursor = 'grabbing'
  }
  const up = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return
    const previous = drag
    drag = null
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = ''
    if (!previous.moved) { if (previous.hit < 0) putDown(); else pick(previous.hit) }
  }
  const cancel = () => { if (drag && canvas.hasPointerCapture(drag.id)) canvas.releasePointerCapture(drag.id); drag = null; hover = -1; velocityX = velocityY = 0; canvas.style.cursor = '' }
  const leave = () => { hover = -1 }
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', cancel)
  canvas.addEventListener('pointerleave', leave)
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { abort.abort(); reject(Error('Standee loading timed out')) }, 15000)
  })
  const loading = Promise.all(assets.map(async (asset, index) => {
    const piece = await loadPiece(asset, abort.signal)
    if (disposed || abort.signal.aborted) { disposePiece(piece.object); throw Error('Standee loading cancelled') }
    const group = new THREE.Group()
    group.name = asset.id
    group.add(piece.object)
    collection.add(group)
    const slot = slots[asset.slot]
    // Strategy markers are a separate display beside the board, never gameplay pieces on tiles.
    const position = asset.kind === 'character' ? new THREE.Vector3(slot.x - 1, 0.04, -slot.y)
      : new THREE.Vector3(3.3 + (index - 6) % 2 * 1.15, 0.04, (Math.floor((index - 6) / 2) - 0.5) * 3.1)
    loaded[index] = { ...piece, group, slot: position, baseY: piece.plate.position.y }
    piece.object.traverse(node => {
      if (node instanceof THREE.Mesh && ['AcrylicSilhouette', 'RoundBaseWithSlot'].includes(node.name)) {
        node.userData.pieceIndex = index
        hitMeshes.push(node)
      }
    })
  }))
  let markerShift = 0.12
  const ready = Promise.race([loading, timeout]).then(() => {
    const depth = Math.max(...loaded.filter((_, i) => assets[i].kind === 'strategy').map(piece => piece.plateDepth))
    markerShift = Math.max(0.12, (depth + 0.006) / 0.5)
    usable = true; return true
  }).catch(() => {
    abort.abort()
    loaded.forEach(piece => disposePiece(piece.object))
    loaded.length = 0
    collection.clear()
    return false
  }).finally(() => clearTimeout(timer))

  const boxTarget = new THREE.Vector3()
  const heldTarget = new THREE.Vector3(0, 1.55, 5.3)
  const update = (reveal: number, exit: number, dt: number, portrait: boolean, offsetY: number, sceneGone: boolean) => {
    interactive = usable && reveal >= 0.999 && exit <= 0.0001
    canvas.dataset.piecesInteractive = String(interactive)
    if (!interactive) {
      desired = pending = -1
      cancel()
      if (exit > 0.1 || reveal < 0.9) mix = 0
    }
    collection.visible = usable && reveal > 0.001 && !sceneGone
    selectionRing.visible = interactive && held < 0
    const highlighted = hover >= 0 ? hover : active
    if (loaded[highlighted]) {
      selectionRing.position.copy(loaded[highlighted].slot)
      selectionRing.position.y = 0.045
      selectionRing.scale.setScalar(assets[highlighted].kind === 'character' ? 0.19 : 0.46)
    }
    mix += ((desired >= 0 ? 1 : 0) - mix) * (1 - Math.exp(-dt * 12))
    if (held >= 0 && desired < 0 && mix < 0.002) {
      held = -1; mix = 0; notify()
      if (pending >= 0) { const next = pending; pending = -1; pick(next) }
    }
    if (!drag && held >= 0) {
      yaw += velocityX * dt * 60
      pitch = clamp(pitch + velocityY * dt * 60, -Math.PI / 9, Math.PI / 9)
      velocityX *= Math.exp(-dt * 9); velocityY *= Math.exp(-dt * 9)
    }
    loaded.forEach((piece, index) => {
      const asset = assets[index]
      if (asset.kind === 'character') piece.slot.set(slots[asset.slot].x - (portrait ? 0 : 1), 0.04, -slots[asset.slot].y)
      else piece.slot.set(portrait ? (index - 7.5) * 1.8 : 3.3 + (index - 6) % 2 * 1.15,
        0.04, portrait ? 5.3 : (Math.floor((index - 6) / 2) - 0.5) * 3.1)
      const enter = smooth((reveal - 0.2 - index * 0.035) / 0.45)
      const seat = smooth((reveal - 0.38 - index * 0.035) / 0.27)
      // One object moves at a time, after the box has arrived. Clear the rim
      // vertically before travelling; descend only when the whole object is inside.
      const leave = clamp((exit - 0.12) / 0.88 * assets.length - index, 0, 1)
      const g = piece.group
      g.scale.setScalar(1)
      g.position.copy(piece.slot)
      g.position.x += (1 - enter) * (index % 2 ? 1 : -1) * 0.65
      g.position.y += (1 - enter) * 1.3 + Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.08
      g.rotation.set(0, (1 - enter) * (index % 2 ? -0.7 : 0.7), (1 - enter) * 0.1, 'XYZ')
      piece.plate.position.y = piece.baseY + (1 - seat) * 20
      piece.plate.rotation.x = (1 - seat) * -0.25
      if (hover === index && held < 0 && interactive) { g.position.y += 0.025; g.rotation.y += 0.04 }
      if (leave > 0) {
        if (asset.kind === 'character') boxTarget.set(index % 2 ? 0.85 : -0.85, 0.13, 5.25 + Math.floor(index / 2) * 0.95)
        else boxTarget.set(0.11 - (index - 6) * markerShift, 0.124 + Math.sin(Math.PI / 3) * piece.depth / 2, 4.46 + (index - 6) * 0.91)
        if (portrait) boxTarget.z += piecePacking.portraitOffsetZ
        const lift = smooth(leave / 0.25)
        const travel = smooth((leave - 0.25) / 0.47)
        const lower = smooth((leave - 0.72) / 0.28)
        g.position.copy(piece.slot).lerp(boxTarget, travel)
        g.position.y = THREE.MathUtils.lerp(THREE.MathUtils.lerp(piece.slot.y, 2.3, lift), boxTarget.y, lower)
          + Math.sin(travel * Math.PI) * 0.25 * (1 - lower)
        if (asset.kind === 'character') g.rotation.set(-Math.sin(travel * Math.PI) * 0.35, 0, Math.sin(travel * Math.PI) * 0.08, 'XYZ')
        else g.rotation.set(0, travel * Math.PI / 2, -travel * Math.PI / 3, 'ZYX')
      }
      if (index === held) {
        g.scale.setScalar(THREE.MathUtils.lerp(1, 1.32 / piece.height, mix))
        g.position.lerp(heldTarget, mix)
        g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -0.1 + pitch, mix)
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, yaw, mix)
        g.rotation.z *= 1 - mix
      }
      g.position.y += offsetY
      g.visible = reveal > index * 0.035
    })
  }
  return {
    ready, collection, update, pick, putDown, setActive,
    highlight(index: number) { hover = index },
    projectLabels() {
      if (!options.onLayout) return
      collection.updateMatrixWorld(true)
      camera.updateMatrixWorld()
      options.onLayout(loaded.flatMap((piece, index) => {
        if (assets[index].kind !== 'strategy') return []
        const point = piece.group.localToWorld(new THREE.Vector3()).project(camera)
        return [{ index, x: (point.x + 1) * canvas.clientWidth / 2, y: (1 - point.y) * canvas.clientHeight / 2,
          visible: interactive && held < 0 && point.z > -1 && point.z < 1 }]
      }))
    },
    rotate(delta: number) { if (held >= 0) yaw += delta },
    resetRotation() { yaw = pitch = velocityX = velocityY = 0 },
    get focus() { return mix },
    get dimensions() { return held >= 0 ? loaded[held] : null },
    get interactive() { return interactive },
    dispose() {
      disposed = true; abort.abort(); clearTimeout(timer); cancel()
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel)
      canvas.removeEventListener('pointerleave', leave)
      // Piece resources are owned here, rather than the surrounding box scene.
      loaded.forEach(piece => disposePiece(piece.object)); loaded.length = 0; collection.removeFromParent()
      selectionRing.geometry.dispose(); selectionRing.material.dispose()
      canvas.style.cursor = ''; delete canvas.dataset.piecesInteractive; delete canvas.dataset.heldPiece; delete canvas.dataset.activePiece
    },
  }
}
