// Run in the local play.html developer console. Uses only this page's own UI.
;(async () => {
  const engine = await import('/src/game/engine.ts')
  const { locations } = await import('/src/data/locations.ts')
  const { cards } = await import('/src/data/cards.ts')
  const catalog = { locations, roles: cards.map(c => c.id) }
  const key = 'thuy-tran-playable-v1'
  let passed = 0
  const check = (ok, text) => { if (!ok) throw Error(text); passed++ }
  const pause = () => new Promise(resolve => setTimeout(resolve, 70))
  const saved = () => JSON.parse(localStorage.getItem(key))
  const click = async selector => { const b = document.querySelector(selector); check(b && !b.disabled, `Available: ${selector}`); b.click(); await pause() }
  const valid = () => check(engine.validateGame(saved(), catalog), 'Actual played state can reload')
  check(document.querySelector('.pt-page[data-ready=true]'), 'Artwork curtain opened')
  check(!document.querySelector('a[href], .site-header, .site-footer'), 'Standalone page has no links or old navigation')
  if (document.querySelector('.pt-setup')) await click('.pt-setup-sheet button[type=submit]')
  await new Promise(resolve => setTimeout(resolve, 1500))
  check(document.querySelectorAll('.pt-tile').length === 24 && new Set([...document.querySelectorAll('.pt-tile')].map(t => t.dataset.id)).size === 24, 'All locations are distinct')
  check([...document.querySelectorAll('.pt-paper img')].every(i => i.complete && i.naturalWidth === i.naturalHeight && i.naturalWidth > 0), 'Loaded square F1/F2 artwork')
  const s = saved()
  check(s.players.length >= 4 && s.players.length <= 6 && s.players.every(p => p.hand.length === 2), 'Correct players and starting hands')
  check(JSON.stringify(s.board.reduce((a, t) => { a[t.row]++; return a }, [0, 0, 0, 0, 0, 0])) === '[2,4,6,6,4,2]', 'Centered board shape')
  const fit = () => [...document.querySelectorAll('.pt-tile')].every(t => { const r = t.getBoundingClientRect(), f = document.querySelector('.pt-board-viewport').getBoundingClientRect(); return r.left >= f.left - 1 && r.right <= f.right + 1 && r.top >= f.top - 1 && r.bottom <= f.bottom + 1 })
  const unfoldDeadline = performance.now() + 5000
  while (!fit() && performance.now() < unfoldDeadline) await new Promise(r => setTimeout(r, 100))
  check(fit(), 'Whole-board view does not crop edge locations after unfolding')
  await click('.pt-tile[data-target=true]')
  check(saved().actionsLeft === 2, 'Tile click spends exactly one movement action'); valid()
  await click('.pt-hand-tools button:first-child')
  check(JSON.stringify(saved()) === JSON.stringify(s), 'Undo restores exact state and seeded RNG')
  await click('.pt-actions > button:nth-child(4)')
  check(saved().forecast && saved().actionsLeft === 2, 'Forecast is a real top card'); valid()
  await click('.pt-next'); check(saved().phase === 'draw' && saved().drawsRemaining === 2, 'Actions can end early')
  await click('.pt-next'); check(saved().drawsRemaining === 1 || saved().phase === 'lost', 'First strategy is drawn separately'); valid()
  if (saved().phase !== 'lost') {
    await click('.pt-next'); check(saved().phase === 'flood', 'Second strategy leads to flooding'); valid()
    const oldTurn = saved().turn
    await click('.pt-next'); valid()
    while (saved().phase === 'escape') await click('.pt-tile[data-target=true]')
    while (saved().phase === 'flood') { await click('.pt-next'); while (saved().phase === 'escape') await click('.pt-tile[data-target=true]') }
    check(saved().turn === oldTurn + 1 || saved().phase === 'lost', 'Flooding finishes before the next turn'); valid()
  }
  await click('.pt-header .pt-toolbar > button:first-child')
  check(document.querySelector('.pt-help').open, 'Rules dialog opens accessibly')
  await click('.pt-help header button')
  check(!document.querySelector('.pt-help').open, 'Rules dialog closes')
  await click('.pt-toolbar > button:nth-child(2)')
  check(document.querySelector('.pt-page').dataset.clean === 'true' && getComputedStyle(document.querySelector('.pt-hand-area')).display === 'none', 'Content view hides controls and hands')
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await pause()
  check(document.querySelector('.pt-page').dataset.clean === 'false', 'Escape restores controls')
  if (!['lost', 'won'].includes(saved().phase)) {
    const p = saved().players[saved().active]
    if (p.hand.length) {
      await click('.pt-hand > button:last-child')
      const imported = saved(), actor = imported.players[imported.active]
      imported.strategyDeck.push(...actor.hand.splice(0))
      check(engine.validateGame(imported, catalog), 'Valid import fixture with same turn/actor and shorter hand')
      const transfer = new DataTransfer(); transfer.items.add(new File([JSON.stringify(imported)], 'check.json', { type: 'application/json' }))
      const input = document.querySelector('input[type=file]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); await pause()
      check(document.querySelector('.pt-page') && !document.querySelector('.pt-card-choices'), 'Import clears stale card selection without crashing'); valid()
    }
  }
  check(document.documentElement.scrollWidth <= Math.ceil(document.documentElement.getBoundingClientRect().width) + 2, 'No horizontal page overflow')
  return { passed, width: innerWidth, turn: saved().turn }
})()
