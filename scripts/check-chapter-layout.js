// Run in the localhost browser console after loading. Repeat at desktop/mobile sizes.
(async () => {
  const checks = []
  const check = (ok, label) => { if (!ok) throw Error(label); checks.push(label) }
  const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame) }
  const compact = matchMedia('(max-height: 560px), (max-width: 1023px) and (max-height: 700px)').matches
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const seek = async (trigger, time) => {
    scrollTo(0, trigger.start + time / trigger.animation.duration() * (trigger.end - trigger.start))
    ScrollTrigger.update()
    for (const st of ScrollTrigger.getAll()) {
      const tween = st.getTween()
      if (tween) tween.progress(1)
    }
    await settle()
  }
  const inside = (child, parent) => {
    const a = child.getBoundingClientRect(), b = parent.getBoundingClientRect()
    return a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1
  }
  ScrollTrigger.refresh()
  await settle()
  check(document.documentElement.scrollWidth <= innerWidth + 1, 'No horizontal page overflow')
  if (compact || reduced) {
    check(document.querySelectorAll('#roles .info').length === 6, 'All six roles remain readable in natural flow')
    check(document.querySelectorAll('#ke-sach article').length === 7, 'All seven strategies remain readable in natural flow')
    check(!ScrollTrigger.getAll().some(t => t.pin && ['roles', 'ke-sach'].includes(t.trigger?.id)), 'Short screens do not clip content inside a pin')
    for (const section of document.querySelectorAll('#roles > section, #ke-sach article')) {
      check([...section.querySelectorAll('h3,p,img')].every(el => inside(el, section)), 'Static artwork and text fit their section')
    }
  } else {
    const strategies = ScrollTrigger.getAll().find(t => t.pin && t.trigger?.id === 'ke-sach')
    check(!!strategies, 'Strategy scroll animation remains active')
    for (let i = 0; i < 7; i++) {
      await seek(strategies, i)
      const controls = document.querySelector('.ks-controls')
      const buttons = [...controls.querySelectorAll('button')]
      const selected = buttons[i]
      buttons.forEach(button => button.getAnimations().forEach(animation => animation.finish()))
      check(buttons.length === 7 && selected.getAttribute('aria-pressed') === 'true', `Strategy ${i + 1} has a clear selected button`)
      check(getComputedStyle(selected).color !== getComputedStyle(selected).backgroundColor, `Strategy ${i + 1} number does not disappear`)
      check(getComputedStyle(selected).color === 'rgb(35, 21, 17)' && getComputedStyle(selected).backgroundColor === 'rgb(246, 233, 215)', 'Selected numbers keep strong contrast on every chapter color')
      check(buttons.every(b => inside(b, strategies.trigger)), 'Every strategy control fits the viewport')
      check(inside(document.querySelector('.ks-info'), strategies.trigger), 'Strategy copy fits the viewport')
      if (innerWidth < 1024) {
        check(document.querySelector('.ks-card-slot').getBoundingClientRect().bottom < document.querySelector('.ks-footer').getBoundingClientRect().top, 'Cards and copy do not overlap')
      }
      selected.focus({ preventScroll: true })
      check(document.activeElement === selected, 'Strategy controls remain keyboard focusable')
    }
    await seek(strategies, 0)
    check(document.querySelector('.ks-controls button').getAttribute('aria-pressed') === 'true', 'Reverse scroll restores selection')
    const roles = ScrollTrigger.getAll().find(t => t.pin && t.trigger?.id === 'roles')
    for (let i = 0; i < 6; i++) {
      await seek(roles, i)
      const info = document.querySelectorAll('#roles .info')[i]
      check(inside(info, roles.trigger), `Role ${i + 1} text stays within the viewport`)
      const counter = document.querySelector('#roles p.roles-ui span')
      if (counter && innerWidth < 1024) check(info.getBoundingClientRect().bottom < counter.getBoundingClientRect().top, 'Role copy does not collide with the counter')
    }
  }
  const cta = document.querySelector('.site-cta')
  check(getComputedStyle(cta).color === 'rgb(35, 21, 17)' && getComputedStyle(cta).backgroundColor === 'rgb(246, 233, 215)', 'Navigation uses stable contrasting paper and ink')
  check(getComputedStyle(document.querySelector('.site-header')).mixBlendMode === 'normal', 'Navigation is independent of inverted chapter colors')
  if (!compact && !reduced) check(document.querySelector('.site-header').dataset.docked === 'true', 'Docked logo surface stays synchronized after resize')
  return { passed: checks.length, viewport: `${innerWidth}×${innerHeight}`, compact, reduced }
})()
