// Run in the localhost browser console after the curtain opens.
(async () => {
  const { locations } = await import('/src/data/locations.ts')
  const { preloadedImages } = await import('/src/preloadAssets.ts')
  const checks = []
  const check = (name, passed) => {
    checks.push({ name, passed })
    if (!passed) throw new Error(name)
  }
  check('All 24 front/back pairs are distinct and decoded before the scene', locations.length === 24
    && new Set(locations.flatMap(card => [card.image, card.back])).size === 48
    && locations.every(card => [card.image, card.back].every(src => preloadedImages.get(src)?.complete)))
  const staticGrid = document.querySelector('.box-locations-grid')
  if (staticGrid) {
    const images = [...staticGrid.querySelectorAll('img')]
    const rows = new Map()
    images.forEach(image => {
      const rect = image.getBoundingClientRect()
      const row = Math.round(rect.top)
      rows.set(row, (rows.get(row) ?? 0) + 1)
    })
    check('Static fallback shows the 2–4–6–6–4–2 board', [...rows.values()].join(',') === '2,4,6,6,4,2')
    check('Static fallback retains square rounded cards', images.every(image => {
      const rect = image.getBoundingClientRect()
      return Math.abs(rect.width - rect.height) < 1 && getComputedStyle(image).borderRadius === '4%'
    }))
    return checks
  }
  const trigger = window.ScrollTrigger.getAll().find(item => item.trigger?.querySelector?.('#top'))
  const timeline = trigger.animation
  const state = timeline.getChildren().flatMap(tween => tween.targets?.() ?? []).find(target => 'locationsReveal' in target)
  const canvas = trigger.trigger.querySelector('canvas')
  const copy = trigger.trigger.querySelector('.bx-locations-copy')
  const start = timeline.labels['locations-in']
  const out = timeline.labels['locations-out']
  const phase = (out - start) / 0.8
  const originalScroll = scrollY
  const seek = async time => {
    window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * time / timeline.duration())
    window.ScrollTrigger.update()
    const tween = trigger.getTween()
    if (tween) tween.progress(1)
    await new Promise(requestAnimationFrame)
    const latest = trigger.getTween()
    if (latest) latest.progress(1)
  }
  const picture = async () => {
    await new Promise(requestAnimationFrame)
    const buffer = document.createElement('canvas')
    buffer.width = canvas.clientWidth
    buffer.height = canvas.clientHeight
    const context = buffer.getContext('2d')
    context.drawImage(canvas, 0, 0, buffer.width, buffer.height)
    return context.getImageData(0, 0, buffer.width, buffer.height)
  }
  const cardsInPicture = ({ data, width, height }) => {
    const seen = new Uint8Array(width * height)
    const boxes = []
    for (let pixel = 0; pixel < seen.length; pixel++) {
      if (seen[pixel] || data[pixel * 4 + 3] < 230) continue
      const queue = [pixel]
      seen[pixel] = 1
      let minX = width, minY = height, maxX = 0, maxY = 0
      for (let index = 0; index < queue.length; index++) {
        const p = queue[index], x = p % width, y = Math.floor(p / width)
        minX = Math.min(minX, x); maxX = Math.max(maxX, x)
        minY = Math.min(minY, y); maxY = Math.max(maxY, y)
        for (const next of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
          if (next < 0 || next >= seen.length || seen[next] || data[next * 4 + 3] < 230) continue
          seen[next] = 1
          queue.push(next)
        }
      }
      if (queue.length > 100) boxes.push({ minX, minY, maxX, maxY })
    }
    return boxes
  }
  try {
    check('Cover keeps one pin with twelve screens of scrolling', Math.abs((trigger.end - trigger.start) / innerHeight - 12) < 0.05)
    check('New location beat adds exactly two screens', Math.abs(phase / timeline.duration() * 12 - 2) < 0.01)
    await seek(start - 0.05)
    check('All seven strategies finish before the location reveal', state.fan2.length === 7 && state.fan2.every(value => value > 0.95)
      && state.locationsReveal === 0)
    await seek(start + phase * 0.15)
    check('Location stack arrives before the board spreads', Math.abs(state.locationsReveal - 3 / 11) < 0.01 && state.locationsExit === 0)
    await seek(timeline.labels['locations-showcase'])
    const boxes = cardsInPicture(await picture())
    check(`Rendered canvas shows 24 separated faces at once (found ${boxes.length})`, boxes.length === 24)
    check('All 24 faces fit inside the viewport', boxes.every(box => box.minX > 4 && box.minY > 4
      && box.maxX < canvas.clientWidth - 5 && box.maxY < canvas.clientHeight - 5))
    check('Card artwork stays approximately square in the slightly tilted board', boxes.every(box => {
      const ratio = (box.maxX - box.minX) / (box.maxY - box.minY)
      return ratio > 0.88 && ratio < 1.12
    }))
    const text = copy.getBoundingClientRect()
    const board = { left: Math.min(...boxes.map(b => b.minX)), right: Math.max(...boxes.map(b => b.maxX)),
      top: Math.min(...boxes.map(b => b.minY)), bottom: Math.max(...boxes.map(b => b.maxY)) }
    check('Showcase text is visible and clear of the entire board', getComputedStyle(copy).visibility === 'inherit'
      || getComputedStyle(copy).visibility === 'visible')
    check('Text never overlaps card artwork', text.right < board.left || text.bottom < board.top)
    check('Showcase has no individual card interaction', getComputedStyle(copy).pointerEvents === 'none'
      && !trigger.trigger.querySelector('[data-location-button]'))
    await seek(start + phase + 0.02)
    check('Cards gather and leave before the following chapter', state.locationsExit === 1)
    await seek(timeline.labels['locations-showcase'])
    window.ScrollTrigger.refresh()
    await seek(timeline.labels['locations-showcase'])
    check('Reverse and refresh restore all 24 faces', state.locationsExit === 0 && cardsInPicture(await picture()).length === 24)
    await seek(start - 0.05)
    check('Reverse restores the strategy hand', state.locationsReveal === 0 && state.locationsExit === 0)
  } finally {
    window.scrollTo(0, originalScroll)
    window.ScrollTrigger.update()
    const tween = trigger.getTween()
    if (tween) tween.progress(1)
  }
  return checks
})()
