// Run in the localhost landing console after the curtain opens.
// Repeat on mobile, desktop and with reduced motion enabled.
;(async () => {
  let passed = 0
  const check = (ok, message) => { if (!ok) throw Error(message); passed++ }
  const settle = () => new Promise(resolve => setTimeout(resolve, 850))
  const root = document.querySelector('.landing-experience:not([inert])')
  const preview = root?.querySelector('.landing-match')
  check(preview, 'Landing includes the match after loading')
  check(parseFloat(getComputedStyle(preview, '::before').height) <= preview.offsetHeight + 5, 'Match background bleed stays within its section instead of covering the landing')
  check(root.querySelector('#dia-diem').compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING, 'Match follows the location collection')
  const finale = root.querySelector('#nhan-lenh')
  check(preview.compareDocumentPosition(finale) & Node.DOCUMENT_POSITION_FOLLOWING, 'Match precedes the preorder CTA and footer')
  check(root.querySelectorAll('.site-header').length === 1 && root.querySelectorAll('.page-progress').length === 1, 'One shared header and reading progress')
  check(!preview.querySelector('.rules-layout, .rules-reference, .rules-abilities'), 'Detailed reading and abilities stay on the rules page')
  check(preview.querySelector('a[href="?page=cach-choi#chuan-bi"]'), 'Full rules opens at the reading section')
  check(preview.querySelector('a[href="#nhan-lenh"]') && finale.tabIndex === -1, 'Skip has a focusable destination')
  check(getComputedStyle(preview.querySelector('h2')).textTransform === 'uppercase', 'Heading keeps the landing uppercase style')
  check([...preview.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0), 'Match artwork is prepared by the landing curtain')
  const boards = [...preview.querySelectorAll('.match-board')]
  for (const board of boards) {
    check(board.querySelectorAll('.match-tile').length === 24 && new Set([...board.querySelectorAll('.match-tile')].map(tile => tile.dataset.id)).size === 24, 'Board contains 24 distinct locations')
    check([...board.querySelectorAll('.match-tile-paper img')].every(img => img.naturalWidth === img.naturalHeight), 'Front and back artwork stays square')
  }
  const story = preview.querySelector('.match-story')
  if (story) {
    const triggers = window.ScrollTrigger.getAll().filter(item => item.trigger === story && item.pin)
    check(triggers.length === 1, 'Shared match installs exactly one pin')
    const trigger = triggers[0]
    const seek = async phase => {
      scrollTo({top: trigger.start + (trigger.end - trigger.start) * (phase + .96) / 10, behavior: 'instant'})
      await settle()
      check(Number(story.dataset.phase) === phase, `Scroll reaches scene ${phase}`)
      const controls = story.querySelector('.match-bottomline').getBoundingClientRect()
      check(controls.bottom <= innerHeight + 1 && controls.left >= 0 && controls.right <= innerWidth + 1, 'Scene controls fit')
    }
    await seek(0)
    check([...story.querySelectorAll('.match-tile')].every(tile => {
      const r = tile.getBoundingClientRect()
      return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1
    }), 'Opening shot shows all 24 tiles')
    await seek(3)
    const card = story.querySelector('[data-id="bach-dang"] button')
    card.focus()
    card.click()
    await settle()
    check(story.querySelector('dialog').open, 'Card inspection works inside landing')
    story.querySelector('.match-inspect-close').click()
    await settle()
    check(document.activeElement === card, 'Inspection restores focus')
    await seek(7)
    check(story.querySelector('[data-id="song-chanh"]').dataset.removed === 'true', 'The lost tile follows the shared sequence')
    await seek(9)
    check(story.dataset.won === 'true', 'The match reaches its ending')
    check(getComputedStyle(story).backgroundColor === getComputedStyle(finale.querySelector('.finale-wave')).backgroundColor, 'Match ending meets the CTA wave with the same color')
    await seek(0)
    check(story.querySelector('[data-id="song-chanh"]').dataset.removed !== 'true', 'Reverse restores the tile')
    story.querySelector('.match-skip').click()
  } else {
    check(preview.querySelectorAll('.match-static-scene').length === 10 && !preview.querySelector('.pin-spacer'), 'Reduced motion and short screens retain readable scenes without a match pin')
    preview.querySelector('a[href="#nhan-lenh"]').click()
  }
  await settle()
  check(location.hash === '#nhan-lenh' && document.activeElement === finale, 'Skip updates the fragment and transfers keyboard focus to the CTA')
  check(finale.getBoundingClientRect().top >= -1 && finale.getBoundingClientRect().top < innerHeight, 'Skip reaches the CTA')
  check(document.documentElement.scrollWidth <= innerWidth + 2, 'Landing stays within its existing 2px clip bleed')
  return {passed, width: innerWidth, mode: story ? 'scroll' : 'static'}
})()
