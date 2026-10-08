// Run in the localhost browser console after the opening curtain.
(async () => {
  const root = document.querySelector('.finale')
  if (!root) throw new Error('Footer missing')
  const results = []
  const check = (name, passed) => {
    results.push({ name, passed: Boolean(passed) })
    if (!passed) throw new Error(name)
  }
  const frame = () => new Promise(requestAnimationFrame)
  const picks = [...root.querySelectorAll('.finale-pick')]
  const { cards } = await import('/src/data/cards.ts')
  picks.find(button => button.getAttribute('aria-pressed') === 'true')?.click()
  await frame()
  check('Six real cards remain eagerly loaded', picks.length === 6 && picks.every(button => {
    const image = button.querySelector('img')
    return image.complete && image.naturalWidth && image.loading === 'eager'
  }))
  for (const [index, button] of picks.entries()) {
    button.click()
    await frame()
    check(`Select ${cards[index].role}`, button.getAttribute('aria-pressed') === 'true'
      && picks.filter(pick => pick.getAttribute('aria-pressed') === 'true').length === 1)
    check(`Correct skill for ${cards[index].role}`, root.querySelector('#finale-card-detail').textContent.includes(cards[index].text))
    button.click()
    await frame()
    check(`Stow ${cards[index].role}`, button.getAttribute('aria-pressed') === 'false')
  }
  picks[0].click()
  await frame()
  picks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await frame()
  check('Escape restores the hand', picks.every(button => button.getAttribute('aria-pressed') === 'false'))
  picks[1].click()
  await frame()
  root.querySelector('.finale-stow').click()
  await frame()
  check('Visible stow action works', !root.querySelector('.finale-stow'))
  check('Stowing restores focus to its card', document.activeElement === picks[1])
  const credits = root.querySelector('.finale-credits')
  credits.open = false
  credits.querySelector('summary').click()
  check('Credits expand with native disclosure', credits.open)
  check('Four credited people with responsibilities', credits.querySelectorAll('.finale-credit-name').length === 4
    && [...credits.querySelectorAll('.finale-credit-role')].every(role => role.textContent.trim()))
  check('Expanded credits fit the viewport', [...credits.querySelectorAll('p')].every(el => {
    const rect = el.getBoundingClientRect()
    return rect.left >= -1 && rect.right <= document.documentElement.clientWidth + 1 && el.scrollWidth <= el.clientWidth + 1
  }))
  credits.querySelector('summary').click()
  check('Credits collapse', !credits.open)
  check('Real contact destinations', root.querySelector('a[href="https://www.facebook.com/daugiaothoi"]')
    && root.querySelector('a[href="https://www.tiktok.com/@daugiaothoi"]'))
  check('New tab links are labeled and protected', [...root.querySelectorAll('a[target="_blank"]')].every(link =>
    link.rel.includes('noopener') && link.textContent.includes('mở tab mới')))
  check('Preorder CTA retains the actual route', new URL(root.querySelector('.finale-cta').href).searchParams.get('page') === 'dat-truoc')
  check('Unpublished price and schedule remain explicit', root.querySelector('.finale-sales-note').textContent.includes('khi mở đặt trước'))
  check('Footer has no clipped text or CTA', [...root.querySelectorAll('.finale-cta, .finale-footer a, .finale-about')].every(el => {
    const rect = el.getBoundingClientRect()
    return rect.left >= -1 && rect.right <= document.documentElement.clientWidth + 1 && el.scrollWidth <= el.clientWidth + 1
  }))
  if (innerWidth <= 700) check('Mobile card controls are separate and at least 44px wide', picks.every(button => button.getBoundingClientRect().width >= 44)
    && new Set(picks.map(button => Math.round(button.getBoundingClientRect().top))).size === 2)
  return { passed: results.length, results }
})()
