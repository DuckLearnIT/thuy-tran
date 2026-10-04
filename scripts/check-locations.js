// Paste into DevTools on the running site after the loading curtain opens.
// Also works with reduced motion enabled. Leaves the chapter at its overview.
(async () => {
  // A resize can rebuild pins, then schedule a global refresh. Wait for both.
  let lastLayout = ''
  let stableSince = performance.now()
  while (performance.now() - stableSince < 400) {
    await new Promise(requestAnimationFrame)
    const layout = window.ScrollTrigger.getAll().map((st) => `${st.start}:${st.end}`).join(',')
    if (layout !== lastLayout) { lastLayout = layout; stableSince = performance.now() }
  }
  const root = document.querySelector('#dia-diem')
  const board = root?.querySelector('.places-board')
  const cards = [...(root?.querySelectorAll('.place-card') || [])]
  const checks = []
  const check = (condition, message) => {
    if (!condition) throw new Error(message)
    checks.push(message)
  }
  const frame = () => new Promise(requestAnimationFrame)
  const settle = async (condition) => {
    const deadline = performance.now() + 4000
    while (!condition() && performance.now() < deadline) await frame()
    check(condition(), 'UI settles before timeout')
  }
  const triggers = window.ScrollTrigger.getAll().filter((st) => st.trigger === root)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const staticBoard = reduced || matchMedia('(max-height: 560px)').matches
  check(cards.length === 24, 'Exactly 24 cards')
  check(triggers.length === (staticBoard ? 0 : 1), 'One chapter trigger; static board on reduced motion or short screens')
  const st = triggers[0]
  const scroll = async (progress) => {
    window.scrollTo({ top: st.start + (st.end - st.start) * progress, behavior: 'instant' })
    await settle(() => Math.abs(st.progress - progress) < 0.002 && Math.abs(st.animation.progress() - st.progress) < 0.0001)
    await frame()
  }
  if (st) {
    await scroll(0)
    check(board.inert, 'Entrance cards cannot receive focus')
    const start = cards[0].getBoundingClientRect()
    await scroll(0.4)
    const waves = root.querySelectorAll('.place-wave')
    check(new DOMMatrix(getComputedStyle(waves[0]).transform).m42 < -5
      && Math.abs(new DOMMatrix(getComputedStyle(waves[23]).transform).m42) < 1, 'Wave reaches the first corner before the last')
    await scroll(0.58)
    check(Math.abs(cards[0].getBoundingClientRect().left - start.left) > 10, 'Piles unfold into the board')
  } else root.scrollIntoView({ block: 'start' })
  check(!board.inert, 'Overview is interactive')
  check(cards.every((card) => {
    const r = card.getBoundingClientRect()
    return Math.abs(r.width - r.height) < 1 && r.width >= 44 && r.left >= 0 && r.right <= innerWidth + 1
  }), 'Cards remain square, fit horizontally and have touch targets')
  const width = cards[13].getBoundingClientRect().width
  cards[13].click()
  await settle(() => cards[13].getBoundingClientRect().width > width * 1.7)
  check(cards[13].getAttribute('aria-expanded') === 'true', 'Chosen card expands')
  check(Math.abs(new DOMMatrix(getComputedStyle(cards[8].parentElement).transform).m42) > 1, 'Neighbors make room')
  check(document.activeElement.matches('.place-close'), 'Close control receives focus')
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  await settle(() => !root.querySelector('.place-details'))
  check(document.activeElement === cards[13], 'Escape restores card focus')
  for (const index of [0, 3, 5, 18, 20, 23]) {
    cards[index].click()
    await settle(() => cards[index].getBoundingClientRect().width > width * 1.7)
    const r = root.querySelector('.place-details').getBoundingClientRect()
    const bounds = staticBoard ? root.getBoundingClientRect() : { top: 0, bottom: innerHeight }
    check(r.left >= 0 && r.right <= innerWidth + 1 && r.top >= bounds.top && r.bottom <= bounds.bottom + 1,
      `Expanded edge card ${index + 1} stays in the viewport`)
    root.querySelector('.place-close').click()
    await settle(() => !root.querySelector('.place-details'))
  }
  if (st) {
    cards[13].click()
    await frame()
    await scroll(1)
    check(!root.querySelector('.place-details'), 'Scrolling dismisses the detail')
    check(board.inert && Number(getComputedStyle(board).opacity) < 0.01, 'Exit clears the cards and disables focus')
    await scroll(0.58)
    check(!board.inert && Number(getComputedStyle(board).opacity) > 0.99, 'Reverse scrolling restores the overview')
  }
  console.info('Location checks passed:', checks)
  return { passed: checks.length, viewport: `${innerWidth}×${innerHeight}`, reduced }
})()
