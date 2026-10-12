export type Difficulty = 'learn' | 'standard' | 'hard' | 'legend'
export const regularStrategyIds = ['coc-ngam', 'do-luong', 'mai-phuc', 'nghi-binh'] as const
export type LocationStatus = 'stable' | 'danger' | 'removed'
export type Phase = 'actions' | 'draw' | 'flood' | 'escape' | 'won' | 'lost'
export type Catalog = { locations: { id: string; characterId?: string; strategyId?: string }[]; roles: string[] }
export type BoardTile = { locationId: string; row: number; col: number; status: LocationStatus }
export type Player = { id: string; tile: string; hand: string[] }
export type LastEvent = { type: string; text: string; card?: string; tile?: string }
export type GameState = {
  version: 1; seed: string; rng: number; difficulty: Difficulty; board: BoardTile[]; players: Player[]
  active: number; turn: number; actionsLeft: number; phase: Phase; drawsRemaining: number; floodRemaining: number
  pendingEscape: string[]; forecast: string | null; completed: string[]; synergy: number
  strategyDeck: string[]; strategyDiscard: string[]; floodDeck: string[]; floodDiscard: string[]
  tide: number; guideUsed: boolean; lastEvent: LastEvent; log: string[]; floodBatch: number; floodTriubien: number
  locationStrategies: Record<string, string[]>
}
export type Action =
  | { type: 'move'; target: string } | { type: 'scoutMove'; target: string }
  | { type: 'fortify'; targets: string[] } | { type: 'share'; cardIndex: number; recipient: string }
  | { type: 'complete'; strategy: string } | { type: 'forecast' } | { type: 'command'; player: string; target: string }
  | { type: 'finishActions' } | { type: 'drawStrategy' } | { type: 'drawFlood' }
  | { type: 'escape'; target: string } | { type: 'discard'; player: string; cardIndex: number }
  | { type: 'reinforce'; owner: string; cardIndex: number; target: string }
  | { type: 'flag'; owner: string; cardIndex: number; players: string[]; target: string }
  | { type: 'victory'; owner: string; cardIndex: number } | { type: 'synergy'; target: string }

const ROWS = [2, 4, 6, 6, 4, 2]
const REGULAR: readonly string[] = regularStrategyIds
const CARD_IDS = [...REGULAR, 'trieu-bien', 'co-lenh', 'gia-co']
const DIFFICULTIES = ['learn', 'standard', 'hard', 'legend']
const NAMES: Record<string, string> = {
  'nha-tuong': 'Nha Tướng', 'nha-binh': 'Nha Binh', 'tham-quan': 'Thám Quân', 'thuyen-nhe': 'Quân Thuyền Nhẹ',
  'huong-dao-luc': 'Quân Hướng Đạo', 'truyen-lenh-lam': 'Quân Truyền Lệnh', 'coc-ngam': 'Cọc Ngầm',
  'do-luong': 'Dò Luồng', 'mai-phuc': 'Mai Phục', 'nghi-binh': 'Nghi Binh', 'trieu-bien': 'Triều Biến', 'co-lenh': 'Cờ Lệnh', 'gia-co': 'Gia Cố',
}
const name = (id: string) => NAMES[id] || id
const clone = <T,>(s: T): T => JSON.parse(JSON.stringify(s))
function reject(message: string): never { throw Error(message) }
function hash(s: string) { let n = 2166136261; for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619); return n >>> 0 }
function shuffle<T>(s: { rng: number }, input: T[]): T[] {
  const out = input.slice()
  for (let i = out.length - 1; i > 0; i--) {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0
    const j = Math.floor(s.rng / 4294967296 * (i + 1)); [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
const positions = ROWS.flatMap((count, row) => Array.from({ length: count }, (_, i) => ({ row, col: i + (6 - count) / 2 })))
const loc = (s: GameState, id: string) => s.board.find(t => t.locationId === id)
const player = (s: GameState, id: string) => s.players.find(p => p.id === id) || reject('Không tìm thấy nhân vật.')
const active = (s: GameState) => s.players[s.active]
const existing = (s: GameState) => s.board.filter(t => t.status !== 'removed').map(t => t.locationId)
const overflow = (s: GameState) => s.players.some(p => p.hand.length > 5)
const event = (s: GameState, e: LastEvent) => { s.lastEvent = e; s.log = [...s.log, e.text].slice(-150) }
const lose = (s: GameState, text: string) => { s.phase = 'lost'; event(s, { type: 'lost', text }) }
const card = (s: GameState, id: string, i: number, expected?: string) => {
  const c = player(s, id).hand[i]
  return Number.isInteger(i) && i >= 0 && c && (!expected || c === expected) ? c : reject('Lá bài không hợp lệ.')
}
function neighbours(s: GameState, id: string, diagonal = false): string[] {
  const t = loc(s, id); if (!t) return []
  return s.board.filter(x => x.status !== 'removed' && x.locationId !== id && Math.abs(x.row - t.row) <= 1 && Math.abs(x.col - t.col) <= 1 && (diagonal || x.row === t.row || x.col === t.col)).map(x => x.locationId)
}
function reachable(s: GameState, origin: string, distance: number): string[] {
  const seen = new Set([origin]), queue = [{ id: origin, d: 0 }]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]; if (current.d >= distance) continue
    for (const id of neighbours(s, current.id)) if (!seen.has(id)) { seen.add(id); queue.push({ id, d: current.d + 1 }) }
  }
  seen.delete(origin); return [...seen]
}
function boatTargets(s: GameState, id: string, escape: boolean): string[] {
  const origin = loc(s, id); if (!origin) return []
  const out: string[] = []
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let step = 1; step < 6; step++) {
      const t = s.board.find(x => x.row === origin.row + dr * step && x.col === origin.col + dc * step)
      if (!t) break
      if (t.status !== 'removed') { out.push(t.locationId); if (escape || t.status === 'stable') break }
    }
  }
  return out
}
export function moveTargets(s: GameState, id: string, mode: 'move' | 'command' | 'escape' | 'scout' = 'move'): string[] {
  const p = player(s, id)
  if (mode === 'command') return reachable(s, p.tile, 2)
  if (mode === 'scout') return p.id === 'huong-dao-luc' && !s.guideUsed ? existing(s).filter(t => t !== p.tile) : []
  if (mode === 'escape' && p.id === 'huong-dao-luc') return existing(s)
  if (p.id === 'thuyen-nhe') return boatTargets(s, p.tile, mode === 'escape')
  return neighbours(s, p.tile, p.id === 'tham-quan')
}
export function fortifyTargets(s: GameState, id: string): string[] {
  const p = player(s, id)
  return [p.tile, ...neighbours(s, p.tile, p.id === 'tham-quan')].filter(t => loc(s, t)?.status === 'danger')
}
export function canComplete(s: GameState, id: string): boolean {
  const p = active(s)
  return REGULAR.includes(id) && !s.completed.includes(id) && p.hand.filter(c => c === id).length >= 4 &&
    !!s.locationStrategies[id]?.includes(p.tile) && loc(s, p.tile)?.status !== 'removed'
}
function requireActions(s: GameState) {
  if (s.phase !== 'actions' || !s.actionsLeft) reject('Chưa thể thực hiện hành động này.')
  if (overflow(s)) reject('Xử lý tay bài vượt 5 lá trước khi tiếp tục.')
}
function refillFlood(s: GameState) { if (!s.floodDeck.length) { s.floodDeck = shuffle(s, s.floodDiscard); s.floodDiscard = [] } }
function prepareFlood(s: GameState) {
  if (s.phase !== 'draw' || s.drawsRemaining || overflow(s)) return
  // Finish both strategy draws before flooding; combine two Tide cards once
  // and preserve the untouched lower flood pile in its original order.
  if (s.floodTriubien) { s.floodDeck = [...shuffle(s, s.floodDiscard), ...s.floodDeck]; s.floodDiscard = []; s.floodTriubien = 0 }
  const rates = s.difficulty === 'learn' ? [1, 1, 2, 2, 2, 3, 3, 4] : [2, 2, 3, 3, 3, 4, 4, 5]
  s.phase = 'flood'; s.floodRemaining = rates[s.tide - 1]; s.floodBatch = s.floodRemaining
}
function resumeFlood(s: GameState) {
  if (s.phase === 'lost') return
  if (s.pendingEscape.length) { s.phase = 'escape'; return }
  if (s.floodRemaining) s.phase = 'flood'
  else {
    s.phase = 'actions'; s.active = (s.active + 1) % s.players.length; s.turn++; s.actionsLeft = 3; s.guideUsed = false
    s.drawsRemaining = 0; s.floodBatch = 0
  }
}
function removeCard(s: GameState, id: string, i: number) { const [c] = player(s, id).hand.splice(i, 1); s.strategyDiscard.push(c) }

export function createGame(options: { playerCount: 4 | 5 | 6; difficulty: Difficulty; seed: string; characters?: string[] }, catalog: Catalog): GameState {
  if (![4, 5, 6].includes(options.playerCount) || !DIFFICULTIES.includes(options.difficulty) || typeof options.seed !== 'string' || !options.seed.trim() || options.seed.length > 80) reject('Thiết lập ván chơi không hợp lệ.')
  if (catalog.locations.length !== 24 || new Set(catalog.locations.map(l => l.id)).size !== 24 || catalog.roles.length !== 6) reject('Bộ tài nguyên chưa đầy đủ.')
  const s: GameState = {
    version: 1, seed: options.seed, rng: hash(options.seed), difficulty: options.difficulty, board: [], players: [], active: 0,
    turn: 1, actionsLeft: 3, phase: 'actions', drawsRemaining: 0, floodRemaining: 0, pendingEscape: [], forecast: null,
    completed: [], synergy: 0, strategyDeck: [], strategyDiscard: [], floodDeck: [], floodDiscard: [],
    tide: options.difficulty === 'learn' ? 1 : options.difficulty === 'standard' ? 2 : options.difficulty === 'hard' ? 3 : 4,
    guideUsed: false, lastEvent: { type: 'setup', text: 'Bàn trận đã trải. Mỗi nhân vật nhận hai lá Kế sách.' },
    log: [], floodBatch: 0, floodTriubien: 0, locationStrategies: {},
  }
  s.board = shuffle(s, catalog.locations.map(l => l.id)).map((locationId, i) => ({ locationId, ...positions[i], status: 'stable' }))
  const chosen = options.characters || shuffle(s, catalog.roles).slice(0, options.playerCount)
  if (chosen.length !== options.playerCount || new Set(chosen).size !== chosen.length || chosen.some(id => !catalog.roles.includes(id))) reject('Chọn đúng số nhân vật khác nhau.')
  s.players = shuffle(s, chosen).map(id => ({ id, tile: catalog.locations.find(l => l.characterId === id)?.id || reject('Thiếu ô xuất phát.'), hand: [] }))
  for (const l of catalog.locations) if (l.strategyId) (s.locationStrategies[l.strategyId] ||= []).push(l.id)
  s.floodDeck = shuffle(s, catalog.locations.map(l => l.id))
  s.floodDiscard = s.floodDeck.splice(0, options.difficulty === 'learn' ? 4 : 6)
  s.floodDiscard.forEach(id => { loc(s, id)!.status = 'danger' })
  const tidal = Array(options.difficulty === 'learn' ? 2 : 3).fill('trieu-bien')
  s.strategyDeck = shuffle(s, [...REGULAR.flatMap(id => Array(5).fill(id)), ...tidal, 'co-lenh', 'co-lenh', 'co-lenh', 'gia-co', 'gia-co'])
  const skipped: string[] = []
  for (const p of s.players) while (p.hand.length < 2) {
    const c = s.strategyDeck.shift()!; if (c === 'trieu-bien') skipped.push(c); else p.hand.push(c)
  }
  s.strategyDeck = shuffle(s, [...s.strategyDeck, ...skipped])
  s.log = [s.lastEvent.text]; return s
}

export function transition(state: GameState, action: Action): GameState {
  const s = clone(state)
  if (s.phase === 'won' || s.phase === 'lost') reject('Ván đã kết thúc. Có thể hoàn tác hoặc trải ván mới.')
  if (overflow(s) && !['discard', 'reinforce', 'flag', 'victory', 'escape'].includes(action.type)) reject('Phải xử lý tay bài vượt 5 lá trước.')
  switch (action.type) {
    case 'move': case 'scoutMove': {
      requireActions(s); const p = active(s)
      if (!moveTargets(s, p.id, action.type === 'scoutMove' ? 'scout' : 'move').includes(action.target)) reject('Ô đích không nằm trong phạm vi di chuyển.')
      p.tile = action.target; s.actionsLeft--; if (action.type === 'scoutMove') s.guideUsed = true
      event(s, { type: action.type, text: `${name(p.id)} đã di chuyển.`, tile: action.target }); break
    }
    case 'command': {
      requireActions(s); if (active(s).id !== 'nha-tuong' || action.player === active(s).id || !moveTargets(s, action.player, 'command').includes(action.target)) reject('Điều một đồng đội tối đa hai bước theo cạnh; không dùng năng lực của đồng đội.')
      player(s, action.player).tile = action.target; s.actionsLeft--
      event(s, { type: 'command', text: `Nha Tướng điều động ${name(action.player)}.`, tile: action.target }); break
    }
    case 'fortify': {
      requireActions(s); const p = active(s), targets = [...new Set(action.targets)]
      if (!targets.length || targets.length > (p.id === 'nha-binh' ? 2 : 1) || targets.some(id => !fortifyTargets(s, p.id).includes(id))) reject('Chọn ô Nguy cấp đang đứng hoặc liền kề.')
      targets.forEach(id => { loc(s, id)!.status = 'stable' }); s.actionsLeft--
      event(s, { type: 'fortify', text: `${name(p.id)} củng cố ${targets.length} ô.`, tile: targets[0] }); break
    }
    case 'share': {
      requireActions(s); const p = active(s), recipient = player(s, action.recipient), c = card(s, p.id, action.cardIndex)
      if (p.id === recipient.id || !REGULAR.includes(c) || (p.id !== 'truyen-lenh-lam' && p.tile !== recipient.tile)) reject('Chỉ cho Kế sách thường cho đồng đội cùng ô; Truyền Lệnh được cho từ xa.')
      p.hand.splice(action.cardIndex, 1); recipient.hand.push(c); s.actionsLeft--
      event(s, { type: 'share', text: `${name(p.id)} trao ${name(c)} cho ${name(recipient.id)}.`, card: c }); break
    }
    case 'complete': {
      requireActions(s); if (!canComplete(s, action.strategy)) reject('Cần bốn lá cùng loại và đứng đúng địa danh có biểu tượng.')
      const p = active(s); for (let i = 0; i < 4; i++) removeCard(s, p.id, p.hand.indexOf(action.strategy))
      s.completed.push(action.strategy); s.synergy = Math.min(4, s.synergy + 1); s.actionsLeft--
      event(s, { type: 'complete', text: `Đã hoàn thành ${name(action.strategy)}. Cả đội nhận một Hiệp lực.`, card: action.strategy }); break
    }
    case 'forecast': {
      requireActions(s); if (s.forecast) reject('Dự báo đang có hiệu lực.')
      refillFlood(s); if (!s.floodDeck.length) reject('Chưa có lá Biến động để dự báo.')
      s.forecast = s.floodDeck[0]; s.actionsLeft--
      event(s, { type: 'forecast', text: 'Đã xem lá Biến động tiếp theo, không đổi thứ tự chồng bài.', tile: s.forecast }); break
    }
    case 'finishActions': {
      if (s.phase !== 'actions') reject('Chưa ở giai đoạn hành động.')
      s.phase = 'draw'; s.drawsRemaining = 2; event(s, { type: 'finishActions', text: 'Rút lần lượt hai lá Kế sách.' }); break
    }
    case 'drawStrategy': {
      if (s.phase !== 'draw' || !s.drawsRemaining) reject('Chưa thể rút Kế sách.')
      if (!s.strategyDeck.length) { s.strategyDeck = shuffle(s, s.strategyDiscard); s.strategyDiscard = [] }
      const c = s.strategyDeck.shift(); if (!c) reject('Chồng Kế sách chưa có lá để rút.')
      s.drawsRemaining--
      if (c === 'trieu-bien') {
        s.tide++; s.strategyDiscard.push(c); s.forecast = null; s.floodTriubien++
        if (s.tide > 8) { lose(s, 'Thủy triều vượt nấc tám. Cả đội thua.'); s.lastEvent.card = c; break }
      } else active(s).hand.push(c)
      event(s, { type: 'drawStrategy', text: c === 'trieu-bien' ? `Triều Biến: Thủy triều lên nấc ${s.tide}. Không rút bù.` : `Đã rút ${name(c)}.`, card: c })
      prepareFlood(s); break
    }
    case 'discard': {
      const p = player(s, action.player), c = card(s, p.id, action.cardIndex)
      if (p.hand.length <= 5) reject('Chỉ bỏ bài khi tay bài vượt năm lá.')
      removeCard(s, p.id, action.cardIndex); event(s, { type: 'discard', text: `${name(p.id)} bỏ ${name(c)} để giữ tối đa năm lá.`, card: c })
      prepareFlood(s); break
    }
    case 'reinforce': {
      card(s, action.owner, action.cardIndex, 'gia-co')
      if (loc(s, action.target)?.status !== 'danger') reject('Gia Cố chỉ cứu ô Nguy cấp còn tồn tại.')
      removeCard(s, action.owner, action.cardIndex); loc(s, action.target)!.status = 'stable'
      event(s, { type: 'reinforce', text: `${name(action.owner)} dùng Gia Cố, không tốn hành động.`, tile: action.target, card: 'gia-co' }); prepareFlood(s); break
    }
    case 'flag': {
      card(s, action.owner, action.cardIndex, 'co-lenh')
      const group = action.players.map(id => player(s, id))
      if (!group.length || new Set(action.players).size !== group.length || group.some(p => p.tile !== group[0].tile) || action.target === group[0].tile || !existing(s).includes(action.target)) reject('Chọn ít nhất một nhân vật cùng ô và một ô đích khác còn tồn tại.')
      group.forEach(p => { p.tile = action.target }); removeCard(s, action.owner, action.cardIndex)
      s.pendingEscape = s.pendingEscape.filter(id => !action.players.includes(id))
      event(s, { type: 'flag', text: `Cờ Lệnh chuyển ${group.length} nhân vật, không tốn hành động.`, tile: action.target, card: 'co-lenh' })
      if (s.phase === 'escape') resumeFlood(s); prepareFlood(s); break
    }
    case 'victory': {
      card(s, action.owner, action.cardIndex, 'co-lenh')
      if (s.completed.length !== 4 || loc(s, 'luong-xam')?.status === 'removed' || s.players.some(p => p.tile !== 'luong-xam')) reject('Cần đủ bốn kế sách và cả đội ở Đại bản doanh còn tồn tại.')
      removeCard(s, action.owner, action.cardIndex); s.phase = 'won'
      event(s, { type: 'victory', text: 'Bốn kế sách đã thành. Cả đội tập kết tại Lương Xâm, phát Cờ Lệnh và cùng thắng.', card: 'co-lenh' }); break
    }
    case 'synergy': {
      if (!['actions', 'draw', 'flood'].includes(s.phase) || s.synergy < 1 || loc(s, action.target)?.status !== 'danger') reject('Dùng Hiệp lực cho ô Nguy cấp trước khi công bố Biến động.')
      s.synergy--; loc(s, action.target)!.status = 'stable'
      event(s, { type: 'synergy', text: 'Cả đội dùng một Hiệp lực để cứu ô, không tốn hành động.', tile: action.target }); break
    }
    case 'drawFlood': {
      if (s.phase !== 'flood' || s.floodRemaining < 1) reject('Chưa thể công bố Biến động.')
      refillFlood(s); const id = s.floodDeck.shift(); if (!id) reject('Chưa có lá Biến động.')
      const t = loc(s, id); if (!t || t.status === 'removed') reject('Lá Biến động không hợp lệ.')
      s.forecast = null; s.floodRemaining--
      if (t.status === 'stable') { t.status = 'danger'; s.floodDiscard.push(id); event(s, { type: 'flood', text: 'Dòng nước tác động: ô chuyển sang Nguy cấp.', tile: id }) }
      else {
        t.status = 'removed'; event(s, { type: 'removed', text: 'Địa danh bị tác động lần hai và rời khỏi bàn.', tile: id })
        if (id === 'luong-xam') { lose(s, 'Đại bản doanh Lương Xâm đã mất. Cả đội thua.'); s.lastEvent.tile = id; break }
        const impossible = REGULAR.find(goal => !s.completed.includes(goal) && s.locationStrategies[goal].every(target => loc(s, target)?.status === 'removed'))
        if (impossible) { lose(s, `Cả hai ô của ${name(impossible)} đã mất trước khi hoàn thành. Cả đội thua.`); s.lastEvent.tile = id; break }
        s.pendingEscape = s.players.filter(p => p.tile === id).map(p => p.id)
        const trapped = s.pendingEscape.find(p => !moveTargets(s, p, 'escape').length)
        if (trapped) { lose(s, `${name(trapped)} không có nơi thoát hợp lệ. Cả đội thua.`); s.lastEvent.tile = id; break }
      }
      resumeFlood(s); break
    }
    case 'escape': {
      if (s.phase !== 'escape' || !s.pendingEscape.length || !moveTargets(s, s.pendingEscape[0], 'escape').includes(action.target)) reject('Chọn ô thoát hợp lệ cho nhân vật đang mắc kẹt.')
      const id = s.pendingEscape.shift()!; player(s, id).tile = action.target
      event(s, { type: 'escape', text: `${name(id)} thoát hiểm, không tốn hành động.`, tile: action.target }); resumeFlood(s); break
    }
    default: reject('Thao tác không được hỗ trợ.')
  }
  return s
}

// Saved games are data, never code. Check references, card conservation and
// pending decisions before accepting localStorage or a user-selected JSON file.
export function validateGame(value: unknown, catalog: Catalog): GameState | null {
  try {
    const s = value as GameState
    const int = (n: unknown, min: number, max: number) => Number.isInteger(n) && Number(n) >= min && Number(n) <= max
    const strings = (a: unknown): a is string[] => Array.isArray(a) && a.every(x => typeof x === 'string')
    if (!s || s.version !== 1 || typeof s.seed !== 'string' || !s.seed.trim() || s.seed.length > 80 || !int(s.rng, 0, 4294967295) || !DIFFICULTIES.includes(s.difficulty)) return null
    if (!Array.isArray(s.board) || s.board.length !== 24 || !Array.isArray(s.players) || s.players.length < 4 || s.players.length > 6) return null
    const locationIds = catalog.locations.map(l => l.id), used = new Set<string>(), coords = new Set<string>()
    for (const t of s.board) {
      if (!t || !locationIds.includes(t.locationId) || used.has(t.locationId) || !['stable', 'danger', 'removed'].includes(t.status) || !positions.some(p => p.row === t.row && p.col === t.col) || coords.has(`${t.row},${t.col}`)) return null
      used.add(t.locationId); coords.add(`${t.row},${t.col}`)
    }
    if (!s.locationStrategies || typeof s.locationStrategies !== 'object' || !strings(s.completed) || new Set(s.completed).size !== s.completed.length || s.completed.some(id => !REGULAR.includes(id))) return null
    for (const goal of REGULAR) {
      const actual = s.locationStrategies[goal], expected = catalog.locations.filter(l => l.strategyId === goal).map(l => l.id)
      if (!strings(actual) || actual.length !== expected.length || expected.some(id => !actual.includes(id)) || expected.length !== 2) return null
    }
    if (!strings(s.pendingEscape) || new Set(s.pendingEscape).size !== s.pendingEscape.length || !strings(s.strategyDeck) || !strings(s.strategyDiscard) || !strings(s.floodDeck) || !strings(s.floodDiscard)) return null
    const roles = new Set<string>()
    for (const p of s.players) {
      if (!p || !catalog.roles.includes(p.id) || roles.has(p.id) || !locationIds.includes(p.tile) || !strings(p.hand) || p.hand.length > 6 || p.hand.some(c => c === 'trieu-bien' || !CARD_IDS.includes(c))) return null
      roles.add(p.id)
    }
    if (s.pendingEscape.some(id => !roles.has(id) || loc(s, player(s, id).tile)?.status !== 'removed')) return null
    if (!['actions', 'draw', 'flood', 'escape', 'won', 'lost'].includes(s.phase) || !int(s.active, 0, s.players.length - 1) || !int(s.turn, 1, 100000) || !int(s.actionsLeft, 0, 3) || !int(s.drawsRemaining, 0, 2) || !int(s.floodRemaining, 0, 5) || !int(s.floodBatch, 0, 5) || !int(s.floodTriubien, 0, 2) || !int(s.tide, 1, 9) || !int(s.synergy, 0, Math.min(4, s.completed.length)) || typeof s.guideUsed !== 'boolean') return null
    if (s.phase !== 'lost' && (s.tide === 9 || loc(s, 'luong-xam')?.status === 'removed')) return null
    if ((s.phase === 'escape') !== !!s.pendingEscape.length && s.phase !== 'lost') return null
    if (s.phase !== 'lost' && s.players.some(p => loc(s, p.tile)?.status === 'removed' && !s.pendingEscape.includes(p.id))) return null
    if (s.phase === 'won' && (s.completed.length !== 4 || s.players.some(p => p.tile !== 'luong-xam'))) return null
    if (s.phase !== 'lost' && REGULAR.some(goal => !s.completed.includes(goal) && s.locationStrategies[goal].every(id => loc(s, id)?.status === 'removed'))) return null
    if (s.phase === 'actions' && (s.drawsRemaining || s.floodRemaining || s.floodBatch || s.floodTriubien)) return null
    if (s.phase === 'draw' && (s.floodRemaining || s.floodBatch || (!s.drawsRemaining && !overflow(s)))) return null
    if (s.phase === 'flood' && (!s.floodRemaining || s.drawsRemaining || s.floodTriubien || s.floodRemaining > s.floodBatch)) return null
    if (s.phase === 'escape' && (s.drawsRemaining || s.floodTriubien || s.floodRemaining > s.floodBatch)) return null
    const allCards = [...s.strategyDeck, ...s.strategyDiscard, ...s.players.flatMap(p => p.hand)]
    for (const id of CARD_IDS) if (allCards.filter(c => c === id).length !== (REGULAR.includes(id) ? 5 : id === 'gia-co' ? 2 : id === 'co-lenh' ? 3 : s.difficulty === 'learn' ? 2 : 3)) return null
    if (allCards.some(c => !CARD_IDS.includes(c))) return null
    const flood = [...s.floodDeck, ...s.floodDiscard], surviving = existing(s)
    if (flood.length !== surviving.length || new Set(flood).size !== flood.length || flood.some(id => !surviving.includes(id))) return null
    if (s.forecast !== null && (typeof s.forecast !== 'string' || s.forecast !== s.floodDeck[0])) return null
    if (!s.lastEvent || typeof s.lastEvent.type !== 'string' || typeof s.lastEvent.text !== 'string' || s.lastEvent.text.length > 1000 || (s.lastEvent.tile !== undefined && !locationIds.includes(s.lastEvent.tile)) || (s.lastEvent.card !== undefined && !CARD_IDS.includes(s.lastEvent.card))) return null
    if (!strings(s.log) || s.log.length > 150 || s.log.some(line => line.length > 1000)) return null
    return clone(s)
  } catch { return null }
}
