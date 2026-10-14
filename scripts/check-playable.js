// Smoke/layout checks for the current desktop web game. Run in local play.html.
// This script observes the current save without changing the game.
;(async () => {
  let passed = 0
  const check = (ok, text) => { if (!ok) throw Error(text); passed++ }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const deadline = Date.now() + 30000
  const frame = () => new Promise(requestAnimationFrame)
  while (document.querySelector('.wg-game')?.dataset.ready !== 'true' || document.querySelector('.wg-game')?.dataset.busy !== 'false') {
    if (Date.now() > deadline) throw Error('Game did not finish loading/dealing')
    await sleep(100)
  }
  const menu = document.querySelector('.wg-menu-secondary')
  if (menu) { menu.click(); await frame(); await frame() }
  check(!document.querySelector('.wg-menu'), 'Enter or resume a game before measuring its board')
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await sleep(1500)
  const { validateGame } = await import('/src/game/engine.ts')
  const { locations } = await import('/src/data/locations.ts')
  const { cards } = await import('/src/data/cards.ts')
  const game = JSON.parse(localStorage.getItem('thuy-tran-webgame-v2'))
  check(validateGame(game, { locations, roles: cards.map(c => c.id) }), 'Current game can be restored')
  check(game.players.length >= 4 && game.players.length <= 6 && new Set(game.players.map(p => p.id)).size === game.players.length, 'Four to six distinct roles')
  check(document.querySelectorAll('.wg-player').length === game.players.length, 'One hand selector per player')
  check(!document.querySelector('a[href], .site-header, .site-footer, input[type=file], .pt-setup'), 'Only gameplay, no site links or admin panels')
  const tiles = [...document.querySelectorAll('.wg-tile')]
  check(tiles.length === 24 && new Set(tiles.map(t => t.dataset.id)).size === 24, '24 distinct locations')
  check(JSON.stringify(game.board.reduce((counts, tile) => { counts[tile.row]++; return counts }, [0,0,0,0,0,0])) === '[2,4,6,6,4,2]', 'Board shape')
  const inside = r => r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1
  const intersects = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left) > 1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top) > 1
  const hud = [...document.querySelectorAll('.wg-turn,.wg-players,.wg-goals,.wg-water,.wg-piles,.wg-controls,.wg-hand-card,.wg-card-readout')]
  for (const tile of tiles) {
    const r = tile.getBoundingClientRect()
    check(inside(r) && Math.abs(r.width-r.height) < 1.1, `Square card fits: ${tile.dataset.id}`)
    check(hud.every(node => !intersects(r,node.getBoundingClientRect())), `HUD does not cover ${tile.dataset.id}`)
    check(getComputedStyle(tile).borderRadius !== '0px', 'Rounded corners')
  }
  check([...document.querySelectorAll('.wg-paper img')].every(img => img.complete && img.naturalWidth > 0 && img.naturalWidth === img.naturalHeight), 'Both square artwork faces loaded')
  check(document.querySelector('.wg-deck[data-deck=strategy] img').src.includes('back-ke-sach'), 'Actual red strategy back')
  check(document.querySelector('.wg-deck[data-deck=flood] img').src.includes('back-the-nuoc'), 'Actual blue flood back')
  check(document.querySelector('.wg-water-track > img')?.src.includes('water-track'), 'Actual water track artwork')
  check(document.querySelectorAll('.wg-pawn').length === game.players.length, 'One pawn per player')
  check(hud.every(node => inside(node.getBoundingClientRect())), 'Necessary controls fit viewport')
  check([...document.querySelectorAll('.wg-hand-card')].every(b => b.querySelector('img').naturalWidth > 0), 'Hand artwork loaded')
  check(document.documentElement.scrollWidth <= innerWidth + 1 && document.documentElement.scrollHeight <= innerHeight + 1, 'One viewport without page overflow')
  return { passed, viewport: `${innerWidth}×${innerHeight}`, board: Math.round(document.querySelector('.wg-board').getBoundingClientRect().width) }
})()
