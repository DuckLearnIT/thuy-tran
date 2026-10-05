// Paste into DevTools after the loading curtain opens.
(async () => {
  const root = document.querySelector('#nhan-lenh')
  const picks = [...root.querySelectorAll('.hand-pick')]
  const draw = root.querySelector('button.f-fade')
  const frame = () => new Promise(requestAnimationFrame)
  let passed = 0
  const check = (ok, message) => {
    if (!ok) throw Error(message)
    passed++
  }
  let layout = ''
  let stable = performance.now()
  while (performance.now() - stable < 400) {
    await frame()
    const next = window.ScrollTrigger.getAll().map((st) => `${st.start}:${st.end}`).join(',')
    if (next !== layout) { layout = next; stable = performance.now() }
  }
  window.scrollTo({ top: root.getBoundingClientRect().top + scrollY, behavior: 'instant' })
  check(picks.length === 6, 'Six native card buttons')
  for (const pick of picks) {
    pick.click()
    await frame()
    check(root.querySelectorAll('.hand-pick[aria-pressed="true"]').length === 1, 'Only one chosen card')
    check(pick.getAttribute('aria-pressed') === 'true', 'Clicked card is chosen')
    check(root.querySelector('.f-result h3').textContent.trim() === pick.getAttribute('aria-label').replace('Nhận lệnh ', ''), 'Reveal matches card')
  }
  for (let i = 0; i < 24; i++) {
    const previous = root.querySelector('.hand-pick[aria-pressed="true"]')
    draw.click()
    await frame()
    check(root.querySelector('.hand-pick[aria-pressed="true"]') !== previous, 'Next draw never repeats immediately')
  }
  picks[5].click()
  await frame()
  picks[5].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  await frame()
  check(document.activeElement === picks[0] && picks[0].getAttribute('aria-pressed') === 'true', 'Keyboard wraps forward with focus')
  picks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  await frame()
  check(document.activeElement === picks[5] && picks[5].getAttribute('aria-pressed') === 'true', 'Keyboard wraps backward with focus')
  check(root.querySelector('[role="status"]').getAttribute('aria-live') === 'polite', 'Reveal is announced')
  check(draw.getBoundingClientRect().top >= root.querySelector('.f-reading').getBoundingClientRect().bottom, 'Draw control stays clear of result text')
  check(document.documentElement.scrollWidth <= innerWidth, 'No horizontal overflow')
  const deadline = performance.now() + 4000
  const revealed = () => [...root.querySelectorAll('.f-result > *, .hand-slot, .f-fade')].every((el) => +getComputedStyle(el).opacity > 0.99)
  while (!revealed() && performance.now() < deadline) await frame()
  check(revealed(), 'Result, draw button and hand finish revealing')
  window.scrollTo({ top: root.getBoundingClientRect().bottom + scrollY - innerHeight, behavior: 'instant' })
  await frame()
  const card = picks[5].querySelector('img').getBoundingClientRect()
  check(document.elementFromPoint(card.left + card.width / 2, card.top + card.height * 0.2)?.closest('.hand-pick') === picks[5], 'Raised card remains clickable above the title')
  return { passed, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, viewport: `${innerWidth}×${innerHeight}` }
})()
