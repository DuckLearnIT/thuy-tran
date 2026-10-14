import { createGame, moveTargets, regularStrategyIds, transition, type Catalog, type GameState } from '../src/game/engine.ts'

const ids = ['bach-dang', 'cua-nam-trieu', 'trang-kenh', 'song-chanh', 'luong-xam', 'cua-bien-an-bang', 'song-cam', 'gia-vien', 'bai-coc-ngam', 'ben-chuyen-go', 'bai-chuan-bi-coc', 'bai-bun-trieu', 'go-dat-cao', 'lach-nuoc-sau', 'nga-ba-dong-nuoc', 'khuc-song-cong', 'bo-lau', 'rung-ven-song', 'ben-thuyen-nhe', 'vung-nuoc-lang', 'ben-tap-ket', 'bai-tiep-luong', 'bo-dat-thap', 'loi-song-hep']
const roles = ['nha-tuong', 'nha-binh', 'tham-quan', 'thuyen-nhe', 'truyen-lenh-lam', 'huong-dao-luc']
const roleAt: Record<string, string> = { 'nha-tuong': 'luong-xam', 'nha-binh': 'ben-chuyen-go', 'thuyen-nhe': 'bai-bun-trieu', 'truyen-lenh-lam': 'bai-tiep-luong', 'huong-dao-luc': 'cua-bien-an-bang', 'tham-quan': 'rung-ven-song' }
const strategyAt: Record<string, string[]> = { 'coc-ngam': ['bai-coc-ngam', 'bai-chuan-bi-coc'], 'do-luong': ['lach-nuoc-sau', 'nga-ba-dong-nuoc'], 'mai-phuc': ['trang-kenh', 'bo-lau'], 'nghi-binh': ['ben-thuyen-nhe', 'ben-tap-ket'] }
const catalog: Catalog = { locations: ids.map(id => ({ id, characterId: Object.entries(roleAt).find(([, tile]) => tile === id)?.[0], strategyId: Object.entries(strategyAt).find(([, tiles]) => tiles.includes(id))?.[0] })), roles }
const failures: string[] = []
const pass = (label: string, test: () => void) => { try { test(); console.log(`PASS ${label}`) } catch (error) { const message = error instanceof Error ? error.message : String(error); failures.push(`${label}: ${message}`); console.error(`FAIL ${label}: ${message}`) } }
const game = (difficulty: 'learn' | 'standard', seed: string, playerCount: 4 | 5 | 6 = 4) => createGame({ playerCount, difficulty, seed }, catalog)
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const player = (state: GameState, id: string) => state.players.find(item => item.id === id)!
const tile = (state: GameState, id: string) => state.board.find(item => item.locationId === id)!

pass('random 4 of 6 across 50 seeds', () => {
  const seen = new Set<string>()
  for (let i = 0; i < 50; i++) {
    const state = game('learn', `webgame-random-${i}`)
    if (state.players.length !== 4 || new Set(state.players.map(item => item.id)).size !== 4) throw Error(`seed ${i} did not produce four unique players`)
    state.players.forEach(item => { if (!roles.includes(item.id) || item.hand.length !== 2 || item.hand.includes('trieu-bien')) throw Error(`invalid setup for ${item.id}`); seen.add(item.id) })
  }
  if (seen.size !== 6) throw Error(`only ${seen.size}/6 roles appeared`)
})

pass('learn and standard card totals', () => {
  for (const difficulty of ['learn', 'standard'] as const) {
    const state = game(difficulty, `webgame-count-${difficulty}`)
    const cards = [...state.strategyDeck, ...state.strategyDiscard, ...state.players.flatMap(item => item.hand)]
    const expected = difficulty === 'learn' ? 27 : 28
    if (cards.length !== expected) throw Error(`${difficulty} has ${cards.length}, expected ${expected}`)
    if (state.players.some(item => item.hand.includes('trieu-bien'))) throw Error(`${difficulty} dealt Triều Biến to a hand`)
  }
})

pass('seed replay and createGame immutability', () => {
  const before = clone(catalog)
  const a = game('standard', 'webgame-replay')
  const b = game('standard', 'webgame-replay')
  if (JSON.stringify(a) !== JSON.stringify(b)) throw Error('same seed differs')
  if (JSON.stringify(catalog) !== JSON.stringify(before)) throw Error('catalog mutated')
  const beforeState = JSON.stringify(a)
  const actor = a.players[a.active]
  const target = moveTargets(a, actor.id)[0]
  if (!target) throw Error('no target fixture')
  transition(a, { type: 'move', target })
  if (JSON.stringify(a) !== beforeState) throw Error('transition mutated input state')
})

pass('forced actual victory', () => {
  const state = game('standard', 'webgame-win')
  state.completed = [...regularStrategyIds]
  state.players.forEach(item => { item.tile = 'luong-xam' })
  const owner = state.players[state.active]
  owner.hand = ['co-lenh']
  state.active = state.players.indexOf(owner)
  const next = transition(state, { type: 'victory', owner: owner.id, cardIndex: 0 })
  if (next.phase !== 'won' || next.lastEvent.type !== 'victory') throw Error('victory transition did not win')
})

pass('forced actual loss at headquarters', () => {
  const state = game('standard', 'webgame-loss')
  state.phase = 'flood'
  state.floodRemaining = 1
  state.floodDeck = ['luong-xam']
  tile(state, 'luong-xam').status = 'danger'
  const next = transition(state, { type: 'drawFlood' })
  if (next.phase !== 'lost' || next.lastEvent.type !== 'lost' || tile(next, 'luong-xam').status !== 'removed') throw Error('headquarters loss transition failed')
})

pass('round tide rises exactly once for 4, 5 and 6 players', () => {
  for (const playerCount of [4, 5, 6] as const) {
    const state = game('standard', `webgame-round-${playerCount}`, playerCount)
    const trapped = tile(state, 'bach-dang'); trapped.status = 'removed'; state.players[0].tile = trapped.locationId
    state.phase = 'escape'; state.pendingEscape = [state.players[0].id]; state.floodRemaining = 0; state.floodBatch = 0; state.turn = playerCount
    const before = state.tide
    const target = moveTargets(state, state.players[0].id, 'escape')[0]
    if (!target) throw Error(`${playerCount} player escape fixture has no target`)
    const next = transition(state, { type: 'escape', target })
    if (next.phase !== 'actions' || next.tide !== before + 1 || next.turn !== playerCount + 1) throw Error(`${playerCount} player round did not rise once`)
    const again = tile(next, 'cua-nam-trieu'); again.status = 'removed'; next.players[0].tile = again.locationId
    const target2 = moveTargets(next, next.players[0].id, 'escape')[0]
    if (!target2) throw Error(`${playerCount} player second escape fixture has no target`)
    const following = transition({ ...next, phase: 'escape', pendingEscape: [next.players[0].id] }, { type: 'escape', target: target2 })
    if (following.tide !== next.tide) throw Error(`${playerCount} player rose before a full next round`)
  }
})

pass('final flood waits for escapes and Flag rescues once at round boundary', () => {
  const state = game('standard', 'webgame-round-escape', 4)
  state.phase = 'escape'; state.floodRemaining = 0; state.floodBatch = 0; state.turn = 4
  const removed = tile(state, 'bach-dang'); removed.status = 'removed'
  state.players[0].tile = removed.locationId; state.players[1].tile = removed.locationId
  state.pendingEscape = [state.players[0].id, state.players[1].id]
  const escapeTarget = moveTargets(state, state.players[0].id, 'escape')[0]
  if (!escapeTarget) throw Error('final flood escape fixture has no target')
  const waiting = transition(state, { type: 'escape', target: escapeTarget })
  if (waiting.phase !== 'escape' || waiting.tide !== state.tide) throw Error('tide rose before remaining escape')
  const owner = waiting.players[2]
  owner.hand = ['co-lenh']
  const rescued = transition(waiting, { type: 'flag', owner: owner.id, cardIndex: 0, players: [waiting.players[1].id], target: 'luong-xam' })
  if (rescued.phase !== 'actions' || rescued.pendingEscape.length || rescued.tide !== state.tide + 1) throw Error('Flag end-round rescue did not rise once')
  const count = rescued.log.filter(line => line.includes('sau một vòng nhân vật')).length
  if (count !== 1) throw Error('Flag rescue produced duplicate round rise')
})

pass('Triều Biến plus round boundary adds two rises and preserves event metadata', () => {
  const state = game('standard', 'webgame-round-tide-card', 4)
  state.phase = 'draw'; state.drawsRemaining = 1; state.turn = 4; state.strategyDeck = ['trieu-bien']; state.strategyDiscard = []
  const next = transition(state, { type: 'drawStrategy' })
  if (next.tide !== state.tide + 1 || next.phase !== 'flood') throw Error('Triều Biến did not rise once')
  next.floodRemaining = 0; next.floodBatch = 0; next.lastEvent = { type: 'removed', text: 'Ô thử nghiệm bị loại.', tile: 'bach-dang', card: 'trieu-bien' }
  const trapped = tile(next, 'bach-dang'); trapped.status = 'removed'; next.players[0].tile = trapped.locationId
  next.phase = 'escape'; next.pendingEscape = [next.players[0].id]
  const owner = next.players[2]; owner.hand = ['co-lenh']
  const round = transition(next, { type: 'flag', owner: owner.id, cardIndex: 0, players: [next.players[0].id], target: 'luong-xam' })
  if (round.tide !== next.tide + 1 || round.lastEvent.type !== 'flag' || round.lastEvent.tile !== 'luong-xam' || round.lastEvent.card !== 'co-lenh') throw Error('round rise overwrote event metadata')
})

pass('end-of-round tide loss preserves triggering flood tile', () => {
  const state = game('standard', 'webgame-round-loss', 4)
  state.tide = 8; state.turn = 4; state.phase = 'flood'; state.floodRemaining = 0; state.floodBatch = 0
  state.lastEvent = { type: 'removed', text: 'Ô cuối bị loại.', tile: 'bach-dang' }
  const trapped = tile(state, 'bach-dang'); trapped.status = 'removed'; state.players[0].tile = trapped.locationId
  state.phase = 'escape'; state.pendingEscape = [state.players[0].id]
  const owner = state.players[2]; owner.hand = ['co-lenh']
  const next = transition(state, { type: 'flag', owner: owner.id, cardIndex: 0, players: [state.players[0].id], target: 'luong-xam' })
  if (next.phase !== 'lost' || next.tide !== 9 || next.lastEvent.type !== 'lost' || next.lastEvent.tile !== 'luong-xam' || next.lastEvent.card !== 'co-lenh') throw Error('round tide loss or event metadata preservation failed')
})

console.log(`\n${failures.length ? `FAILURES ${failures.length}` : 'ALL WEBGAME ENGINE CHECKS PASSED'}`)
if (failures.length) process.exitCode = 1
