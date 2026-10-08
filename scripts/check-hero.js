// Run in the localhost browser console. Tests the rendered sun-to-box handoff.
(async () => {
  // Check settled artwork, rather than an intermediate loading/entrance frame.
  const deadline = performance.now() + 40000
  while (document.querySelector('.cu-water[role="progressbar"]') || [...document.querySelectorAll('.hero-person-intro')].some(el => {
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
  const edgeAnchored = image => {
    const rect = image.getBoundingClientRect()
    const bounds = hero.getBoundingClientRect()
    const side = image.closest('.hero-person').dataset.side
    return rect.right > bounds.left && rect.left < bounds.right && rect.bottom > bounds.top && rect.top < bounds.bottom
      && (side === 'left' ? rect.left < bounds.left : side === 'right' ? rect.right > bounds.right
        : rect.top < bounds.top || (bounds.width < bounds.height && (rect.left < bounds.left || rect.right > bounds.right)))
  }
  check('Six characters are decoded', images.length === 6 && images.every(i => i.complete && i.naturalWidth))
  check('Artwork has no color filters', images.every(i => getComputedStyle(i).filter === 'none'))
  check('Only the hero paper texture is softened to 70 percent', getComputedStyle(hero, '::before').opacity === '0.7'
    && images.every(image => getComputedStyle(image).opacity === '1'))
  check('Six characters have only a soft silhouette shadow', images.every(i => {
    const filter = getComputedStyle(i.closest('.hero-person-placement')).filter
    return filter.startsWith('drop-shadow(') && !/brightness|contrast|saturate/.test(filter)
  }))
  const viewportWidth = document.documentElement.clientWidth
  const pageProgress = document.querySelector('.page-progress')
  check('Reading progress stays above the grain and has no pointer target', pageProgress
    && getComputedStyle(pageProgress).pointerEvents === 'none' && Number(getComputedStyle(pageProgress).zIndex) > 60)
  const sections = [...document.querySelectorAll('.landing-experience > section, .landing-experience > .pin-spacer > section')]
  check('Section backgrounds bleed across fractional pixel boundaries', sections.length >= 6 && sections.every(section => {
    const style = getComputedStyle(section, '::before')
    return style.content === '""' && style.top === '-2px' && getComputedStyle(section).overflowClipMargin === '2px'
  }))
  check('Bottom water has been removed', !hero.querySelector('.hero-water, .hero-tide'))
  const heroCta = hero.querySelector('.hero-cta')
  check('Opening CTA leads to preorder', new URL(heroCta.href).searchParams.get('page') === 'dat-truoc')
  const largeTitleWidth = Math.min(viewportWidth * 0.6, innerHeight * 0.75, 700)

  const trigger = window.ScrollTrigger.getAll().find(t => t.trigger?.querySelector?.('#top'))
  if (!trigger) {
    check('Static fallback retains the hero', hero.getBoundingClientRect().height > 0)
    check('Static fallback hides unfinished backs beyond the edges', images.every(edgeAnchored))
    const title = document.querySelector('.site-brand')
    check('Static fallback retains the large opening title', getComputedStyle(title).visibility !== 'hidden'
      && title.getBoundingClientRect().width >= largeTitleWidth)
    const cta = heroCta.getBoundingClientRect()
    check('Static fallback retains the visible opening CTA', getComputedStyle(heroCta).visibility !== 'hidden'
      && cta.height >= 44 && cta.bottom < innerHeight - 20)
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
    check('Title has strong contrast against the paper', (paperLight + 0.05) / (textLight + 0.05) >= 4.5)
    const initialPositions = [...hero.querySelectorAll('.hero-person')].map(p => p.getBoundingClientRect())
    const focalSun = hero.querySelector('.sun').getBoundingClientRect()
    const radius = focalSun.width / 2
    const focalX = focalSun.left + radius
    const focalY = focalSun.top + radius
    check('Six hand anchors surround an enlarged central sun', focalSun.width >= Math.min(viewportWidth * 0.3, innerHeight * 0.3)
      && initialPositions.every(rect => Math.abs(Math.hypot(rect.left - focalX, rect.top - focalY) - radius) < focalSun.width * 0.08))
    check('Unfinished portrait backs stay hidden beyond the edges', images.every(edgeAnchored))
    check('Hand anchors stay inside the viewport', initialPositions.every(rect => rect.left > 0
      && rect.left < viewportWidth && rect.top > 0 && rect.top < innerHeight))
    check('Heading and subheading have their own space below the sun', brand.getBoundingClientRect().top > focalSun.bottom + 8
      && hero.querySelector('.hero-copy').getBoundingClientRect().top > brand.getBoundingClientRect().bottom + 8)
    const openingCta = heroCta.getBoundingClientRect()
    check('Opening CTA is visible, legible and fits the viewport', !hidden(heroCta)
      && openingCta.height >= 44 && openingCta.left >= 0 && openingCta.right <= viewportWidth
      && openingCta.top > hero.querySelector('.hero-copy p').getBoundingClientRect().bottom + 8
      && openingCta.bottom < innerHeight - 20)
    const scrollCue = hero.querySelector('.hero-scroll').getBoundingClientRect()
    check('Opening CTA stays clear of the scroll cue', openingCta.right + 8 < scrollCue.left
      || openingCta.left > scrollCue.right + 8 || openingCta.bottom + 10 < scrollCue.top)
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const settleDepth = async () => {
        const end = performance.now() + 650
        while (performance.now() < end) await new Promise(requestAnimationFrame)
      }
      for (const [x, y] of [[1, 1], [viewportWidth - 1, innerHeight - 1]]) {
        hero.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse' }))
        await settleDepth()
        check('Parallax preserves the framing at both pointer extremes', images.every(edgeAnchored))
      }
      const depth = [...hero.querySelectorAll('.hero-person-depth')].map(el => Math.abs(window.gsap.getProperty(el, 'x')))
      check('Pointer depth is visible and differs between layers', Math.max(...depth) > Math.min(4, viewportWidth * 0.01) && Math.max(...depth) > Math.min(...depth) * 1.4)
      hero.dispatchEvent(new PointerEvent('pointerleave'))
      await settleDepth()
      check('Pointer leave restores the composition', depth.length === 6 && [...hero.querySelectorAll('.hero-person-depth')].every(el => Math.abs(window.gsap.getProperty(el, 'x')) < 0.1))
    }
    await seek(0.45)
    const title = brand.getBoundingClientRect()
    check('Large title fits the viewport before docking', title.width >= largeTitleWidth
      && title.left >= -1 && title.right <= viewportWidth + 1 && !hidden(brand))
    check('Navigation waits for the title to dock', navigation.every(hidden))
    await seek(1.1)
    check('Heading outline shrinks with the title instead of piling onto the logo', getComputedStyle(brand).textShadow === 'none'
      && parseFloat(getComputedStyle(brand).webkitTextStrokeWidth) < 0.3)
    await seek(1.8)
    check('Characters sweep outward through their own three edges', images.every(image => {
      const person = image.closest('.hero-person')
      const side = person.dataset.side
      return getComputedStyle(person).opacity === '1' && Math.abs(window.gsap.getProperty(person, 'rotation')) > 5
        && (side === 'top' ? window.gsap.getProperty(person, 'y') < -30
          : window.gsap.getProperty(person, 'x') * (side === 'left' ? -1 : 1) > 30)
    }))
    await seek(1.65)
    const distance = document.documentElement.scrollHeight - innerHeight
    check('Reading progress follows the real document including pinned chapters', Math.abs(new DOMMatrix(getComputedStyle(pageProgress).transform).a - scrollY / distance) < 0.001
      && Math.abs(Number(pageProgress.getAttribute('aria-valuenow')) - Math.round(scrollY / distance * 100)) <= 1)
    check('The same title docks as the header logo', brand === document.querySelector('.site-brand')
      && Math.abs(brand.getBoundingClientRect().width - brand.offsetWidth) < 1
      && Math.abs(brand.getBoundingClientRect().top - brand.offsetTop) < 1)
    check('CTA and navigation appear after docking', navigation.every(el => !hidden(el)))
    check('Docked logo has no heading outline', getComputedStyle(brand).textShadow === 'none'
      && parseFloat(getComputedStyle(brand).webkitTextStrokeWidth) === 0)
    document.querySelector('.nav-toggle').click()
    await new Promise(requestAnimationFrame)
    check('Menu replaces the header without a second logo underneath', getComputedStyle(document.querySelector('.site-header')).opacity === '0'
      && Math.abs(document.querySelector('.nav-brand').getBoundingClientRect().width - brand.offsetWidth) < 1)
    document.querySelector('.nav-toggle').click()
    await new Promise(requestAnimationFrame)
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
    check('Characters leave before the box enters', images.every(p => {
      const rect = p.getBoundingClientRect()
      return rect.bottom <= 0 || rect.right <= 0 || rect.left >= stage.width || rect.top >= stage.height
    }))
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
    check('Reverse restores the large title and hides navigation', !hidden(brand)
      && brand.getBoundingClientRect().width >= largeTitleWidth && navigation.every(hidden))
  } finally {
    window.scrollTo(0, originalScroll)
    window.ScrollTrigger.update()
    trigger.getTween()?.progress(1)
  }
  return results
})()
