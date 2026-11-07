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
    const image = preorder.querySelector('.po-lid img')
    await wait(() => image.complete && image.naturalWidth > 0)
    check('Checkout uses the revised print face', image.naturalWidth === frontWidth && image.naturalHeight === frontHeight)
    check('Checkout displays both printed edges', [...preorder.querySelectorAll('.po-lid-side')].length === 2
      && [...preorder.querySelectorAll('.po-lid-side')].every(el => getComputedStyle(el).backgroundImage !== 'none'))
    check('Checkout keeps lightweight CSS 3D without allocating a canvas', !preorder.querySelector('canvas') && rawAtlasRequests().length === 0)
    const box = preorder.querySelector('.po-box')
    check('Checkout image geometry follows the print ratio', Math.abs(box.offsetWidth / box.offsetHeight - ratio) < .005)
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
  const settle = async () => {
    const end = performance.now() + 5000
    do {
      await new Promise(requestAnimationFrame)
      if (performance.now() > end) throw Error('Box motion did not settle')
    } while (stage.getAnimations({ subtree: true }).some(a => a.playState === 'running')
      || window.gsap?.isTweening(stage))
    await new Promise(requestAnimationFrame)
  }
  const setOpen = async value => {
    if ((stage.dataset.open === 'true') !== value) {
      const control = getComputedStyle(stage).display === 'none' ? toggle : stage.querySelector('.po-open')
      control.click()
    }
    await settle()
  }
  try {
    for (const open of [false, true]) {
      await setOpen(open)
      if (getComputedStyle(stage).display === 'none') continue
      const area = stage.querySelector('.po-tableau').getBoundingClientRect()
      const button = stage.querySelector('.po-open').getBoundingClientRect()
      const title = document.querySelector('.po-title').getBoundingClientRect()
      const form = document.querySelector('.po-order').getBoundingClientRect()
      const images = [...stage.querySelectorAll(open ? '.po-box-base,.po-lid,.po-lid-side,.po-hand img' : '.po-box-base,.po-lid,.po-lid-side')]
      const rects = images.map(el => el.getBoundingClientRect())
      const state = open ? 'Open' : 'Closed'
      check(`${state}: artwork fits the scene horizontally`, rects.every(r => r.left >= area.left - 1 && r.right <= area.right + 1))
      check(`${state}: artwork clears the heading`, rects.every(r => r.top >= title.bottom + 12))
      check(`${state}: artwork leaves a gap above the button`, rects.every(r => r.bottom <= button.top - 16))
      check(`${state}: artwork stays clear of the form`, rects.every(r => r.right <= form.left - 12 || r.bottom <= form.top - 12))
    }
  } finally { await setOpen(original) }
  return { viewport: `${innerWidth}x${innerHeight}`, results }
}
