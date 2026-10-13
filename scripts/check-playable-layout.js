// Run in the local play.html developer console at 1280x900 or 1840x1080.
// This is intentionally independent from check-playable.js: it checks the
// playable page's desktop geometry and then restores the user's saved game.
;(async () => {
  const engine = await import('/src/game/engine.ts')
  const { locations } = await import('/src/data/locations.ts')
  const { cards } = await import('/src/data/cards.ts')
  const catalog = { locations, roles: cards.map(c => c.id) }
  const key = 'thuy-tran-playable-v1'
  const previous = localStorage.getItem(key)
  let passed = 0
  const check = (ok, text) => { if (!ok) throw Error(text); passed++ }
  const pause = (ms = 110) => new Promise(resolve => setTimeout(resolve, ms))
  const saved = () => JSON.parse(localStorage.getItem(key))
  const one = (...selectors) => selectors.map(s => document.querySelector(s)).find(Boolean)
  const all = (...selectors) => [...new Set(selectors.flatMap(s => [...document.querySelectorAll(s)]))]
  const rect = node => node?.getBoundingClientRect()
  const inside = (child, parent, bleed = 2) => {
    const c = rect(child), p = rect(parent)
    return !!c && !!p && c.left >= p.left - bleed && c.right <= p.right + bleed && c.top >= p.top - bleed && c.bottom <= p.bottom + bleed
  }
  const visible = node => !!node && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden'
  const unfolded = tile => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(tile).transform)
    return Math.abs(matrix.m41) < .5 && Math.abs(matrix.m42) < .5 && Math.abs(matrix.m11 - 1) < .01 && Math.abs(matrix.m22 - 1) < .01
  }
  const waitUntil = async (predicate, timeout = 5000) => {
    const deadline = performance.now() + timeout
    while (!predicate() && performance.now() < deadline) await pause(100)
    return predicate()
  }
  const click = async selector => {
    const b = document.querySelector(selector)
    check(b && !b.disabled, `Available: ${selector}`)
    b.click(); await pause()
  }
  const load = async state => {
    check(engine.validateGame(state, catalog), 'Layout fixture is a valid complete save')
    const transfer = new DataTransfer()
    transfer.items.add(new File([JSON.stringify(state)], 'layout-check.json', { type: 'application/json' }))
    const input = document.querySelector('input[type=file]')
    check(input, 'Game import input exists')
    input.files = transfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await pause(180)
  }
  const target = `${innerWidth}x${innerHeight}`
  let previousState = null
  let restoreState = previousState && engine.validateGame(previousState, catalog) ? previousState : null
  try { previousState = previous ? JSON.parse(previous) : null } catch { previousState = null }
  try {
    check(document.querySelector('.pt-page[data-ready=true]'), 'Artwork curtain opened')
    if (document.querySelector('.pt-setup')) {
      const submit = document.querySelector('.pt-setup-sheet button[type=submit]')
      check(submit, 'Setup can be submitted')
      submit.click(); await pause(1400)
      if (!restoreState) restoreState = saved()
    }
    if (!restoreState && previousState && engine.validateGame(previousState, catalog)) restoreState = previousState
    check(document.querySelector('.pt-table-layout') || document.querySelector('.pt-board'), 'Playable table rendered')
    if (!restoreState && saved() && engine.validateGame(saved(), catalog)) restoreState = saved()

    // The desktop contract has a left command/hand rail, the board in the
    // middle, and the team/status information on the right.
    const left = one('.pt-left-rail', '.pt-command-rail', '.pt-action-panel', '.pt-command-scroll')
    const hand = one('.pt-hand-area', '.pt-hand-tray', '.pt-hand-scroll')
    const board = one('.pt-board-viewport')
    const boardColumn = one('.pt-board-column') || board?.parentElement
    const team = one('.pt-team')
    const next = one('.pt-next', '.pt-command-scroll .pt-next')
    check(left && hand && board && team && next, 'Desktop command, hand, board, team, and next controls exist')
    const initialTiles = all('.pt-board-viewport .pt-tile', '.pt-board .pt-tile')
    await waitUntil(() => initialTiles.length === 24 && initialTiles.every(tile => unfolded(tile) && inside(tile, board, 2)))
    check(rect(left).left <= rect(board).left + 2, 'Command controls remain left of the board')
    check(rect(team).right >= rect(board).right - 2, 'Team summary remains on the right side of the board')
    check(!inside(left, board) && !inside(team, board), 'Side controls do not overlap the board viewport')
    check(inside(next, left) || inside(next, document.querySelector('.pt-shell')), 'Next control stays within its command area or shell')

    // At the two supported desktop reference sizes, the board gets at least
    // 65vh whenever the available width can accommodate the board geometry.
    const isReference = (innerWidth === 1280 && innerHeight === 900) || (innerWidth === 1840 && innerHeight === 1080)
    if (isReference) {
      const br = rect(board)
      check(br.height + 2 >= innerHeight * .65, `Board viewport is at least 65vh at ${target}`)
    }
    check(document.documentElement.scrollHeight <= innerHeight + 2, 'Desktop page has no vertical overflow')
    check(rect(next).left >= -2 && rect(next).right <= innerWidth + 2 && rect(next).top >= -2 && rect(next).bottom <= innerHeight + 2, 'Next control is wholly within the viewport')

    const boardTiles = all('.pt-board-viewport .pt-tile', '.pt-board .pt-tile')
    check(boardTiles.length === 24, 'Board contains all 24 location cards')
    await waitUntil(() => boardTiles.every(tile => unfolded(tile) && inside(tile, board, 2)))
    check(boardTiles.every(tile => unfolded(tile) && inside(tile, board, 2)), 'All 24 location cards unfold and fit inside the board viewport')
    const leftScroll = one('.pt-left-scroll', '.pt-command-scroll', '.pt-action-panel')
    if (leftScroll) check(rect(leftScroll).left >= -2 && rect(leftScroll).right <= innerWidth + 2 && rect(leftScroll).top >= -2 && rect(leftScroll).bottom <= innerHeight + 2, 'Left command scroll stays bounded by the viewport')

    // Import a real six-card overflow state. Six cards are legal only during
    // draw/overflow handling; this catches accidental five-card UI clipping.
    const fixture = engine.createGame({ playerCount: 6, difficulty: 'standard', seed: 'layout-six-card', characters: catalog.roles }, catalog)
    const actor = fixture.players[fixture.active]
    const regular = fixture.strategyDeck.filter(id => id !== 'trieu-bien' && id !== 'co-lenh' && id !== 'gia-co')
    const extra = regular.slice(0, 4)
    extra.forEach(id => fixture.strategyDeck.splice(fixture.strategyDeck.indexOf(id), 1))
    actor.hand.push(...extra)
    fixture.phase = 'draw'; fixture.drawsRemaining = 1
    check(engine.validateGame(fixture, catalog), 'Six-card draw fixture is valid')
    await load(fixture)
    const current = saved(), active = current.players[current.active]
    check(active.hand.length === 6 && current.phase === 'draw' && current.drawsRemaining === 1, 'Imported fixture preserves six cards and pending draw')
    const handViewport = one('.pt-hand-scroll', '.pt-hand-viewport', '.pt-hand')
    const handCards = all('.pt-hand > button', '.pt-hand-tray button[data-card]', '.pt-hand-area button[data-card]')
    check(handCards.length === 6 && handCards.every(visible), 'All six active hand cards render')
    check(handCards.every(card => { const r = rect(card); return r.left >= -2 && r.right <= innerWidth + 2 && r.top >= -2 && r.bottom <= innerHeight + 2 }), 'All six hand cards stay within the viewport')
    if (innerWidth === 1280 && innerHeight === 900) check(handCards.every(card => inside(card, handViewport, 2)), 'All six cards are visible in the 1280x900 hand tray')
    check(!handViewport || rect(handViewport).right <= innerWidth + 2, 'Hand tray remains within the viewport')
    handCards[handCards.length - 1].click(); await pause(400)
    const discard = document.querySelector('.pt-card-choices > button:first-of-type')
    check(discard && !discard.disabled && inside(discard, one('.pt-hand-area'), 2), 'Overflow discard stays visible inside the hand tray')
    check(rect(discard).bottom <= innerHeight + 2, 'Overflow can be resolved without scrolling the page')
    await click('.pt-card-choices > button:last-child')

    const menu = one('.pt-game-menu', 'details.pt-game-menu')
    check(menu?.tagName === 'DETAILS', 'Game management uses native details')
    const summary = menu?.querySelector(':scope > summary')
    check(summary, 'Game management has a keyboard summary')
    summary.focus(); summary.click(); await pause(30)
    check(menu.open, 'Game management opens')
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await pause(30)
    check(!menu.open, 'Escape closes game management')
    const menuText = menu.textContent || ''
    check(/ván mới|new game/i.test(menuText), 'Game menu contains new-game control')
    check(/mở ván|load|mở file/i.test(menuText), 'Game menu contains load control')
    check(/lưu file|save/i.test(menuText), 'Game menu contains save control')
    check([...menu.querySelectorAll('button')].length >= 3, 'Game controls stay grouped inside the details menu')
    const toolbar = one('.pt-toolbar')
    const toolbarButtons = toolbar ? [...toolbar.querySelectorAll('button')] : []
    check(toolbarButtons.length >= 3, 'Toolbar has rules, recording, and fullscreen controls')
    check(/luật|rule/i.test(toolbarButtons[0].textContent || ''), 'Toolbar first button is rules')
    check(/quay|record|content/i.test(toolbarButtons[1].textContent || ''), 'Toolbar second button is recording/content')
    check(/toàn màn|full/i.test(toolbarButtons[2].textContent || ''), 'Toolbar third button is fullscreen')
    check(one('.pt-log'), 'Game log remains available')
    return { passed, target, referenceGeometry: isReference }
  } finally {
    if (restoreState && engine.validateGame(restoreState, catalog)) {
      try { await load(restoreState); await waitUntil(() => all('.pt-tile').every(unfolded)) } catch { /* Preserve the storage fallback below if UI restoration is unavailable. */ }
    }
    if (previous === null) localStorage.removeItem(key)
    else localStorage.setItem(key, previous)
  }
})()
