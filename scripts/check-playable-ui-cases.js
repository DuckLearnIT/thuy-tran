// Local-browser integration tests: imports complete valid saves through the UI.
;(async () => {
  const { createGame, validateGame } = await import('/src/game/engine.ts')
  const { locations } = await import('/src/data/locations.ts')
  const { cards } = await import('/src/data/cards.ts')
  const catalog = { locations, roles: cards.map(c => c.id) }
  let passed = 0
  const check = (ok, text) => { if (!ok) throw Error(text); passed++ }
  const pause = () => new Promise(r => setTimeout(r, 90))
  const saved = () => JSON.parse(localStorage.getItem('thuy-tran-playable-v1'))
  const click = async selector => { const b = document.querySelector(selector); check(b && !b.disabled, selector); b.click(); await pause() }
  const seed = actor => { const s = createGame({ playerCount: 6, difficulty: 'standard', seed: 'UI-cases' }, catalog); s.active = s.players.findIndex(p => p.id === actor); return s }
  const p = (s, id) => s.players.find(p => p.id === id)
  const tileAt = (s, r, c) => s.board.find(t => t.row === r && t.col === c)
  const give = (s, id, cardIds) => {
    const pool = [...s.strategyDeck, ...s.strategyDiscard, ...s.players.flatMap(p => p.hand)]
    s.players.forEach(p => { p.hand = [] }); s.strategyDiscard = []; s.strategyDeck = pool
    cardIds.forEach(card => { const i = s.strategyDeck.indexOf(card); check(i >= 0, 'Fixture card exists'); s.strategyDeck.splice(i, 1); p(s, id).hand.push(card) })
  }
  const load = async s => {
    check(validateGame(s, catalog), 'Scenario is a valid complete save')
    const transfer = new DataTransfer(); transfer.items.add(new File([JSON.stringify(s)], 'scenario.json', { type: 'application/json' }))
    const input = document.querySelector('input[type=file]'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); await pause()
    check(!!document.querySelector('.pt-board'), 'Imported scenario renders')
  }
  const tileClick = id => click(`.pt-tile[data-id="${id}"]`)

  let s = seed('nha-binh'), own = tileAt(s, 2, 2), near = tileAt(s, 2, 3)
  p(s, 'nha-binh').tile = own.locationId; own.status = near.status = 'danger'
  await load(s); await click('.pt-actions > button:nth-child(2)'); await tileClick(own.locationId); await tileClick(near.locationId)
  await click('.pt-action-panel > .pt-small-flag')
  check(saved().actionsLeft === 2 && saved().board.filter(t => [own.locationId, near.locationId].includes(t.locationId)).every(t => t.status === 'stable'), 'Nha Binh fortifies both tiles with one action')

  s = seed('nha-tuong'); own = tileAt(s, 2, 0); near = tileAt(s, 2, 2); p(s, 'nha-binh').tile = own.locationId
  await load(s); await click('.pt-actions > button:last-child')
  const select = document.querySelector('.pt-action-panel > label select'); select.value = 'nha-binh'; select.dispatchEvent(new Event('change', { bubbles: true })); await pause()
  await tileClick(near.locationId); check(p(saved(), 'nha-binh').tile === near.locationId && saved().actionsLeft === 2, 'Commander moves chosen teammate two steps')

  s = seed('huong-dao-luc'); await load(s); await click('.pt-actions > button:last-child')
  const jump = s.board.find(t => t.locationId !== p(s, 'huong-dao-luc').tile).locationId; await tileClick(jump)
  check(saved().guideUsed && document.querySelector('.pt-actions > button:last-child').disabled, 'Guide locks after one jump')

  s = seed('truyen-lenh-lam'); give(s, 'truyen-lenh-lam', ['coc-ngam']); p(s, 'nha-binh').tile = s.board.find(t => t.locationId !== p(s, 'truyen-lenh-lam').tile).locationId
  await load(s); await click('.pt-hand > button'); await click('.pt-recipients > button:nth-child(' + (s.players.filter(p => p.id !== 'truyen-lenh-lam').findIndex(p => p.id === 'nha-binh') + 1) + ')')
  check(p(saved(), 'nha-binh').hand.includes('coc-ngam'), 'Truyền Lệnh shares to a remote teammate')

  s = seed('nha-tuong'); give(s, 'nha-tuong', ['coc-ngam']); await load(s); await click('.pt-hand > button')
  check([...document.querySelectorAll('.pt-recipients > button')].every(b => b.disabled), 'Ordinary sharing rejects teammates on other tiles')

  s = seed('nha-tuong'); give(s, 'nha-tuong', ['coc-ngam', 'coc-ngam', 'coc-ngam', 'coc-ngam']); p(s, 'nha-tuong').tile = locations.find(l => l.strategyId === 'coc-ngam').id
  await load(s); await click('.pt-goals > button:first-child')
  check(saved().completed.includes('coc-ngam') && saved().synergy === 1 && p(saved(), 'nha-tuong').hand.length === 0, 'Completing a real strategy discards four cards and earns synergy')

  s = seed('nha-tuong'); give(s, 'nha-tuong', ['coc-ngam', 'coc-ngam', 'coc-ngam', 'do-luong', 'mai-phuc'])
  const i = s.strategyDeck.indexOf('do-luong'); s.strategyDeck.unshift(s.strategyDeck.splice(i, 1)[0]); await load(s)
  await click('.pt-next'); await click('.pt-next')
  check(document.querySelector('.pt-next').disabled && p(saved(), 'nha-tuong').hand.length === 6, 'Overflow pauses drawing visibly')
  await click('.pt-hand > button:first-child'); await click('.pt-card-choices > button:first-of-type')
  check(p(saved(), 'nha-tuong').hand.length === 5 && !document.querySelector('.pt-next').disabled, 'Discard resumes the pending draw')

  s = seed('nha-tuong'); give(s, 'nha-tuong', ['co-lenh']); const removed = s.board.find(t => t.locationId === 'bach-dang')
  removed.status = 'removed'; s.floodDeck = s.floodDeck.filter(id => id !== removed.locationId); s.floodDiscard = s.floodDiscard.filter(id => id !== removed.locationId)
  p(s, 'nha-binh').tile = p(s, 'tham-quan').tile = removed.locationId; s.pendingEscape = ['nha-binh', 'tham-quan']; s.phase = 'escape'; s.floodRemaining = s.floodBatch = 2
  await load(s); await click('.pt-hand > button')
  const group = document.querySelector('.pt-group select'); group.value = removed.locationId; group.dispatchEvent(new Event('change', { bubbles: true })); await pause()
  await tileClick('luong-xam')
  check(!saved().pendingEscape.length && saved().phase === 'flood' && p(saved(), 'nha-binh').tile === 'luong-xam' && p(saved(), 'tham-quan').tile === 'luong-xam', 'Flag holder can rescue a remote group during escape')
  check(validateGame(saved(), catalog), 'UI special-card result remains save-valid')
  return { passed, width: innerWidth }
})()
