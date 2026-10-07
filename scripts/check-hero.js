// Run in the localhost browser console. Tests the rendered sun-to-box handoff.
(async () => {
  const results = []
  const check = (name, passed) => {
    results.push({ name, passed })
    if (!passed) throw new Error(name)
  }
  const hero = document.querySelector('#top')
  const images = [...hero.querySelectorAll('.hero-portrait')]
  check('Six characters are decoded', images.length === 6 && images.every(i => i.complete && i.naturalWidth))
  check('Artwork has no color filters', images.every(i => getComputedStyle(i).filter === 'none'))
  const viewportWidth = document.documentElement.clientWidth
  check('Both words fit the viewport', [...hero.querySelectorAll('.hero-title .ch')].every(ch => {
    const rect = ch.getBoundingClientRect()
    return rect.left >= -1 && rect.right <= viewportWidth + 1
  }))

  const trigger = window.ScrollTrigger.getAll().find(t => t.trigger?.querySelector?.('#top'))
  if (!trigger) {
    check('Static fallback retains the hero', hero.getBoundingClientRect().height > 0)
    return results
  }
  const originalScroll = scrollY
  const timeline = trigger.animation
  const canvas = trigger.trigger.querySelector('canvas')
  const entrance = timeline.getChildren().find(t => t.targets?.().includes(canvas))
  const seek = async time => {
    window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * time / timeline.duration())
    window.ScrollTrigger.update()
    trigger.getTween()?.progress(1)
    await new Promise(requestAnimationFrame)
    trigger.getTween()?.progress(1)
  }
  try {
    await seek(0)
    window.ScrollTrigger.refresh()
    const initialPositions = [...hero.querySelectorAll('.hero-person')].map(p => p.getBoundingClientRect())
    const cast = hero.querySelector('.hero-cast').getBoundingClientRect()
    check('Characters remain centered on their layout anchors', [...hero.querySelectorAll('.hero-person')]
      .every((p, i) => Math.abs(initialPositions[i].left + initialPositions[i].width / 2 - cast.left - p.offsetLeft) < 1))
    await seek(entrance.startTime() - 0.015)
    const sun = hero.querySelector('.sun').getBoundingClientRect()
    const stage = trigger.trigger.getBoundingClientRect()
    const cx = sun.x + sun.width / 2
    const cy = sun.y + sun.height / 2
    check('Sun covers all four corners before the box enters', [[0, 0], [stage.width, 0], [0, stage.height], [stage.width, stage.height]]
      .every(([x, y]) => Math.hypot(x - cx, y - cy) <= sun.width / 2))
    check('Characters leave before the box enters', [...hero.querySelectorAll('.hero-person')]
      .every(p => p.getBoundingClientRect().top >= stage.height))
    await seek(entrance.startTime() + entrance.duration())
    check('Box reaches the viewport', Math.abs(canvas.getBoundingClientRect().top) < 2)
    check('Hero gives way to the box', getComputedStyle(hero.parentElement).visibility === 'hidden')
    window.ScrollTrigger.refresh()
    await seek(0)
    check('Scrolling back restores the hero', getComputedStyle(hero.parentElement).visibility === 'inherit'
      || getComputedStyle(hero.parentElement).visibility === 'visible')
    const restoredSun = hero.querySelector('.sun').getBoundingClientRect()
    check('Refresh mid-transition does not leave an enlarged sun', Math.abs(restoredSun.width - hero.querySelector('.sun').offsetWidth) < 2)
    check('Reverse restores all character positions', [...hero.querySelectorAll('.hero-person')]
      .every((p, i) => {
        const rect = p.getBoundingClientRect()
        return Math.abs(rect.top - initialPositions[i].top) < 1 && Math.abs(rect.left - initialPositions[i].left) < 1
      }))
  } finally {
    window.scrollTo(0, originalScroll)
    window.ScrollTrigger.update()
    trigger.getTween()?.progress(1)
  }
  return results
})()
