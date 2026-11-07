import * as THREE from 'three'
import gsap from 'gsap'
import { loadImage } from '../assetQueue'
import { boxArt } from '../data/box'
import { cards } from '../data/cards'
import { createPrintedBox, boxDimensions } from './printedBox'

/** The same physical shells as the landing. Render only while moving/resizing. */
export async function createPreorderBoxScene(canvas: HTMLCanvasElement, signal: AbortSignal) {
  let timer: ReturnType<typeof setTimeout>
  let abort: () => void = () => {}
  const images = await Promise.race([
    Promise.all([boxArt.atlasSmall, ...cards.map(card => card.image)].map(loadImage)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(Error('Box artwork timed out')), 8000)
      abort = () => reject(new DOMException('Aborted', 'AbortError'))
      signal.addEventListener('abort', abort, { once: true })
      if (signal.aborted) abort()
    }),
  ]).finally(() => { clearTimeout(timer!); signal.removeEventListener('abort', abort) })
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene(), root = new THREE.Group()
  scene.add(root, new THREE.HemisphereLight(0xfff6e8, 0x31475b, 1.8))
  const light = new THREE.DirectionalLight(0xffffff, 2.5)
  light.position.set(-3, 10, 7); light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  Object.assign(light.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7, near: .1, far: 30 })
  light.shadow.bias = -.0005; light.shadow.normalBias = .015
  scene.add(light)
  const atlas = new THREE.Texture(images[0])
  atlas.colorSpace = THREE.SRGBColorSpace; atlas.needsUpdate = true
  atlas.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
  const box = createPrintedBox(atlas)
  root.add(box.base, box.lid)
  const paper = new THREE.Shape()
  const w = 1.45, h = w * 2078 / 1500, r = .045
  paper.moveTo(-w / 2 + r, -h / 2)
  paper.lineTo(w / 2 - r, -h / 2); paper.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  paper.lineTo(w / 2, h / 2 - r); paper.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  paper.lineTo(-w / 2 + r, h / 2); paper.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  paper.lineTo(-w / 2, -h / 2 + r); paper.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  const geometry = new THREE.ShapeGeometry(paper, 4)
  const positions = geometry.attributes.position, uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, positions.getX(i) / w + .5, positions.getY(i) / h + .5)
  const deck = cards.map((card, i) => {
    // Full source art stays in the shared loader; this small canvas is the GPU copy.
    const face = document.createElement('canvas')
    face.width = 512; face.height = Math.round(512 * images[i + 1].height / images[i + 1].width)
    face.getContext('2d')!.drawImage(images[i + 1], 0, 0, face.width, face.height)
    const texture = new THREE.CanvasTexture(face); texture.colorSpace = THREE.SRGBColorSpace
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }))
    mesh.name = `preorder-card-${card.id}`; mesh.castShadow = true; root.add(mesh)
    return mesh
  })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.ShadowMaterial({ opacity: .16 }))
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.025; ground.receiveShadow = true; scene.add(ground)
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 80)
  const direction = new THREE.Vector3(2.5, 14, 7.5).normalize()
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize()
  const up = new THREE.Vector3().crossVectors(direction, right).normalize()
  const bounds = new THREE.Box3(), center = new THREE.Vector3(), point = new THREE.Vector3()
  const state = { open: 0, tilt: 0 }
  let disposed = false
  const smooth = (n: number) => { n = THREE.MathUtils.clamp(n, 0, 1); return n * n * (3 - 2 * n) }
  const render = () => {
    if (disposed || !canvas.clientWidth || !canvas.clientHeight) return
    const t = state.open, lift = smooth(t / .22), slide = smooth((t - .22) / .42), lower = smooth((t - .64) / .36)
    box.lid.position.set(-3.65 * slide, 1.7 * lift * (1 - lower) + .04 * lower, -.25 * slide)
    box.lid.rotation.y = -.12 * slide
    const fan = smooth((t - .48) / .45)
    deck.forEach((mesh, i) => {
      mesh.position.set(THREE.MathUtils.lerp(i * .008, (i - 2.5) * .34 + .1, fan),
        THREE.MathUtils.lerp(boxDimensions.floor + .025 + i * .012, 1.05 + i * .025, fan),
        THREE.MathUtils.lerp(0, .25 + i * .02, fan))
      mesh.rotation.set(THREE.MathUtils.lerp(-Math.PI / 2, -1.04, fan), 0, -(i - 2.5) * .07 * fan)
    })
    root.rotation.y = state.tilt
    root.updateMatrixWorld(true)
    bounds.setFromObject(root); bounds.getCenter(center)
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), aspect = camera.aspect
    let distance = 0
    for (let i = 0; i < 8; i++) {
      point.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z).sub(center)
      distance = Math.max(distance, point.dot(direction) + Math.max(Math.abs(point.dot(right)) / (tan * aspect * .9), Math.abs(point.dot(up)) / (tan * .9)))
    }
    camera.position.copy(center).addScaledVector(direction, distance)
    camera.lookAt(center); camera.updateMatrixWorld()
    renderer.render(scene, camera)
  }
  const resize = () => {
    if (!canvas.clientWidth || !canvas.clientHeight) return
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix(); render()
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize()
  const inspection = canvas as HTMLCanvasElement & { __preorderBox?: unknown }
  if (import.meta.env.DEV) inspection.__preorderBox = { scene, root, renderer, camera, state, deck, box }
  return {
    setOpen(open: boolean, instant = false) {
      gsap.killTweensOf(state)
      if (instant) { state.open = +open; state.tilt = 0; render() }
      else gsap.to(state, { open: +open, tilt: 0, duration: 1.1, ease: 'power2.inOut', onUpdate: render })
    },
    tilt(value: number) { gsap.to(state, { tilt: value * .06, duration: .35, overwrite: 'auto', onUpdate: render }) },
    dispose() {
      disposed = true; gsap.killTweensOf(state); observer.disconnect(); delete inspection.__preorderBox
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
      scene.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return
        geometries.add(node.geometry)
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          materials.add(material)
          if (material.map) textures.add(material.map)
        }
      })
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      light.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss()
    },
  }
}
