// Run in the localhost landing console after the curtain opens.
// Repeat on mobile, desktop and with reduced motion enabled.
;(async () => {
  let passed = 0
  const check = (ok, message) => { if (!ok) throw Error(message); passed++ }
  const settle = () => new Promise(resolve => setTimeout(resolve, 850))
  // A resized pin refreshes on the next frames; seek only once it is settled.
  for (let i = 0; i < 30; i++) await new Promise(requestAnimationFrame)
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
  check(!preview.querySelector('dialog, .match-party, .match-hand-card'), 'Landing uses inline artwork without inspection popups or miniature rosters')
  check(preview.querySelector('.match-rules-link') && getComputedStyle(preview.querySelector('.match-rules-link')).backgroundColor === 'rgb(181, 54, 43)', 'Full rules uses the prominent vermilion flag')
  if (story) {
    const triggers = window.ScrollTrigger.getAll().filter(item => item.trigger === story && item.pin)
    check(triggers.length === 1, 'Shared match installs exactly one pin')
    const trigger = triggers[0]
    const locationsTrigger = window.ScrollTrigger.getAll().find(item => item.trigger?.id === 'dia-diem' && item.pin)
    check(!locationsTrigger || trigger.start >= locationsTrigger.end, 'Gameplay starts after the preceding location pin, including after mobile breakpoint changes')
    const phases = [0, 1, 2, 3, 4, 5, 9]
    const seek = async phase => {
      scrollTo({top: trigger.start + (trigger.end - trigger.start) * (phases.indexOf(phase) + .96) / phases.length, behavior: 'instant'})
      await settle()
      const deadline = performance.now() + 4000
      while (performance.now() < deadline && Number(story.dataset.phase) !== phase) await new Promise(resolve => setTimeout(resolve, 50))
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
    check(story.querySelector('.match-brief').textContent.includes('Đứng cùng ô'), 'Sharing explains the common same-tile precondition')
    const tile = story.querySelector('[data-id="ben-tap-ket"]').getBoundingClientRect()
    check([...story.querySelectorAll('.match-pawn')].slice(0, 2).every(pawn => {
      const r = pawn.getBoundingClientRect()
      return r.left + r.width / 2 >= tile.left && r.left + r.width / 2 <= tile.right && r.top + r.height / 2 >= tile.top && r.top + r.height / 2 <= tile.bottom
    }), 'Both characters actually stand on the sharing tile')
    check(story.querySelector('.match-basic-art img').getBoundingClientRect().height >= 60, 'Related strategy artwork is readable instead of a tiny thumbnail')
    await seek(5)
    check(story.querySelector('[data-id="bai-tiep-luong"]').dataset.danger === 'true', 'Flood illustrates the basic stable-to-danger change')
    await seek(9)
    check(story.dataset.won === 'true', 'The match reaches its ending')
    check(getComputedStyle(story).backgroundColor === getComputedStyle(finale.querySelector('.finale-wave')).backgroundColor, 'Match ending meets the CTA wave with the same color')
    await seek(0)
    check(story.querySelector('[data-id="song-chanh"]').dataset.removed !== 'true', 'Reverse restores the tile')
    story.querySelector('.match-skip').click()
  } else {
    check(preview.querySelectorAll('.match-static-scene').length === 7 && !preview.querySelector('.pin-spacer'), 'Reduced motion and short screens retain seven basic scenes without a match pin')
    preview.querySelector('a[href="#nhan-lenh"]').click()
  }
  await settle()
  check(location.hash === '#nhan-lenh' && document.activeElement === finale, 'Skip updates the fragment and transfers keyboard focus to the CTA')
  check(finale.getBoundingClientRect().top >= -1 && finale.getBoundingClientRect().top < innerHeight, 'Skip reaches the CTA')
  check(document.documentElement.scrollWidth <= Math.ceil(document.documentElement.getBoundingClientRect().width) + 2, 'Landing stays within its existing 2px clip bleed, including fractional viewport rounding')
  return {passed, width: innerWidth, mode: story ? 'scroll' : 'static'}
})()
