import { Vector2, Vector3, Raycaster, Box3 } from 'three'
// Local browser QA: await (await import('/scripts/check-box-print.js')).checkBoxPrint()
export async function checkBoxPrint() {
  const { boxPrint } = await import('/src/data/box.ts')
  const ratio = boxPrint.millimetres.width / boxPrint.millimetres.depth
  const [frontWidth, frontHeight] = boxPrint.frontPixels
  const results = []
  const check = (name, passed) => { results.push({ name, passed }); if (!passed) throw Error(name) }
  const wait = async condition => {
    const end = performance.now() + 25000
    while (!condition()) { if (performance.now() > end) throw Error('Printed box did not become ready'); await new Promise(requestAnimationFrame) }
  }
  const rawAtlasRequests = () => performance.getEntriesByType('resource').filter(r =>
    /print-atlas(?:-small)?\.webp/.test(r.name) && !new URL(r.name).searchParams.has('import'))
  const preorder = document.querySelector('.po-page')
  if (preorder) {
    const image = preorder.querySelector('.po-product img')
    await wait(() => image.complete && image.naturalWidth > 0)
    check('Checkout uses the revised print face', image.naturalWidth === frontWidth && image.naturalHeight === frontHeight)
    await wait(() => preorder.querySelector('.po-tableau').dataset.renderer !== 'loading'
      || getComputedStyle(preorder.querySelector('.po-stage')).display === 'none')
    const scene = preorder.querySelector('canvas').__preorderBox
    if (scene) {
      check('Checkout uses two genuine shells with one shared material', scene.box.base.children.length === 1 && scene.box.lid.children.length === 1
        && scene.box.base.children[0].material === scene.box.lid.children[0].material)
      check('Checkout uses the small atlas only', scene.box.lid.children[0].material.map.image.width === 1024)
      check('Checkout has six separate current character faces', scene.deck.length === 6 && new Set(scene.deck.map(m => m.name)).size === 6)
      check('GPU card copies are bounded at 512px wide', scene.deck.every(m => m.material.map.image.width === 512))
      const geometry = scene.box.lid.children[0].geometry
      geometry.computeBoundingBox()
      const size = geometry.boundingBox.getSize(new Vector3())
      check('Box geometry follows the new PDF ratio', Math.abs(size.x / size.z - ratio) < .005)
      check('WebGL remains healthy', !scene.renderer.getContext().isContextLost())
    } else if (getComputedStyle(preorder.querySelector('.po-stage')).display === 'none') {
      check('Collapsed mobile preview defers WebGL and atlas', rawAtlasRequests().length === 0)
    } else {
      check('Unavailable WebGL displays real source art', preorder.querySelector('.po-tableau').dataset.renderer === 'fallback')
    }
  } else if (document.querySelector('.box-locations-static')) {
    const image = document.querySelector('section[aria-label="Bìa hộp"] img')
    await wait(() => image.complete && image.naturalWidth > 0)
    check('Fallback uses the exact new print face', image.naturalWidth === frontWidth && image.naturalHeight === frontHeight)
    check('Fallback does not request a 3D print atlas', rawAtlasRequests().length === 0)
  } else {
    const canvas = document.querySelector('canvas')
    await wait(() => canvas?.__boxScene?.scene.getObjectByName('box-lid')?.children[0].material.map.image.width >= 1024)
    const { scene, renderer } = canvas.__boxScene
    const base = scene.getObjectByName('box-base'), lid = scene.getObjectByName('box-lid')
    check('Only two opaque shells render the physical box', base.children.length === 1 && lid.children.length === 1
      && !base.children[0].material.transparent && !lid.children[0].material.transparent)
    check('Both shells share one material and atlas', base.children[0].material === lid.children[0].material)
    check('The full box has only 64 triangles', [base, lid].reduce((n, g) => n + g.children[0].geometry.index.count / 3, 0) === 64)
    const image = lid.children[0].material.map.image
    check('Initial atlas size matches viewport', image.width === (canvas.clientWidth < 700 ? 1024 : 2048))
    check('Physical box retains separate hollow collision parts', base.children[0].userData.collisionBoxes.length === 5
      && lid.children[0].userData.collisionBoxes.length === 5)
    check('WebGL context remains healthy', !renderer.getContext().isContextLost())
  }
  return results
}

// Local layout regression: neither state may cover its control or the order form.
export async function checkPreorderBoxLayout() {
  const stage = document.querySelector('.po-stage')
  const toggle = document.querySelector('.po-preview-toggle')
  const original = stage.dataset.open === 'true'
  const results = []
  const check = (name, passed) => { results.push({ name, passed }); if (!passed) throw Error(name) }
  const sceneMoving = value => {
    const state = stage.querySelector('canvas').__preorderBox?.state
    return !!state && (window.gsap?.isTweening(state) || Math.abs(state.open - +value) > .0001)
  }
  const settle = async value => {
    const end = performance.now() + 12000
    do {
      await new Promise(requestAnimationFrame)
      if (performance.now() > end) throw Error('Box motion did not settle')
    } while (stage.dataset.open !== String(value)
      || stage.getAnimations({ subtree: true }).some(a => a.playState === 'running')
      || window.gsap?.isTweening(stage) || sceneMoving(value)
      || (getComputedStyle(stage).display !== 'none' && stage.querySelector('.po-tableau').dataset.renderer === 'loading'))
    await new Promise(requestAnimationFrame)
  }
  const setOpen = async value => {
    if ((stage.dataset.open === 'true') !== value) {
      const control = getComputedStyle(stage).display === 'none' ? toggle : stage.querySelector('.po-open')
      control.click()
    }
    await settle(value)
  }
  try {
    for (const open of [false, true]) {
      await setOpen(open)
      if (getComputedStyle(stage).display === 'none') continue
      const area = stage.querySelector('.po-tableau').getBoundingClientRect()
      const button = stage.querySelector('.po-open').getBoundingClientRect()
      const title = document.querySelector('.po-title').getBoundingClientRect()
      const form = document.querySelector('.po-order').getBoundingClientRect()
      const canvas = stage.querySelector('canvas'), scene = canvas.__preorderBox
      let rects
      if (scene) {
        scene.root.updateMatrixWorld(true)
        rects = [scene.box.base.children[0], scene.box.lid.children[0], ...scene.deck].map(mesh => {
          const p = mesh.geometry.attributes.position, v = new Vector3()
          let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity
          for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld).project(scene.camera)
            const x = area.left + (v.x + 1) / 2 * area.width, y = area.top + (1 - v.y) / 2 * area.height
            left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y)
          }
          return { left, right, top, bottom }
        })
        const ray = new Raycaster(), point = new Vector3(), screen = new Vector2()
        const visible = scene.deck.map(mesh => {
          let samples = 0
          for (let x = -.6; x <= .6; x += .12) for (let y = -.8; y <= .8; y += .16) {
            point.set(x, y, 0).applyMatrix4(mesh.matrixWorld).project(scene.camera)
            screen.set(point.x, point.y); ray.setFromCamera(screen, scene.camera)
            if (ray.intersectObjects([scene.box.base, scene.box.lid, ...scene.deck], true)[0]?.object === mesh) samples++
          }
          return samples
        })
        check(`${open ? 'Open' : 'Closed'}: actual depth gives the right visibility`, open ? visible.every(n => n >= 6) : visible.every(n => n === 0))
        if (open) check('Open lid is physically clear of the base', !new Box3().setFromObject(scene.box.lid).intersectsBox(new Box3().setFromObject(scene.box.base)))
      } else rects = [...stage.querySelectorAll('.po-box-fallback img')].map(el => el.getBoundingClientRect())
      const state = open ? 'Open' : 'Closed'
      check(`${state}: artwork fits the scene horizontally`, rects.every(r => r.left >= area.left - 1 && r.right <= area.right + 1))
      check(`${state}: actual geometry is not cropped vertically`, rects.every(r => r.top >= area.top - 1 && r.bottom <= area.bottom + 1))
      check(`${state}: artwork clears the heading`, rects.every(r => r.top >= title.bottom + 12))
      check(`${state}: artwork leaves a gap above the button`, rects.every(r => r.bottom <= button.top - 16))
      check(`${state}: artwork stays clear of the form`, rects.every(r => r.right <= form.left - 12 || r.bottom <= form.top - 12))
    }
  } finally { await setOpen(original) }
  return { viewport: `${innerWidth}x${innerHeight}`, results }
}

export async function checkPreorderBoxMotion() {
  const stage = document.querySelector('.po-stage'), scene = stage.querySelector('canvas').__preorderBox
  if (!scene) throw Error('Open a working 3D preview first')
  const results = [], original = stage.dataset.open === 'true'
  const check = (name, passed) => { results.push({ name, passed }); if (!passed) throw Error(name) }
  const wait = async condition => {
    const end = performance.now() + 5000
    while (!condition()) { if (performance.now() > end) throw Error('Motion timeout'); await new Promise(requestAnimationFrame) }
  }
  const setOpen = value => { if ((stage.dataset.open === 'true') !== value) stage.querySelector('.po-open').click() }
  try {
    setOpen(false); await wait(() => scene.state.open < .0001)
    setOpen(true)
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await wait(() => scene.state.open > .14)
      check('Lid lifts clear before sliding sideways', scene.box.lid.position.y > .8 && Math.abs(scene.box.lid.position.x) < .02)
      check('Cards wait below the raised lid', scene.deck.every(mesh => mesh.position.y < .2))
      setOpen(false); await wait(() => scene.state.open < .0001)
      check('Reversing mid-motion seats the lid exactly', scene.box.lid.position.length() < .0001)
      setOpen(true)
    }
    await wait(() => scene.state.open > .9999 && !window.gsap.isTweening(scene.state))
    const frame = scene.renderer.info.render.frame, end = performance.now() + 350
    await wait(() => performance.now() >= end)
    check('No idle GPU rendering', scene.renderer.info.render.frame === frame)
    check('Pixel ratio stays bounded', scene.renderer.getPixelRatio() <= 1.5)
  } finally { setOpen(original); await wait(() => Math.abs(scene.state.open - +original) < .0001) }
  return results
}

// Run with the lid closed. Compare GPU pixels on the paper area to the actual WebP.
export async function checkBoxPrintColor() {
  const canvas = document.querySelector('canvas')
  const scene = canvas.__boxScene ?? canvas.__preorderBox
  const { boxDimensions: d } = await import('/src/components/printedBox.ts')
  const { default: layout } = await import('/src/assets/box/layout.json')
  const lid = scene.scene.getObjectByName('box-lid').children[0]
  const image = lid.material.map.image, source = document.createElement('canvas')
  source.width = image.width; source.height = image.height
  const ctx = source.getContext('2d'); ctx.drawImage(image, 0, 0)
  const [x, y, w, h] = layout.rects.front, scale = image.width / layout.atlasSize
  scene.renderer.render(scene.scene, scene.camera)
  const gl = scene.renderer.getContext(), pixel = new Uint8Array(4), point = new Vector3(), samples = []
  for (const u of [.35, .5, .65]) for (const v of [.58, .61, .64]) {
    point.set((u - .5) * d.width, d.height, (.5 - v) * d.depth)
    lid.localToWorld(point).project(scene.camera)
    gl.readPixels(Math.round((point.x + 1) / 2 * canvas.width), Math.round((point.y + 1) / 2 * canvas.height), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
    const patch = ctx.getImageData(Math.round((x + .5 + u * (w - 1)) * scale) - 1,
      Math.round((y + .5 + (1 - v) * (h - 1)) * scale) - 1, 3, 3).data
    const reference = [0, 1, 2].map(c => Math.round(Array.from({ length: 9 }, (_, i) => patch[i * 4 + c]).reduce((a, b) => a + b, 0) / 9))
    const rendered = Array.from(pixel.slice(0, 3))
    if (pixel[3] !== 255) throw Error('Colour sample misses the opaque print face')
    samples.push({ reference, rendered, maxDifference: Math.max(...rendered.map((n, i) => Math.abs(n - reference[i]))) })
  }
  const maxDifference = Math.max(...samples.map(s => s.maxDifference))
  if (maxDifference > 12) throw Error(`Printed colour differs from the WebP by ${maxDifference}/255`)
  return { maxDifference, samples }
}
