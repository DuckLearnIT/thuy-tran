// Local-browser gameplay checks for the standalone four-player web game.
// Run in the game's dev-console page; setup(name) writes one valid save and
// test(name) exercises only the rendered .wg-* controls after the page reloads.
;(async () => {
  const engine = await import('/src/game/engine.ts')
  const { locations } = await import('/src/data/locations.ts')
  const { cards } = await import('/src/data/cards.ts')
  const catalog = { locations, roles: cards.map(c => c.id) }
  const key = 'thuy-tran-webgame-v2'
  const names = ['share-same', 'share-remote', 'fortify-two', 'command-two', 'guide-once', 'boat-cross', 'overflow-discard', 'complete-four', 'tide-overflow-stack', 'flag-escape', 'gia-co', 'win', 'hq-loss']
  const regular = [...engine.regularStrategyIds]
  let assertions = 0
  const check = (ok, text) => { if (!ok) throw Error(text); assertions++ }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const saved = () => JSON.parse(localStorage.getItem(key) || 'null')
  const p = (s, id) => s.players.find(item => item.id === id)
  const t = (s, id) => s.board.find(item => item.locationId === id)
  const rowTile = (s, row, col) => s.board.find(item => item.row === row && item.col === col)
  const roles = ['nha-tuong', 'nha-binh', 'tham-quan', 'thuyen-nhe', 'truyen-lenh-lam', 'huong-dao-luc']

  const base = (seed, activeId, chosen = roles.slice(0, 4), difficulty = 'standard') => {
    const s = engine.createGame({ playerCount: 4, difficulty, seed, characters: chosen }, catalog)
    s.active = s.players.findIndex(item => item.id === activeId)
    check(s.active >= 0, `Missing active role ${activeId}`)
    return s
  }
  const allocate = (s, hands) => {
    const pool = [...s.strategyDeck, ...s.strategyDiscard, ...s.players.flatMap(item => item.hand)]
    s.players.forEach(item => { item.hand = hands[item.id] ? [...hands[item.id]] : [] })
    const used = s.players.flatMap(item => item.hand)
    used.forEach(id => { const i = pool.indexOf(id); check(i >= 0, `Card not in pool: ${id}`); pool.splice(i, 1) })
    s.strategyDiscard = []
    s.strategyDeck = pool
  }
  const putFirst = (s, ids) => { ids.slice().reverse().forEach(id => { const i = s.strategyDeck.indexOf(id); check(i >= 0, `Card not in deck: ${id}`); s.strategyDeck.splice(i, 1); s.strategyDeck.unshift(id) }) }
  const removeLocation = (s, id) => {
    t(s, id).status = 'removed'
    s.floodDeck = s.floodDeck.filter(x => x !== id)
    s.floodDiscard = s.floodDiscard.filter(x => x !== id)
  }
  const prepareFloodDeck = (s, empty = false) => {
    const active = s.board.filter(x => x.status !== 'removed').map(x => x.locationId)
    s.floodDiscard = empty ? active : active.slice(0, 1)
    s.floodDeck = empty ? [] : active.slice(1)
  }
  const save = s => { check(engine.validateGame(s, catalog), 'Fixture is not a valid complete save'); localStorage.setItem(key, JSON.stringify(s)); return s }

  const setup = name => {
    check(names.includes(name), `Unknown fixture: ${name}`)
    let s
    if (name === 'share-same') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); p(s, 'nha-binh').tile = p(s, 'nha-tuong').tile; allocate(s, { 'nha-tuong': ['coc-ngam'] })
    } else if (name === 'share-remote') {
      s = base(name, 'truyen-lenh-lam', ['truyen-lenh-lam', 'nha-binh', 'nha-tuong', 'tham-quan']); p(s, 'nha-binh').tile = rowTile(s, 2, 0).locationId; p(s, 'truyen-lenh-lam').tile = rowTile(s, 2, 5).locationId; allocate(s, { 'truyen-lenh-lam': ['coc-ngam'] })
    } else if (name === 'fortify-two') {
      s = base(name, 'nha-binh', ['nha-binh', 'nha-tuong', 'tham-quan', 'thuyen-nhe']); const a = rowTile(s, 2, 2), b = rowTile(s, 2, 3); p(s, 'nha-binh').tile = a.locationId; a.status = b.status = 'danger'
    } else if (name === 'command-two') {
      s = base(name, 'nha-tuong', ['nha-tuong', 'nha-binh', 'tham-quan', 'thuyen-nhe']); p(s, 'nha-tuong').tile = rowTile(s, 2, 0).locationId; p(s, 'nha-binh').tile = rowTile(s, 2, 1).locationId
    } else if (name === 'guide-once') {
      s = base(name, 'huong-dao-luc', ['huong-dao-luc', 'nha-tuong', 'nha-binh', 'tham-quan'])
    } else if (name === 'boat-cross') {
      s = base(name, 'thuyen-nhe', ['thuyen-nhe', 'nha-tuong', 'nha-binh', 'tham-quan']); p(s, 'thuyen-nhe').tile = rowTile(s, 2, 0).locationId; rowTile(s, 2, 1).status = 'danger'; rowTile(s, 2, 2).status = 'stable'
    } else if (name === 'overflow-discard') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); s.phase = 'draw'; s.drawsRemaining = 2; allocate(s, { 'nha-tuong': ['coc-ngam', 'do-luong', 'mai-phuc', 'nghi-binh', 'coc-ngam'] }); putFirst(s, ['do-luong'])
    } else if (name === 'complete-four') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); const goal = s.board.find(x => s.locationStrategies['coc-ngam'].includes(x.locationId)); p(s, 'nha-tuong').tile = goal.locationId; allocate(s, { 'nha-tuong': ['coc-ngam', 'coc-ngam', 'coc-ngam', 'coc-ngam'] })
    } else if (name === 'tide-overflow-stack') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); const keep = new Set(['luong-xam', ...regular.flatMap(id => s.locationStrategies[id][0])]); s.board.filter(tile => !keep.has(tile.locationId)).forEach(tile => removeLocation(s, tile.locationId)); s.players.forEach(item => { item.tile = 'luong-xam' }); s.phase = 'draw'; s.drawsRemaining = 2; allocate(s, { 'nha-tuong': ['coc-ngam', 'do-luong', 'mai-phuc', 'nghi-binh', 'coc-ngam'] }); putFirst(s, ['trieu-bien', 'do-luong']); prepareFloodDeck(s, true)
    } else if (name === 'flag-escape') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); const danger = rowTile(s, 2, 2); removeLocation(s, danger.locationId); p(s, 'nha-tuong').tile = p(s, 'nha-binh').tile = danger.locationId; s.pendingEscape = ['nha-tuong', 'nha-binh']; s.phase = 'escape'; s.floodRemaining = s.floodBatch = 1; prepareFloodDeck(s); allocate(s, { 'nha-tuong': ['co-lenh'] })
    } else if (name === 'gia-co') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); const danger = rowTile(s, 2, 2); danger.status = 'danger'; s.phase = 'flood'; s.floodRemaining = s.floodBatch = 1; allocate(s, { 'nha-tuong': ['gia-co'] })
    } else if (name === 'win') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); s.completed = regular.slice(); s.players.forEach(item => { item.tile = 'luong-xam' }); allocate(s, { 'nha-tuong': ['co-lenh'] }); s.phase = 'actions'; s.actionsLeft = 3
    } else if (name === 'hq-loss') {
      s = base(name, 'nha-tuong', roles.slice(0, 4)); t(s, 'luong-xam').status = 'danger'; s.phase = 'flood'; s.floodRemaining = s.floodBatch = 1; const all = s.board.map(x => x.locationId); s.floodDeck = ['luong-xam', ...all.filter(id => id !== 'luong-xam')]; s.floodDiscard = []
    }
    return save(s)
  }

  const waitIdle = async () => {
    const deadline = performance.now() + 15000
    while (performance.now() < deadline) {
      const root = document.querySelector('.wg-game')
      if (root?.dataset.ready === 'true' && root.dataset.busy === 'false') {
        await sleep(100)
        if (root.dataset.busy === 'false') return
      }
      await sleep(80)
    }
    throw Error('Timed out waiting for .wg-game data-busy=false')
  }
  const click = async selector => { const node = document.querySelector(selector); check(node && !node.disabled, `Clickable: ${selector}`); node.click(); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); await waitIdle() }
  const tileClick = id => click(`.wg-tile[data-id="${id}"]`)
  const assertSave = () => check(engine.validateGame(saved(), catalog), 'Persisted state is save-valid')

  const test = async name => {
    assertions = 0
    await waitIdle()
    // Let the initial deal of location tiles finish before clicking their positions.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await sleep(1500)
    let s = saved(); check(s?.players?.length === 4, 'Standalone game has four players')
    if (name === 'share-same') {
      await click('[data-action="share"]'); await click('.wg-hand-card[data-card="coc-ngam"]');
      const remote = [...document.querySelectorAll('.wg-recipients [data-recipient]')].find(node => node.dataset.recipient === 'tham-quan')
      check(remote?.disabled, 'Ordinary remote share is disabled')
      await click('.wg-recipients [data-recipient="nha-binh"]'); check(p(saved(), 'nha-binh').hand.includes('coc-ngam'), 'Same-tile share succeeds')
    } else if (name === 'share-remote') {
      await click('[data-action="share"]'); await click('.wg-hand-card[data-card="coc-ngam"]'); await click('.wg-recipients [data-recipient="nha-binh"]'); check(p(saved(), 'nha-binh').hand.includes('coc-ngam'), 'Truyền Lệnh shares remotely')
    } else if (name === 'fortify-two') {
      const a = rowTile(s, 2, 2).locationId, b = rowTile(s, 2, 3).locationId; await click('[data-action="fortify"]'); await tileClick(a); await tileClick(b); await click('.wg-next'); check(t(saved(), a).status === 'stable' && t(saved(), b).status === 'stable' && saved().actionsLeft === 2, 'Nha Binh fortifies two tiles for one action')
    } else if (name === 'command-two') {
      const target = rowTile(s, 2, 3).locationId; await click('[data-action="command"]'); await click('.wg-choice-panel button[title^="Nha Binh"]'); await tileClick(target); check(p(saved(), 'nha-binh').tile === target && saved().actionsLeft === 2, 'Nha Tuong commands two spaces')
    } else if (name === 'guide-once') {
      const target = s.board.find(x => x.locationId !== p(s, 'huong-dao-luc').tile && x.status !== 'removed').locationId; await click('[data-action="scout"]'); await tileClick(target); check(saved().guideUsed && saved().actionsLeft === 2, 'Guide moves once'); check(document.querySelector('[data-action="scout"]')?.disabled, 'Guide control locks after use')
    } else if (name === 'boat-cross') {
      const target = rowTile(s, 2, 2).locationId; await tileClick(target); check(p(saved(), 'thuyen-nhe').tile === target && saved().actionsLeft === 2, 'Boat crosses danger to next stable tile')
    } else if (name === 'overflow-discard') {
      await click('.wg-next'); check(saved().players.find(x => x.id === 'nha-tuong').hand.length === 6 && document.querySelector('.wg-next').disabled, 'Overflow pauses after draw'); await click('.wg-hand-card:first-child'); await click('.wg-discard-card'); check(p(saved(), 'nha-tuong').hand.length === 5, 'Discard resolves overflow')
    } else if (name === 'complete-four') {
      await click('[data-goal="coc-ngam"]'); check(saved().completed.includes('coc-ngam') && saved().synergy === 1, 'Four matching cards complete strategy')
    } else if (name === 'tide-overflow-stack') {
      await click('.wg-next'); check(saved().tide === 3 && saved().phase === 'draw', 'Triều Biến consumes first draw without hand card'); await click('.wg-next'); check(saved().drawsRemaining === 0 && p(saved(), 'nha-tuong').hand.length === 6 && document.querySelector('.wg-next').disabled, 'Second draw creates overflow'); await click('.wg-hand-card:first-child'); await click('.wg-discard-card'); check(saved().phase === 'flood', 'Overflow discard resumes into flood'); await click('.wg-deck[data-deck="flood"]'); check(saved().phase === 'flood' || saved().phase === 'escape' || saved().phase === 'lost', 'Flood draw completes after stack refill')
    } else if (name === 'flag-escape') {
      await click('.wg-hand-card[data-card="co-lenh"]'); const origin = [...document.querySelectorAll('.wg-flag-choices .wg-choice-panel button')].find(node => node.getAttribute('aria-pressed') === 'true'); check(origin && !origin.disabled, 'Flag origin can be selected during escape'); await click('.wg-flag-choices .wg-choice-panel button[aria-pressed="true"]'); await tileClick('luong-xam'); check(saved().phase === 'flood' && !saved().pendingEscape.length && p(saved(), 'nha-binh').tile === 'luong-xam', 'Flag rescues escape group')
    } else if (name === 'gia-co') {
      const target = rowTile(s, 2, 2).locationId; await click('.wg-hand-card[data-card="gia-co"]'); await tileClick(target); check(t(saved(), target).status === 'stable' && saved().actionsLeft === 3, 'Gia Co rescues without spending action')
    } else if (name === 'win') {
      await click('.wg-hand-card[data-card="co-lenh"]'); await click('.wg-win'); check(document.querySelector('.wg-result[data-result="won"]'), 'Victory transition renders winner result')
    } else if (name === 'hq-loss') {
      await click('.wg-deck[data-deck="flood"]'); check(document.querySelector('.wg-result[data-result="lost"]') && saved().phase === 'lost', 'HQ flood transition renders loser result')
    }
    assertSave()
    return { name, passed: true, assertions }
  }

  window.__webgameQA = { setup, test, scenarios: names }
  return window.__webgameQA
})()
