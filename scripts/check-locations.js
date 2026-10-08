// Paste into DevTools after the curtain opens. Leaves the spiral on card 13.
(async () => {
  const frame = () => new Promise(requestAnimationFrame)
  let layout = '', stable = performance.now()
  while (performance.now() - stable < 400) {
    await frame()
    const next = window.ScrollTrigger.getAll().map((st) => `${st.start}:${st.end}`).join(',')
    if (next !== layout) { layout = next; stable = performance.now() }
  }
  const root = document.querySelector('#dia-diem')
  const { locations } = await import('/src/data/locations.ts')
  const { cards } = await import('/src/data/cards.ts')
  const { strategies } = await import('/src/data/strategies.ts')
  // Vite versions module URLs after edits; read the actual running loader instance.
  const loaderUrl = performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === '/src/preloadAssets.ts')?.name
  const { preloadedImages } = await import(loaderUrl ?? '/src/preloadAssets.ts')
  const scene = root.querySelector('.spiral-scene')
  const faces = [...root.querySelectorAll('.spiral-face')]
  const triggers = window.ScrollTrigger.getAll().filter((st) => st.trigger === root)
  const st = triggers[0]
  const staticScene = root.classList.contains('spiral-static')
  let passed = 0
  const check = (ok, message) => { if (!ok) throw Error(message); passed++ }
  const settle = async (condition) => {
    const deadline = performance.now() + 5000
    while (!condition() && performance.now() < deadline) {
      await frame()
      // Finish scrub poses deterministically; hidden QA tabs throttle GSAP's clock.
      st?.getTween()?.progress(1)
    }
    check(condition(), 'Interaction settles')
    await frame()
  }
  const selected = () => faces.findIndex((face) => face.hasAttribute('aria-current'))
  const resting = () => !st || (!st.getTween()?.isActive?.() && !st.getTween(true)?.isActive?.())
  const scrub = async (progress) => {
    window.scrollTo({ top: st.start + progress * (st.end - st.start), behavior: 'instant' })
    await frame()
    window.ScrollTrigger.update()
    await settle(() => Math.abs(st.progress - progress) < 0.0005 && resting())
  }
  const pick = async (index) => {
    if (st) {
      const snap = st.getTween(true)
      if (snap) snap.kill()
      await scrub((0.65 + index / 23 * 4) / st.animation.duration())
    } else {
      faces[selected()].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
      await settle(() => selected() === 0)
      for (let i = 1; i <= index; i++) {
        faces[selected()].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        await settle(() => selected() === i)
      }
    }
    await settle(() => selected() === index && resting())
  }
  check(faces.length === 24, 'Exactly 24 location cards')
  check(new Set(locations.map(card => card.image)).size === 24 && new Set(locations.flatMap(card => [card.image, card.back])).size === 48, '24 distinct F1/F2 pairs replace every placeholder')
  check(locations.every(card => [card.image, card.back].every(src => {
    const image = preloadedImages.get(src)
    return image?.complete && image.naturalWidth === image.naturalHeight && src.includes('.webp')
  })), 'Both faces are decoded before the experience opens')
  check(!root.querySelector('.spiral-folio'), 'Number badges are removed from the artwork')
  check(locations.every(card => card.meaning && card.story && (!card.characterId || cards.some(c => c.id === card.characterId))
    && (!card.strategyId || strategies.some(s => s.id === card.strategyId))), 'Meaning, stories and current game references are complete')
  check(triggers.length === (staticScene ? 0 : 1), 'Only one chapter trigger, none for static scene')
  check(faces.every((face) => { const img = face.querySelector('img'); return img.complete && img.naturalWidth === img.naturalHeight && img.loading === 'eager' }), 'All square artwork is ready before browsing')
  check(getComputedStyle(scene).touchAction.includes('pan-y'), 'Vertical touch scrolling remains native')
  check(!root.querySelector('input, .spiral-browse, .spiral-zoom'), 'Separate browsing controls are removed')
  check(getComputedStyle(scene).maskImage === 'none', 'No horizontal fade band around the scene')
  check(getComputedStyle(document.querySelector('.grain'), '::after').backgroundRepeat === 'no-repeat', 'Paper texture has no repeating tile edges')
  if (st) {
    check(st.end - st.start <= innerHeight * 4.21, 'Chapter stays within 4.2 screen lengths')
    await scrub(0)
    check(scene.inert && faces[0].getBoundingClientRect().top > innerHeight, 'Entrance rolls cards in from below the screen')
    check(+getComputedStyle(root.querySelector('.spiral-world')).opacity === 1, 'Entrance uses movement instead of fading')
  } else root.scrollIntoView({ block: 'start', behavior: 'instant' })
  await pick(12)
  check(!scene.inert, 'Spiral is interactive')
  check(faces.every((face) => face.querySelectorAll('.spiral-slice').length === 7), 'Card surfaces use seven curved strips')
  await settle(() => {
    const r = faces[12].getBoundingClientRect()
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.spiral-face') === faces[12]
  })
  const r = faces[12].getBoundingClientRect()
  check(Math.abs(r.width - r.height) < 1 && r.width >= 120 && r.left >= 0 && r.right <= innerWidth + 1, 'Front card is square and fits the viewport')
  check(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.spiral-face') === faces[12], 'Front card is clickable')
  check(faces.filter((face) => face.tabIndex === 0).length === 1, 'Only current card enters the tab sequence')
  if (st) {
    const matrix = (i) => new DOMMatrix(getComputedStyle(faces[i].parentElement).transform)
    check(matrix(11).m43 < 0 && matrix(10).m43 < matrix(11).m43, 'Cards curve progressively into 3D depth')
    check(matrix(11).m41 < matrix(12).m41 && matrix(13).m41 > matrix(12).m41, 'Spiral wraps around the selected card')
  }
  else check(faces.filter((face) => getComputedStyle(face.parentElement).visibility === 'visible').length === 1, 'Static view presents one clear card')
  faces[12].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  await settle(() => selected() === 13 && resting())
  await pick(23)
  faces[23].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  await settle(() => resting())
  check(selected() === 23, 'Last card clamps forward navigation')
  await pick(0)
  faces[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  await settle(() => resting())
  check(selected() === 0, 'First card clamps backward navigation')
  await pick(12)
  faces[13].click()
  await settle(() => selected() === 13 && resting())
  const width = faces[13].getBoundingClientRect().width
  faces[13].click()
  await settle(() => faces[13].getBoundingClientRect().width > width * 1.15)
  const zoom = faces[13].getBoundingClientRect()
  check(faces[13].getAttribute('aria-expanded') === 'true' && zoom.left >= 0 && zoom.right <= innerWidth + 1 && zoom.top >= 0 && zoom.bottom <= innerHeight, 'Zoom is accessible and stays on screen')
  const detail = root.querySelector('.location-detail')
  await settle(() => detail.open)
  check(detail.matches(':modal') && detail.contains(document.activeElement), 'Detail opens as a native modal with focus inside')
  const detailBounds = detail.getBoundingClientRect()
  check(detailBounds.left >= 0 && detailBounds.right <= innerWidth + 1 && detailBounds.top >= 0 && detailBounds.bottom <= innerHeight + 1
    && detail.scrollWidth <= detail.clientWidth + 1, 'Detail fits the viewport without horizontal overflow')
  check(detail.querySelector('h3').textContent === locations[13].name && detail.querySelector('.location-meaning').textContent === locations[13].meaning, 'Detail matches the chosen location and source meaning')
  check(detail.querySelectorAll('.location-flip img')[1].src.endsWith(locations[13].back), 'The correct F2 is paired with F1')
  detail.querySelector('.location-face-actions button').click()
  await settle(() => detail.querySelector('.location-flip').dataset.back === 'true')
  check(detail.querySelectorAll('.location-flip img')[1].getAttribute('aria-hidden') === 'false', 'Flipping exposes the back face to assistive technology')
  detail.querySelector('.location-face-actions button').click()
  await settle(() => detail.querySelector('.location-flip').dataset.back === 'false')
  faces[13].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settle(() => faces[13].getAttribute('aria-expanded') === 'false')
  check(!detail.open && document.documentElement.style.overflow !== 'hidden', 'Escape closes detail and restores scrolling')
  faces[13].focus({ preventScroll: true })
  await settle(() => document.activeElement === faces[13])
  faces[13].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  await settle(() => selected() === 23 && document.activeElement === faces[23] && resting())
  faces[23].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  await settle(() => selected() === 0 && document.activeElement === faces[0] && resting())
  if (st) {
    await scrub(1)
    check(scene.inert && +getComputedStyle(root.querySelector('.spiral-world')).opacity < 0.01, 'Exit removes the spiral and disables focus')
  }
  await pick(12)
  check(!scene.inert && faces[12].getAttribute('aria-current') === 'true', 'Reverse traversal restores selection')
  for (let index = 0; index < locations.length; index++) {
    const character = cards.find(card => card.id === locations[index].characterId)
    if (!character) continue
    await pick(index)
    faces[index].click()
    await settle(() => detail.open)
    const label = [character.prefix, character.role].filter(Boolean).join(' ')
    check(detail.querySelector('.location-game-use').textContent === `Nơi xuất phát · ${label}`, 'Starting character name matches its current card')
    detail.querySelector('.location-close').click()
    await settle(() => !detail.open)
  }
  await pick(12)
  check(document.documentElement.scrollWidth <= innerWidth, 'No horizontal page overflow')
  return { passed, viewport: `${innerWidth}×${innerHeight}`, staticScene }
})()
