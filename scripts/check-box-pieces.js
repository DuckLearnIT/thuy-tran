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
    const pick = stage.querySelector('.piece-pick')
    pick.focus()
    check('Keyboard can focus the pickup control', document.activeElement === pick)
    pick.click(); await until(() => Boolean(canvas.dataset.heldPiece)); await new Promise(resolve => setTimeout(resolve, 650))
    check('Pickup changes state without opening a modal', Boolean(canvas.dataset.heldPiece) && pick.textContent === 'Đặt xuống'
      && !document.querySelector('dialog[open]'))
    const first = canvas.dataset.heldPiece
    stage.querySelector('[aria-label="Vật tiếp"]').click(); await until(() => canvas.dataset.heldPiece && canvas.dataset.heldPiece !== first)
    check('Changing objects returns the old object before holding the next', canvas.dataset.heldPiece && canvas.dataset.heldPiece !== first)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await until(() => !canvas.dataset.heldPiece); await frames()
    check('Escape puts the object back', !canvas.dataset.heldPiece && pick.textContent === 'Cầm lên')
    pick.click(); await frames(40)
    await seek(tl.labels['pieces-out'] + duration * .13)
    check('Scrolling out returns held object and disables interaction', !canvas.dataset.heldPiece && stage.inert && canvas.dataset.piecesInteractive === 'false')
    await seek(tl.labels['locations-out'] + .55)
    check('Locations pack only after the pieces', state.piecesExit === 1 && state.locationsExit > 0)
    const scene = canvas.__boxScene.scene
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
    check('Controls fit in the viewport', [...stage.querySelectorAll('button')].every(b => {
      const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight
    }))
  } finally { scrollTo(0, original); window.ScrollTrigger.update(); tr.getTween()?.progress(1) }
  return results
})()
