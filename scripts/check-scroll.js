// Paste into DevTools on the landing page after its curtain opens.
(async () => {
  const frame = () => new Promise(requestAnimationFrame)
  const settle = async () => { await frame(); await frame() }
  let passed = 0, maxLagPx = 0
  const check = (ok, message) => { if (!ok) throw Error(message); passed++ }
  check(document.querySelector('#roles') && !document.querySelector('main [inert] .chapter-nav'), 'Landing page is unlocked')
  check(getComputedStyle(document.documentElement).scrollBehavior === 'auto', 'Viewport keeps native scrolling')
  check(!ScrollTrigger.normalizeScroll(), 'No wheel or touch normalizer intercepts native momentum')
  const triggers = ScrollTrigger.getAll().filter((st) => st.vars.scrub && st.animation)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  check(triggers.length === (reduced ? 0 : 10), 'All ten scroll animations are present, or removed for reduced motion')
  const report = []
  const cardChapters = new Set(['roles', 'ke-sach', 'dia-diem'])
  for (const st of triggers) {
    check(st.vars.scrub === true, 'Direct progress mapping while input is active')
    const snap = st.vars.snap
    check(!!snap === !!(st.pin && cardChapters.has(st.trigger.id)), 'Only card chapters assist with alignment')
    if (snap) {
      check(snap.inertia === false && snap.delay >= .2 && snap.duration.max <= .3, 'Alignment waits for idle input and does not project momentum')
      for (const progress of [.01, .11, .37, .65, .91, .99]) {
        const target = snap.snapTo(progress)
        check(target >= 0 && target <= 1 && Math.abs(snap.snapTo(target) - target) < 1e-6, 'Card stops are bounded and stable')
      }
      check(snap.snapTo(.99) === .99, 'Chapter exit stays free of card snapping')
      if (st.trigger.id === 'dia-diem') check(snap.snapTo(.01) === .01, 'Location entrance stays free of card snapping')
    }
    let lag = 0
    for (const progress of [0, .001, .11, .37, .371, .372, .91, 1, .999, .65, .371, .37, .11, 0]) {
      scrollTo({ top: Math.round(st.start + progress * (st.end - st.start)), behavior: 'instant' })
      await settle()
      const expected = Math.max(0, Math.min(1, (scrollY - st.start) / (st.end - st.start)))
      check(Math.abs(st.progress - expected) * (st.end - st.start) < 1, 'Trigger follows the viewport within one pixel, including reversal')
      const pixels = Math.abs(st.animation.totalProgress() - expected) * (st.end - st.start)
      lag = Math.max(lag, pixels)
      check(pixels < 1, 'Animation catches small and large movements within two frames')
      if (st.pin && st.progress > .01 && st.progress < .99) {
        check(Math.abs(st.pin.getBoundingClientRect().top) < 1, 'Pinned viewport stays steady')
      }
    }
    maxLagPx = Math.max(maxLagPx, lag)
    if (st.pin) {
      scrollTo({ top: Math.round(st.start + .37 * (st.end - st.start)), behavior: 'instant' })
      await settle()
      const stopped = scrollY
      const target = snap ? st.start + snap.snapTo((stopped - st.start) / (st.end - st.start)) * (st.end - st.start) : stopped
      const until = performance.now() + 1300
      while (performance.now() < until) await frame()
      check(Math.abs(scrollY - target) <= 1, snap ? 'After stopping, align with the nearest card' : 'Non-card chapters never auto-scroll after stopping')
      if (snap) {
        const aligned = scrollY, until = performance.now() + 500
        while (performance.now() < until) await frame()
        check(scrollY === aligned, 'A completed card snap stays still')
      }
      for (const top of [st.start - 2, st.start + 2, st.end - 2, st.end + 2, st.end - 2, st.start - 2]) {
        scrollTo({ top, behavior: 'instant' })
        await settle()
        const bounded = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, top))
        check(Math.abs(scrollY - bounded) <= 1, 'Crossing either pin boundary does not move the viewport')
      }
    }
    report.push({ section: st.trigger.id || st.trigger.className, maxLagPx: +lag.toFixed(3) })
  }
  if (!reduced) {
    const st = triggers.find((s) => s.trigger.id === 'ke-sach' && s.pin)
    const card = document.querySelector('.ks-card')
    for (const index of [.98, .99, 1, 1.01, 1.02, 2.99, 3.01, 5.99]) {
      scrollTo({ top: st.start + index / 7.5 * (st.end - st.start), behavior: 'instant' })
      await settle()
      const actual = -Number(card.style.transform.match(/translate3d\((-?[\d.]+)%/)[1]) / 64
      check(Math.abs(actual - st.progress * 7.5) < .002, 'Strategy movement stays continuous across card stops')
    }
  }
  check(getComputedStyle(document.querySelector('.ks-browse') || document.querySelector('#ke-sach')).touchAction !== 'none', 'Strategy surface permits native vertical touch scrolling')
  check(getComputedStyle(document.querySelector('.spiral-scene')).touchAction === 'pan-y', 'Location surface leaves vertical gestures native')
  check(document.documentElement.scrollWidth <= innerWidth, 'No sideways page overflow')
  return { passed, maxLagPx, viewport: `${innerWidth}×${innerHeight}`, reduced, report }
})()
