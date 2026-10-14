import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cards } from '../data/cards'
import { locations } from '../data/locations'
import { strategies } from '../data/strategies'
import useReducedMotion from '../hooks/useReducedMotion'
import Curtain from '../components/Curtain'
import Board, { type WaterCue } from './Board'
import GameMenu, { type GameMenuOptions } from './GameMenu'
import CardFlight, { type CardMotion, type FlightRect } from './CardMotion'
import { createGame, transition, validateGame, moveTargets, fortifyTargets, canComplete, regularStrategyIds, type GameState, type Action } from './engine'
import strategyBack from '../assets/game/back-ke-sach.jpg'
import floodBack from '../assets/game/back-the-nuoc.jpg'
import waterTrack from '../assets/game/water-track.png'
import { floodRate, tideLimit, tideStops } from './tide'
import './play.css'

const STORAGE = 'thuy-tran-webgame-v2'
const catalog = { locations, roles: cards.map(c => c.id) }
const role = (id: string) => cards.find(c => c.id === id)!
const place = (id: string) => locations.find(c => c.id === id)!
const strategy = (id: string) => strategies.find(c => c.id === id)!
const roleName = (id: string) => [role(id).prefix, role(id).role].filter(Boolean).join(' ')
const images = [strategyBack, floodBack, waterTrack, ...cards.map(c => c.image), ...strategies.map(c => c.image), ...locations.flatMap(l => [l.image, l.back, l.spiralImage])]
type Tool = 'move' | 'fortify' | 'share' | 'command' | 'scout' | 'reinforce' | 'flag' | 'synergy' | 'inspect'
type Session = { game: GameState; needsDeal: boolean; started: boolean }
type FlightStep = { motion: CardMotion; after?: () => void; onArrive?: () => void }

function freshGame(options: GameMenuOptions = { playerCount: 4, difficulty: 'learn' }, started = false): Session {
  return { game: createGame({ ...options, seed: crypto.randomUUID() }, catalog), needsDeal: true, started }
}
function loadGame(): Session {
  try { const game = validateGame(JSON.parse(localStorage.getItem(STORAGE) || 'null'), catalog); if (game) return { game, needsDeal: false, started: true } }
  catch { /* A blocked or corrupt save does not prevent play. */ }
  return freshGame()
}

export default function PlayTable() {
  const [session, setSession] = useState<Session>(loadGame)
  const { game, needsDeal } = session
  const [menu, setMenu] = useState(true)
  const resume = useCallback(() => setMenu(false), [])
  const [tool, setTool] = useState<Tool>('move')
  const [inspected, setInspected] = useState(game.players[game.active].id)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [selectedTiles, setSelectedTiles] = useState<string[]>([])
  const [commandPlayer, setCommandPlayer] = useState(game.players.find(p => p.id !== game.players[game.active].id)!.id)
  const [flagGroup, setFlagGroup] = useState<string[]>([])
  const [flagOrigin, setFlagOrigin] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [paused, setPaused] = useState(false)
  const [flight, setFlight] = useState<CardMotion | null>(null)
  const [waterCue, setWaterCue] = useState<WaterCue | null>(null)
  const [busy, setBusy] = useState(false)
  const [dealt, setDealt] = useState<Record<string, number> | null>(() => needsDeal ? Object.fromEntries(game.players.map(p => [p.id, 0])) : null)
  const [loading, setLoading] = useState({ progress: 0, ready: false, failed: false })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const queue = useRef<FlightStep[]>([])
  const busyRef = useRef(false)
  const nextFlightId = useRef(0)
  const reduced = useReducedMotion()
  const opened = useCallback(() => {}, [])
  const unlock = useCallback(() => setUnlocked(true), [])
  const actor = game.players[game.active]
  const owner = game.players.find(p => p.id === inspected) || actor
  const overLimit = game.players.find(p => p.hand.length > 5)
  const ended = game.phase === 'won' || game.phase === 'lost'
  const canAct = !menu && !busy && !needsDeal && !paused && !overLimit && game.phase === 'actions' && game.actionsLeft > 0
  const selected = selectedCard === null ? null : owner.hand[selectedCard]

  useEffect(() => {
    document.title = 'Thủy Trận — Game'
    let live = true, finished = 0
    const report = () => { const progress = ++finished / (images.length + 1); if (live) setLoading(s => ({ ...s, progress })) }
    setLoading({ progress: 0, ready: false, failed: false })
    Promise.allSettled([...images.map(src => new Promise<void>((resolve, reject) => {
      const img = new Image(); let done = false
      const complete = (ok: boolean) => { if (done) return; done = true; clearTimeout(timer); report(); ok ? resolve() : reject(Error(src)) }
      const timer = setTimeout(() => complete(false), 15000)
      img.onload = () => img.decode().then(() => complete(true), () => complete(false)); img.onerror = () => complete(false); img.src = src
    })), document.fonts.ready.then(report)]).then(results => {
      if (live) setLoading({ progress: 1, ready: results.every(r => r.status === 'fulfilled'), failed: results.some(r => r.status === 'rejected') })
    })
    return () => { live = false }
  }, [loadAttempt])
  useEffect(() => { if (session.started) try { localStorage.setItem(STORAGE, JSON.stringify(game)) } catch { /* Continue in memory. */ } }, [game, session.started])
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2600); return () => clearTimeout(timer) }, [notice])
  useEffect(() => { if (!waterCue || busy) return; const timer = setTimeout(() => setWaterCue(null), 1200); return () => clearTimeout(timer) }, [waterCue, busy])
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || menu || busyRef.current || needsDeal || ended) return
      if (paused) setPaused(false)
      else if (selectedCard !== null || selectedTiles.length) { setSelectedCard(null); setSelectedTiles([]); setTool('move') }
      else setPaused(p => !p)
    }
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape)
  }, [selectedCard, selectedTiles.length, needsDeal, ended, paused, menu])
  useEffect(() => {
    if (menu || (!paused && !ended)) return
    const dialog = root.current?.querySelector<HTMLElement>('[role=dialog]')
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>('button')
    if (!buttons?.length) return
    buttons[0].focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    dialog?.addEventListener('keydown', trap)
    return () => {
      dialog?.removeEventListener('keydown', trap)
      root.current?.querySelector<HTMLButtonElement>('.wg-pause')?.focus()
    }
  }, [paused, ended, menu])

  const rect = (selector: string): FlightRect => {
    const r = root.current?.querySelector(selector)?.getBoundingClientRect()
    return r && r.width ? { left: r.left, top: r.top, width: r.width, height: r.height } : { left: innerWidth / 2 - 45, top: innerHeight / 2 - 60, width: 90, height: 120 }
  }
  const handDestination = (id: string, count: number, showHand = false): FlightRect => {
    if (!showHand && id !== owner.id) { const r = rect(`.wg-player[data-player="${id}"]`); return { left: r.left + 6, top: r.top + 6, width: 38, height: 53 } }
    const r = rect('.wg-hand'); const w = Math.min(78, (r.width - 12) / Math.max(3, count + 1))
    return { left: r.left + Math.min(count * w * .8, r.width - w), top: r.top + 8, width: w, height: w * 1.39 }
  }
  const makeFlight = (kind: CardMotion['kind'], front: string, back: string, from: FlightRect, to: FlightRect, delay = 0): CardMotion =>
    ({ id: ++nextFlightId.current, kind, front, back, from, to, delay })
  const run = (steps: FlightStep[]) => {
    if (busyRef.current || !steps.length) return
    busyRef.current = true; queue.current = steps; setBusy(true); setFlight(steps[0].motion)
  }
  const finishFlight = useCallback(() => {
    const step = queue.current.shift(); step?.after?.()
    if (queue.current.length) setFlight(queue.current[0].motion)
    else { setFlight(null); busyRef.current = false; setBusy(false) }
  }, [])

  useEffect(() => {
    if (menu || !session.started || !unlocked || !needsDeal || busyRef.current) return
    if (reduced) { setDealt(null); setSession(s => ({ ...s, needsDeal: false })); return }
    const steps: FlightStep[] = []
    for (let round = 0; round < 2; round++) game.players.forEach(p => {
      const card = p.hand[round]
      steps.push({ motion: makeFlight('deal', strategy(card).image, strategyBack, rect('.wg-deck[data-deck=strategy]'), handDestination(p.id, round), steps.length ? 0 : 1.35),
        after: () => setDealt(previous => ({ ...previous, [p.id]: round + 1 })) })
    })
    steps[steps.length - 1].after = () => { setDealt(null); setSession(s => ({ ...s, needsDeal: false })) }
    run(steps)
  }, [unlocked, needsDeal, game.seed, reduced, menu, session.started])

  const clearChoice = () => { setSelectedCard(null); setSelectedTiles([]); setTool('move'); setError('') }
  const commit = (next: GameState) => {
    setSession({ game: next, needsDeal: false, started: true }); clearChoice(); setNotice(next.lastEvent.text)
    setWaterCue(cue => cue ? { ...cue, applied: false } : null)
    const overflow = next.players.find(p => p.hand.length > 5)
    if (overflow) setInspected(overflow.id)
    else if (next.active !== game.active || next.turn !== game.turn) setInspected(next.players[next.active].id)
    setCommandPlayer(next.players.find(p => p.id !== next.players[next.active].id)!.id)
  }
  const perform = (action: Action) => {
    if (menu || busyRef.current || needsDeal || paused || ended) return
    try {
      const next = transition(game, action)
      setWaterCue(null)
      const steps: FlightStep[] = []
      const ksDeck = rect('.wg-deck[data-deck=strategy]'), ksDiscard = rect('.wg-discard[data-deck=strategy]')
      const waterDeck = rect('.wg-deck[data-deck=flood]'), waterDiscard = rect('.wg-discard[data-deck=flood]')
      const reveal = rect('.wg-reveal-slot')
      if (action.type === 'drawStrategy' && !game.strategyDeck.length) game.strategyDiscard.forEach(id => {
        steps.push({ motion: makeFlight('stack', strategy(id).image, strategyBack, ksDiscard, ksDeck) })
      })
      if ((action.type === 'drawFlood' || action.type === 'forecast') && !game.floodDeck.length) game.floodDiscard.forEach(id => {
        steps.push({ motion: makeFlight('stack', place(id).spiralImage, floodBack, waterDiscard, waterDeck) })
      })
      if (action.type === 'drawStrategy') {
        setInspected(actor.id)
        const id = next.lastEvent.card!
        steps.push({ motion: makeFlight('strategy', strategy(id).image, strategyBack, ksDeck, id === 'trieu-bien' ? reveal : handDestination(actor.id, actor.hand.length, true)) })
        if (id === 'trieu-bien') steps.push({ motion: makeFlight('discard', strategy(id).image, strategyBack, reveal, ksDiscard, .22) })
      } else if (action.type === 'drawFlood') {
        const id = next.lastEvent.tile!
        const tile = rect(`.wg-tile[data-id="${id}"]`)
        const status = next.board.find(t => t.locationId === id)!.status
        const toRight = tile.left + tile.width / 2 >= reveal.left + reveal.width / 2
        const nearEdge = toRight ? tile.left >= reveal.left + reveal.width : tile.left + tile.width <= reveal.left
        // Use the outer edge when the enlarged card covers its target tile.
        const targetX = toRight === nearEdge ? tile.left + 12 : tile.left + tile.width - 12
        const cue: WaterCue = { tile: id, status, applied: false,
          from: { x: toRight ? reveal.left + reveal.width + 7 : reveal.left - 7, y: reveal.top + reveal.height / 2 },
          to: { x: targetX, y: tile.top + 12 } }
        steps.push({ motion: { ...makeFlight('flood', place(id).spiralImage, floodBack, waterDeck, reveal), hold: 1.1 },
          onArrive: () => setWaterCue(cue), after: () => setWaterCue({ ...cue, applied: true }) })
        const removed = next.board.find(t => t.locationId === id)!.status === 'removed'
        steps.push({ motion: makeFlight('discard', place(id).spiralImage, floodBack, reveal, removed ? { ...waterDiscard, top: innerHeight + 30 } : waterDiscard, .15) })
        if (reduced) setWaterCue({ ...cue, applied: true })
      } else if (action.type === 'share') {
        const id = actor.hand[action.cardIndex]
        steps.push({ motion: makeFlight('share', strategy(id).image, strategyBack, rect(`.wg-hand-card[data-index="${action.cardIndex}"]`), handDestination(action.recipient, game.players.find(p => p.id === action.recipient)!.hand.length)) })
      } else if (['discard', 'reinforce', 'flag', 'victory'].includes(action.type)) {
        const a = action as Extract<Action, { cardIndex: number }>
        const person = 'owner' in a ? a.owner : 'player' in a ? a.player : actor.id
        const id = game.players.find(p => p.id === person)!.hand[a.cardIndex]
        steps.push({ motion: makeFlight('discard', strategy(id).image, strategyBack, rect(`.wg-hand-card[data-index="${a.cardIndex}"]`), ksDiscard) })
      } else if (action.type === 'complete') {
        const matches = actor.hand.map((id, i) => ({ id, i })).filter(c => c.id === action.strategy).slice(0, 4)
        matches.forEach(c => steps.push({ motion: makeFlight('discard', strategy(c.id).image, strategyBack, rect(`.wg-hand-card[data-index="${c.i}"]`), ksDiscard) }))
      }
      if (game.phase === 'draw' && next.phase === 'flood' && (game.floodTriubien || next.lastEvent.card === 'trieu-bien')) game.floodDiscard.forEach(id => {
        steps.push({ motion: makeFlight('stack', place(id).spiralImage, floodBack, waterDiscard, waterDeck) })
      })
      if (!steps.length || reduced) commit(next)
      else { steps[steps.length - 1].after = () => commit(next); run(steps) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Thao tác chưa hợp lệ.') }
  }

  const targets = useMemo(() => {
    if (menu || ended || busy || needsDeal || paused) return []
    if (tool === 'reinforce' || tool === 'synergy') return game.board.filter(t => t.status === 'danger').map(t => t.locationId)
    if (tool === 'flag') return flagGroup.length ? game.board.filter(t => t.status !== 'removed' && t.locationId !== flagOrigin).map(t => t.locationId) : []
    if (game.phase === 'escape') return moveTargets(game, game.pendingEscape[0], 'escape')
    if (!canAct) return []
    if (tool === 'fortify') return fortifyTargets(game, actor.id)
    if (tool === 'command') return moveTargets(game, commandPlayer, 'command')
    if (tool === 'scout') return moveTargets(game, actor.id, 'scout')
    return tool === 'move' ? moveTargets(game, actor.id) : []
  }, [game, tool, commandPlayer, flagOrigin, flagGroup, ended, busy, needsDeal, paused, canAct, menu])
  const chooseTool = (next: Tool) => { clearChoice(); setTool(next); if (next === 'share') setInspected(actor.id) }
  const chooseCard = (i: number) => {
    if (busy || needsDeal || ended || paused) return
    setSelectedCard(i); setSelectedTiles([]); setError('')
    const id = owner.hand[i]
    if (id === 'gia-co') setTool('reinforce')
    else if (id === 'co-lenh') { setTool('flag'); setFlagOrigin(owner.tile); setFlagGroup(game.players.filter(p => p.tile === owner.tile).map(p => p.id)) }
    else setTool(canAct && owner.id === actor.id ? 'share' : 'inspect')
  }
  const clickTile = (id: string) => {
    if (!targets.includes(id)) return
    if (tool === 'reinforce' && selectedCard !== null) perform({ type: 'reinforce', owner: owner.id, cardIndex: selectedCard, target: id })
    else if (tool === 'flag' && selectedCard !== null) perform({ type: 'flag', owner: owner.id, cardIndex: selectedCard, players: flagGroup, target: id })
    else if (game.phase === 'escape') perform({ type: 'escape', target: id })
    else if (tool === 'fortify' && actor.id === 'nha-binh') setSelectedTiles(previous => previous.includes(id) ? previous.filter(t => t !== id) : previous.length < 2 ? [...previous, id] : [previous[1], id])
    else if (tool === 'fortify') perform({ type: 'fortify', targets: [id] })
    else if (tool === 'command') perform({ type: 'command', player: commandPlayer, target: id })
    else if (tool === 'scout') perform({ type: 'scoutMove', target: id })
    else if (tool === 'synergy') perform({ type: 'synergy', target: id })
    else perform({ type: 'move', target: id })
  }
  const startGame = (options: GameMenuOptions) => {
    if (busyRef.current) return
    const next = freshGame(options, true); setSession(next); setDealt(Object.fromEntries(next.game.players.map(p => [p.id, 0])))
    setInspected(next.game.players[next.game.active].id); setCommandPlayer(next.game.players.find(p => p.id !== next.game.players[next.game.active].id)!.id)
    clearChoice(); setPaused(false); setMenu(false); setNotice(''); setFlagGroup([]); setWaterCue(null)
  }
  const openMenu = () => { if (!busyRef.current) { setPaused(false); setMenu(true); setWaterCue(null) } }
  const advance = () => {
    if (tool === 'fortify' && selectedTiles.length) perform({ type: 'fortify', targets: selectedTiles })
    else if (game.phase === 'actions') perform({ type: 'finishActions' })
    else if (game.phase === 'draw') perform({ type: 'drawStrategy' })
    else if (game.phase === 'flood') perform({ type: 'drawFlood' })
  }
  const prompt = error || (needsDeal ? 'Đang chia bài…' : busy ? 'Đang bốc bài…' : overLimit ? `${roleName(overLimit.id)}: bỏ bớt hoặc dùng bài để còn 5 lá.`
    : tool === 'flag' ? 'Chọn nhóm cùng ô, rồi chọn ô đến.' : tool === 'reinforce' ? 'Chọn ô Nguy cấp cần cứu.' : game.phase === 'escape' ? `${roleName(game.pendingEscape[0])}: chọn ô thoát hiểm.`
    : tool === 'share' ? (selected ? 'Chọn đồng đội nhận lá bài.' : 'Chọn lá trên tay để trao.') : tool === 'fortify' ? 'Chọn ô Nguy cấp để củng cố.'
    : tool === 'command' ? 'Chọn đồng đội, rồi chọn ô đến.' : tool === 'scout' ? 'Chọn ô còn tồn tại bất kỳ.' : tool === 'synergy' ? 'Chọn ô Nguy cấp để dùng Hiệp lực.'
    : game.phase === 'draw' ? 'Bốc hai lá Kế sách.' : game.phase === 'flood' ? 'Bốc Biến động theo Thủy triều.' : 'Chọn ô viền son để di chuyển.')
  const shownHand = dealt ? owner.hand.slice(0, dealt[owner.id] || 0) : owner.hand
  const canWin = game.completed.length === 4 && game.players.every(p => p.tile === 'luong-xam') && game.board.find(t => t.locationId === 'luong-xam')!.status !== 'removed'
  const isLocked = busy || needsDeal || paused || ended
  const nextLabel = selectedTiles.length ? `Củng cố ${selectedTiles.length} ô` : game.phase === 'actions' ? 'Hết hành động' : game.phase === 'draw' ? `Bốc Kế sách · ${game.drawsRemaining}` : game.phase === 'flood' ? `Bốc Biến động · ${game.floodRemaining}` : 'Chọn ô thoát'

  return <div ref={root} className="wg-game" data-ready={unlocked} data-busy={busy || (!menu && needsDeal)} data-menu={menu} data-phase={game.phase} data-tool={tool}>
    <Curtain ready={loading.ready} progress={loading.progress} failed={loading.failed} onRetry={() => setLoadAttempt(n => n + 1)} onOpen={opened} onComplete={unlock} />
    <main className="wg-surface" inert={!unlocked || menu || paused || ended}>
      {unlocked && session.started && <Board key={game.seed} game={game} targets={targets} selected={selectedTiles} onTile={clickTile} waterCue={waterCue} />}
      <section className="wg-turn" aria-label="Lượt chơi"><span>Lượt {game.turn} · Vòng {Math.floor((game.turn - 1) / game.players.length) + 1}</span><strong>{roleName(actor.id)}</strong>
        <div aria-label={`Còn ${game.actionsLeft} hành động`}>{[1, 2, 3].map(i => <i key={i} data-used={i > game.actionsLeft}>◆</i>)}</div></section>
      <div className="wg-players" aria-label={`${game.players.length} nhân vật trong ván`}>{game.players.map(p => <button type="button" key={p.id} className="wg-player" data-player={p.id} data-active={p.id === actor.id} aria-pressed={owner.id === p.id} disabled={busy || needsDeal} title={`${roleName(p.id)} · ${role(p.id).text}`} onClick={() => { setInspected(p.id); clearChoice() }}>
        <img src={role(p.id).image} alt={roleName(p.id)} /><span>{dealt ? dealt[p.id] || 0 : p.hand.length}</span></button>)}</div>
      <div className="wg-goals" aria-label="Bốn kế sách cần hoàn thành">{regularStrategyIds.map(id => <button type="button" key={id} data-goal={id} data-complete={game.completed.includes(id)} disabled={!canAct || !canComplete(game, id)} onClick={() => perform({ type: 'complete', strategy: id })} title={`${strategy(id).name}: cần 4 lá cùng loại tại ô tương ứng`}>
        <img src={strategy(id).image} alt={strategy(id).name} /><span>{game.completed.includes(id) ? '◆' : `${actor.hand.filter(c => c === id).length}/4`}</span></button>)}</div>
      <section className="wg-water" aria-label="Thủy triều"><strong>{game.tide > tideLimit ? 'Thất bại' : `Triều ${game.tide}`}<small> / {tideLimit}</small></strong><span className="wg-water-rate">{floodRate(game.difficulty, game.tide)} lá / lượt</span>
        <figure className="wg-water-track"><img src={waterTrack} alt="Thang Thủy triều" /><span className="wg-water-marker" role="img" aria-label={`Dấu Thủy triều nấc ${game.tide}`} style={{ top: `${tideStops[Math.min(game.tide, tideLimit + 1) - 1] * 100}%` }}><i />{game.tide}</span></figure>
        {game.forecast && <p className="wg-forecast">Dự báo: {place(game.forecast).name}</p>}</section>
      <button type="button" className="wg-pause" disabled={busy || needsDeal} onClick={() => setPaused(true)} aria-label="Tạm dừng">Ⅱ</button>
      <section className="wg-piles" aria-label="Các bộ bài">{(['strategy', 'flood'] as const).map(kind => {
        const pile = kind === 'strategy' ? game.strategyDeck : game.floodDeck, discarded = kind === 'strategy' ? game.strategyDiscard : game.floodDiscard
        const last = discarded[discarded.length - 1]
        const front = last && (kind === 'strategy' ? strategy(last).image : place(last).spiralImage)
        return <div className="wg-pile-group" key={kind}><button type="button" className="wg-deck" data-deck={kind} disabled={isLocked || !!overLimit || game.phase !== (kind === 'strategy' ? 'draw' : 'flood')} onClick={() => perform({ type: kind === 'strategy' ? 'drawStrategy' : 'drawFlood' })} aria-label={kind === 'strategy' ? 'Bốc Kế sách' : 'Bốc Biến động'}>
          <img src={kind === 'strategy' ? strategyBack : floodBack} alt={kind === 'strategy' ? 'Mặt sau Kế sách' : 'Mặt sau Biến động'} /><span>{pile.length}</span></button>
          <div className="wg-discard" data-deck={kind} aria-label={`Chồng bỏ ${kind === 'strategy' ? 'Kế sách' : 'Biến động'}`}>{front && <img src={front} alt="" />}<span>{discarded.length}</span></div>
          <small>{kind === 'strategy' ? 'Kế sách' : 'Biến động'}</small></div>
      })}<button type="button" className="wg-synergy" disabled={!game.synergy || isLocked || !!overLimit || game.phase === 'escape'} onClick={() => chooseTool('synergy')} title="Cứu một ô Nguy cấp trước khi bốc Biến động">Hiệp lực <strong>{game.synergy}</strong></button></section>
      <div className="wg-reveal-slot" aria-hidden="true" />
      <section className="wg-controls" aria-label="Thao tác lượt chơi"><p className="wg-prompt" role={error ? 'alert' : 'status'}>{prompt}</p>
        {canAct && selectedCard === null && <div className="wg-actions">{([['move', 'Di chuyển'], ['fortify', 'Củng cố'], ['share', 'Trao bài']] as const).map(([id, label]) => <button type="button" key={id} className="wg-action-button" data-action={id} aria-pressed={tool === id} onClick={() => chooseTool(id)}>{label}</button>)}
          <button type="button" className="wg-action-button" data-action="forecast" disabled={!!game.forecast} onClick={() => perform({ type: 'forecast' })}>Dò nước</button>
          {actor.id === 'nha-tuong' && <button type="button" className="wg-action-button" data-action="command" aria-pressed={tool === 'command'} onClick={() => chooseTool('command')}>Điều quân</button>}
          {actor.id === 'huong-dao-luc' && <button type="button" className="wg-action-button" data-action="scout" disabled={game.guideUsed} aria-pressed={tool === 'scout'} onClick={() => chooseTool('scout')}>Đi bất kỳ</button>}
        </div>}
        {tool === 'command' && <div className="wg-choice-panel">{game.players.filter(p => p.id !== actor.id).map(p => <button type="button" key={p.id} disabled={isLocked} aria-pressed={commandPlayer === p.id} onClick={() => setCommandPlayer(p.id)} title={roleName(p.id)}><img src={role(p.id).image} alt={roleName(p.id)} /></button>)}</div>}
        {tool === 'share' && selectedCard !== null && canAct && <div className="wg-choice-panel wg-recipients">{game.players.filter(p => p.id !== actor.id).map(p => <button type="button" key={p.id} data-recipient={p.id} disabled={actor.id !== 'truyen-lenh-lam' && actor.tile !== p.tile} onClick={() => perform({ type: 'share', cardIndex: selectedCard, recipient: p.id })} title={actor.id !== 'truyen-lenh-lam' && actor.tile !== p.tile ? `${roleName(p.id)} · Khác ô` : roleName(p.id)}><img src={role(p.id).image} alt={roleName(p.id)} /></button>)}</div>}
        {tool === 'flag' && selectedCard !== null && <div className="wg-flag-choices"><div className="wg-choice-panel">{game.players.map(p => <button type="button" key={p.id} disabled={isLocked} aria-pressed={flagOrigin === p.tile} onClick={() => { setFlagOrigin(p.tile); setFlagGroup(game.players.filter(q => q.tile === p.tile).map(q => q.id)) }} title={`Nhóm tại ${place(p.tile).name}`}><img src={role(p.id).image} alt={roleName(p.id)} /></button>)}</div>
          {game.players.filter(p => p.tile === flagOrigin).length > 1 && <div className="wg-group-picks">{game.players.filter(p => p.tile === flagOrigin).map(p => <label key={p.id}><input type="checkbox" disabled={isLocked} checked={flagGroup.includes(p.id)} onChange={() => setFlagGroup(g => g.includes(p.id) ? g.filter(id => id !== p.id) : [...g, p.id])} />{roleName(p.id)}</label>)}</div>}</div>}
        {selectedCard === null && <button type="button" className="wg-next" disabled={isLocked || !!overLimit || game.phase === 'escape'} onClick={advance}>{nextLabel}</button>}
        {selectedCard !== null && <div className="wg-card-actions">{owner.hand.length > 5 && <button type="button" className="wg-discard-card" disabled={busy} onClick={() => perform({ type: 'discard', player: owner.id, cardIndex: selectedCard })}>Bỏ lá này</button>}
          {selected === 'co-lenh' && canWin && <button type="button" className="wg-win" disabled={busy} onClick={() => perform({ type: 'victory', owner: owner.id, cardIndex: selectedCard })}>Phát Cờ Lệnh</button>}
          <button type="button" disabled={busy} onClick={clearChoice}>Hủy chọn</button></div>}
        {!!selectedTiles.length && <button type="button" className="wg-cancel" onClick={clearChoice}>Hủy chọn</button>}
      </section>
      <section className="wg-hand-zone" aria-label={`Tay bài ${roleName(owner.id)}`}><div className="wg-hand-caption"><strong>{roleName(owner.id)}</strong><span>{dealt ? dealt[owner.id] || 0 : owner.hand.length} / 5</span></div>
        <div className="wg-hand">{shownHand.map((id, i) => <button type="button" key={`${owner.id}-${i}-${id}`} className="wg-hand-card" data-card={id} data-index={i} aria-pressed={selectedCard === i} disabled={busy || needsDeal} onClick={() => chooseCard(i)} style={{ '--card-order': i, '--hand-count': Math.max(3, shownHand.length), '--card-angle': (i - (shownHand.length - 1) / 2) * 3 } as CSSProperties}>
          <img src={strategy(id).image} alt={strategy(id).name} draggable={false} /></button>)}</div>
      </section>
      {selected && <figure className="wg-card-readout"><img src={strategy(selected).image} alt={strategy(selected).name} /><figcaption>{strategy(selected).name}</figcaption></figure>}
      {notice && !ended && <p className="wg-notice" role="status">{notice}</p>}
    </main>
    {waterCue && <div className="wg-water-cue" role="status" aria-live="polite"><svg aria-hidden="true" width="100%" height="100%"><path d={`M ${waterCue.from.x} ${waterCue.from.y} Q ${waterCue.to.x} ${waterCue.from.y} ${waterCue.to.x} ${waterCue.to.y}`} /><circle cx={waterCue.to.x} cy={waterCue.to.y} r="7" /></svg>{reduced && <img className="wg-water-static" src={place(waterCue.tile).spiralImage} alt={`Con nước: ${place(waterCue.tile).name}`} />}<div className="wg-water-caption"><strong>{place(waterCue.tile).name}</strong><span>{waterCue.status === 'danger' ? 'Ổn định → Nguy cấp' : 'Nguy cấp → Mất ô'}</span></div></div>}
    <CardFlight motion={flight} onComplete={finishFlight} onArrive={() => queue.current[0]?.onArrive?.()} />
    {unlocked && menu && <GameMenu initialPlayers={game.players.length as 4 | 5 | 6} initialDifficulty={game.difficulty} canResume={session.started && !ended} onResume={resume} onStart={startGame} />}
    {!menu && paused && !ended && <section className="wg-pause-screen" role="dialog" aria-modal="true" aria-label="Tạm dừng"><h2>TẠM DỪNG</h2><button type="button" autoFocus onClick={() => setPaused(false)}>Tiếp tục</button><button type="button" className="wg-restart" onClick={openMenu}>Chơi ván mới</button></section>}
    {!menu && ended && <section className="wg-result" data-result={game.phase} role="dialog" aria-modal="true" aria-label={game.phase === 'won' ? 'Cả đội thắng' : 'Cả đội thua'}>
      <div className="wg-result-cast">{game.players.map((p, i) => <img key={p.id} src={role(p.id).image} alt={roleName(p.id)} style={{ rotate: `${(i - 1.5) * 7}deg` }} />)}</div>
      <h1>{game.phase === 'won' ? 'ĐẠI THẮNG' : 'THẾ TRẬN ĐÃ MẤT'}</h1><p>{game.lastEvent.text}</p><button type="button" autoFocus className="wg-restart" onClick={openMenu}>Chơi ván mới</button>
    </section>}
  </div>
}
