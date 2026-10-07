// Run in the localhost browser console. Tests the rendered sun-to-box handoff.
(async () => {
  // Check settled artwork, rather than an intermediate loading/entrance frame.
  const deadline = performance.now() + 40000
  while (document.querySelector('[role="progressbar"]') || [...document.querySelectorAll('.hero-person-intro')].some(el => {
    const transform = getComputedStyle(el).transform
    if (transform === 'none') return false
    const matrix = new DOMMatrix(transform)
    return Math.abs(matrix.e) > 0.5 || Math.abs(matrix.f) > 0.5 || Math.abs(matrix.b) > 0.001
  })) {
    if (performance.now() > deadline) throw new Error('Hero entrance did not settle')
    await new Promise(requestAnimationFrame)
  }
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
  const wave = hero.querySelector('.hero-water-front')
  check('Water moves continuously', matchMedia('(prefers-reduced-motion: reduce)').matches
    || getComputedStyle(wave).animationName === 'hero-water-flow')
  const largeTitleWidth = Math.min(viewportWidth * 0.5, innerHeight * 0.65, 500)

  const trigger = window.ScrollTrigger.getAll().find(t => t.trigger?.querySelector?.('#top'))
  if (!trigger) {
    check('Static fallback retains the hero', hero.getBoundingClientRect().height > 0)
    return results
  }
  const originalScroll = scrollY
  const brand = document.querySelector('.site-brand')
  const navigation = [...document.querySelectorAll('.site-cta, .chapter-nav')]
  const hidden = el => getComputedStyle(el).visibility === 'hidden'
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
    check('Opening title is already visible and navigation waits', !hidden(brand)
      && brand.getBoundingClientRect().width >= largeTitleWidth && navigation.every(hidden))
    const luminance = color => {
      const rgb = color.match(/[\d.]+/g).slice(0, 3).map(v => {
        const c = Number(v) / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    }
    const textLight = luminance(getComputedStyle(brand).color)
    const paperLight = luminance(getComputedStyle(hero).backgroundColor)
    check('Title has strong contrast against the paper', (paperLight + 0.05) / (textLight + 0.05) >= 7)
    const initialPositions = [...hero.querySelectorAll('.hero-person')].map(p => p.getBoundingClientRect())
    const tide = hero.querySelector('.hero-tide')
    const initialTideTop = tide.getBoundingClientRect().top
    const cast = hero.querySelector('.hero-cast').getBoundingClientRect()
    const focalSun = hero.querySelector('.sun').getBoundingClientRect()
    const radius = focalSun.width / 2
    const focalX = focalSun.left + radius
    const focalY = focalSun.top + radius
    check('Six hand anchors surround a small central sun', focalSun.width < viewportWidth * 0.26
      && initialPositions.every(rect => Math.abs(Math.hypot(rect.left - focalX, rect.top - focalY) - radius) < cast.width * 0.04))
    check('Hand anchors stay inside the viewport', initialPositions.every(rect => rect.left > 0
      && rect.left < viewportWidth && rect.top > 0 && rect.top < innerHeight))
    check('Heading and subheading have their own space below the sun', brand.getBoundingClientRect().top > focalSun.bottom + 8
      && hero.querySelector('.hero-copy').getBoundingClientRect().top > brand.getBoundingClientRect().bottom + 8)
    await seek(0.45)
    const title = brand.getBoundingClientRect()
    check('Large title fits the viewport before docking', title.width >= largeTitleWidth
      && title.left >= -1 && title.right <= viewportWidth + 1 && !hidden(brand))
    check('Navigation waits for the title to dock', navigation.every(hidden))
    await seek(1.65)
    check('The same title docks as the header logo', brand === document.querySelector('.site-brand')
      && Math.abs(brand.getBoundingClientRect().width - brand.offsetWidth) < 1
      && Math.abs(brand.getBoundingClientRect().top - brand.offsetTop) < 1)
    check('CTA and navigation appear after docking', navigation.every(el => !hidden(el)))
    const cta = document.querySelector('.site-cta').getBoundingClientRect()
    check('Docked CTA fits without clipping or colliding with the logo', cta.left > brand.getBoundingClientRect().right + 8
      && cta.right <= viewportWidth && cta.top >= 0 && cta.bottom < innerHeight)
    await seek(entrance.startTime() - 0.015)
    const sun = hero.querySelector('.sun').getBoundingClientRect()
    const stage = trigger.trigger.getBoundingClientRect()
    const cx = sun.x + sun.width / 2
    const cy = sun.y + sun.height / 2
    check('Sun covers all four corners before the box enters', [[0, 0], [stage.width, 0], [0, stage.height], [stage.width, stage.height]]
      .every(([x, y]) => Math.hypot(x - cx, y - cy) <= sun.width / 2))
    check('Characters leave before the box enters', images.every(p => p.getBoundingClientRect().top >= stage.height))
    check('Foreground wave leaves before the box enters', tide.getBoundingClientRect().top >= stage.height)
    await seek(entrance.startTime() + entrance.duration())
    check('Box reaches the viewport', Math.abs(canvas.getBoundingClientRect().top) < 2)
    check('Hero gives way to the box', getComputedStyle(hero.parentElement).visibility === 'hidden')
    check('Docked logo stays visible after the handoff', !hidden(brand))
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
    check('Reverse restores the foreground wave', Math.abs(tide.getBoundingClientRect().top - initialTideTop) < 1)
    check('Reverse restores the large title and hides navigation', !hidden(brand)
      && brand.getBoundingClientRect().width >= largeTitleWidth && navigation.every(hidden))
  } finally {
    window.scrollTo(0, originalScroll)
    window.ScrollTrigger.update()
    trigger.getTween()?.progress(1)
  }
  return results
})()
