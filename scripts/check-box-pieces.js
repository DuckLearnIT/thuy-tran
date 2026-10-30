// Run in a local browser after the curtain opens. No backend calls.
(async () => {
  const deadline = performance.now() + 40000
  while (!document.querySelector('.landing-experience') || document.querySelector('.landing-experience').inert) {
    if (performance.now() > deadline) throw Error('Landing curtain did not open')
    await new Promise(requestAnimationFrame)
  }
  const results = []
  const check = (name, passed) => { results.push({ name, passed }); if (!passed) throw Error(name) }
  const frames = async (count = 2) => { for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame) }
  const until = async condition => { const end = performance.now() + 5000; while (!condition()) { if (performance.now() > end) throw Error('Motion did not settle'); await frames() } }
  const { pieces } = await import('/src/data/pieces.ts')
  check('Ten unique models with names from the current cards', pieces.length === 10 && new Set(pieces.map(p => p.model)).size === 10
    && pieces.filter(p => p.kind === 'character').length === 6 && pieces.every(p => p.name))
  check('Each model has three rendered fallback views', pieces.every(p => p.posters.length === 3 && p.posters.every(Boolean)))
  const gallery = document.querySelector('.piece-gallery')
  const canvas = document.querySelector('canvas[data-pieces-interactive]')
  if (gallery && !canvas) {
    const buttons = [...gallery.querySelectorAll('.piece-gallery-grid button')]
    check('Static gallery exposes all ten objects', buttons.length === 10)
    buttons[9].click(); await frames()
    const front = buttons[9].querySelector('img').src
    gallery.querySelectorAll('.piece-gallery-angles button')[2].click(); await frames()
    const back = buttons[9].querySelector('img')
    await back.decode()
    check('Static mode still changes to a real back render', back.src !== front && back.naturalWidth === 720)
    return results
  }
  const tr = window.ScrollTrigger.getAll().find(t => t.trigger?.querySelector?.('#top'))
  const tl = tr.animation
  const original = scrollY
  const stage = tr.trigger.querySelector('.bx-pieces-stage')
  const state = tl.getChildren().flatMap(t => t.targets?.() ?? []).find(s => 'piecesReveal' in s)
  const seek = async time => {
    scrollTo(0, tr.start + (tr.end - tr.start) * time / tl.duration())
    window.ScrollTrigger.update(); tr.getTween()?.progress(1)
    await frames(3); tr.getTween()?.progress(1); await frames(25)
  }
  try {
    const duration = (tl.labels['locations-out'] - tl.labels['pieces-in'])
    check('New piece beat adds four screens', Math.abs(duration / tl.duration() * 16 - 4) < .01)
    await seek(tl.labels['locations-showcase'])
    check('Locations show before assembly, controls stay inert', state.piecesReveal === 0 && stage.inert)
    await seek(tl.labels['pieces-in'] + duration * .15)
    check('Board tilts and pieces assemble before interaction', state.piecesReveal > .1 && state.piecesReveal < .99 && stage.inert)
    await seek(tl.labels['pieces-showcase'])
    check('All objects settle before controls unlock', state.piecesReveal === 1 && state.piecesExit === 0
      && canvas.dataset.piecesInteractive === 'true' && !stage.inert)
    stage.querySelectorAll('.piece-groups button')[1].click(); await frames(4)
    check('Strategy group exposes four direct named choices', stage.querySelectorAll('.piece-picker button').length === 4
      && canvas.dataset.activePiece === 'coc-ngam')
    const labels = [...stage.querySelectorAll('.piece-marker-label')]
    check('Four names follow their visible models without a panel', labels.length === 4 && labels.every(label => {
      const r = label.getBoundingClientRect(); return getComputedStyle(label).visibility === 'visible'
        && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight
    }) && !stage.querySelector('.piece-picker img'))
    stage.querySelector('.piece-marker-label[aria-label="Cầm xem Nghi Binh"]').click()
    await until(() => canvas.dataset.heldPiece === 'nghi-binh'); await frames(35)
    check('A projected name picks its model directly', canvas.dataset.heldPiece === 'nghi-binh'
      && stage.querySelector('.piece-picker [aria-pressed="true"]').getAttribute('aria-label') === 'Cầm xem Nghi Binh')
    const { scene, camera } = canvas.__boxScene
    const marker = scene.getObjectByName('nghi-binh')
    marker.updateWorldMatrix(true, true)
    let bounds
    marker.traverse(node => {
      if (!node.geometry) return
      node.geometry.computeBoundingBox()
      const box = node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld)
      bounds = bounds ? bounds.union(box) : box
    })
    const points = []
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = bounds.min.clone().set(x, y, z).project(camera)
      points.push({ x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2 })
    }
    const footprint = { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) }
    check('Held model stays framed and clear of title and actions', footprint.left >= 0 && footprint.right <= innerWidth
      && footprint.top >= 0 && footprint.bottom <= innerHeight && ['.bx-pieces-heading', '.piece-inspector', '.bx-piece-controls'].every(selector => {
        const rect = stage.querySelector(selector).getBoundingClientRect()
        return footprint.right <= rect.left || footprint.left >= rect.right || footprint.bottom <= rect.top || footprint.top >= rect.bottom
      }))
    stage.querySelector('[aria-label="Xoay phải"]').click(); await frames(3)
    check('Rotation control turns the actual model', marker.rotation.y > .3)
    stage.querySelector('.piece-front').click(); await frames(5)
    check('Front view resets model rotation', Math.abs(marker.rotation.y) < .01)
    check('Held controls remain inside the viewport', [...stage.querySelectorAll('button')].filter(b => getComputedStyle(b).visibility === 'visible').every(b => {
      const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight
    }))
    stage.querySelectorAll('.piece-groups button')[0].click()
    await until(() => canvas.dataset.heldPiece === 'nha-tuong'); await frames(4)
    check('Changing group returns the marker and picks a character', stage.querySelectorAll('.piece-picker button').length === 6)
    stage.querySelector('.piece-pick').click(); await until(() => !canvas.dataset.heldPiece); await frames(3)
    const pick = stage.querySelector('.piece-picker button')
    pick.focus()
    check('Keyboard can focus the pickup control', document.activeElement === pick)
    pick.click(); await until(() => Boolean(canvas.dataset.heldPiece)); await new Promise(resolve => setTimeout(resolve, 650))
    check('Pickup changes state without opening a modal', Boolean(canvas.dataset.heldPiece) && stage.querySelector('.piece-pick')?.textContent === 'Đặt xuống'
      && !document.querySelector('dialog[open]'))
    const first = canvas.dataset.heldPiece
    stage.querySelector('[aria-label="Vật tiếp"]').click(); await until(() => canvas.dataset.heldPiece && canvas.dataset.heldPiece !== first)
    check('Changing objects returns the old object before holding the next', canvas.dataset.heldPiece && canvas.dataset.heldPiece !== first)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await until(() => !canvas.dataset.heldPiece); await frames()
    check('Escape puts the object back', !canvas.dataset.heldPiece && !stage.querySelector('.piece-pick'))
    pick.click(); await frames(40)
    await seek(tl.labels['pieces-out'] + duration * .13)
    check('Scrolling out returns held object and disables interaction', !canvas.dataset.heldPiece && stage.inert && canvas.dataset.piecesInteractive === 'false')
    await seek(tl.labels['locations-out'] + .55)
    check('Locations pack only after the pieces', state.piecesExit === 1 && state.locationsExit > 0)
    check('Packed standees remain in the open box instead of disappearing', pieces.every(p => {
      const node = scene.getObjectByName(p.id); return node.visible && node.parent.visible
    }))
    await seek(tl.labels['box-away'])
    check('Dismissal waits until the deck is packed and the lid is closed', state.locationsExit === 1 && state.boxClose > .999 && state.boxDismiss < .01)
    await seek(tl.labels['box-gone'] + .03)
    check('The next chapter cannot retain a box or stale canvas', state.boxDismiss === 1 && getComputedStyle(canvas).visibility === 'hidden'
      && !scene.getObjectByName('box-base').visible && !scene.getObjectByName('box-lid').visible)
    await seek(tl.labels['pieces-showcase'])
    check('Reverse restores the full display without a held object', state.piecesExit === 0 && state.locationsExit === 0 && !canvas.dataset.heldPiece)
    window.ScrollTrigger.refresh(); await seek(tl.labels['pieces-showcase'])
    check('Refresh preserves the interactive display', canvas.dataset.piecesInteractive === 'true')
    check('Controls fit in the viewport', [...stage.querySelectorAll('button')].filter(b => getComputedStyle(b).visibility === 'visible').every(b => {
      const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight
    }))
  } finally { scrollTo(0, original); window.ScrollTrigger.update(); tr.getTween()?.progress(1) }
  return results
})()
