import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { cards } from '../data/cards'
import { locations } from '../data/locations'
import { strategies } from '../data/strategies'
import { basicActions, quickRules, regularStrategyIds } from '../data/rules'
import useReducedMotion from '../hooks/useReducedMotion'
import Curtain from '../components/Curtain'
import { createGame, transition, validateGame, moveTargets, fortifyTargets, canComplete, type GameState, type Action } from './engine'
import './play.css'

const catalog = { locations, roles: cards.map(c => c.id) }
const STORAGE = 'thuy-tran-playable-v1'
const role = (id: string) => cards.find(c => c.id === id)!
const place = (id: string) => locations.find(c => c.id === id)!
const strategy = (id: string) => strategies.find(c => c.id === id)!
const roleName = (id: string) => [role(id).prefix, role(id).role].filter(Boolean).join(' ')
const difficultyNames = { learn: 'Làm quen', standard: 'Tiêu chuẩn', hard: 'Khó', legend: 'Huyền thoại' }
const assets = [...cards.map(c => c.image), ...strategies.map(c => c.image), ...locations.flatMap(c => [c.image, c.back])]
type Tool = 'move' | 'fortify' | 'share' | 'command' | 'scout' | 'reinforce' | 'flag' | 'synergy' | 'inspect'
type Session = { game: GameState | null; history: GameState[] }

function restore(): Session {
  try { return { game: validateGame(JSON.parse(localStorage.getItem(STORAGE) || 'null'), catalog), history: [] } }
  catch { return { game: null, history: [] } }
}

function Pawn({ id, x, y, active }: { id: string; x: number; y: number; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const initial = useRef({ x, y })
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    const tween = gsap.to(ref.current, { left: `${x}%`, top: `${y}%`, duration: reduced ? 0 : .5, ease: 'power2.inOut', overwrite: true })
    return () => { tween.kill() }
  }, [x, y, reduced])
  return <div ref={ref} className="pt-pawn" data-active={active} data-player={id} title={roleName(id)}
    style={{ '--pawn-color': role(id).bg, '--pawn-accent': role(id).accent, left: `${initial.current.x}%`, top: `${initial.current.y}%` } as CSSProperties}>
    <img src={role(id).image} alt={roleName(id)} draggable={false} />
  </div>
}

function Board({ game, targets, selected, onTile, zoom, focus, angled }: {
  game: GameState; targets: string[]; selected: string[]; onTile: (id: string) => void
  zoom: number; focus: { x: number; y: number }; angled: boolean
}) {
  const camera = useRef<HTMLDivElement>(null)
  const entryMotion = useRef<gsap.core.Tween | null>(null)
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    if (!camera.current || reduced) return
    const width = camera.current.clientWidth
    const ctx = gsap.context(() => {
      entryMotion.current = gsap.from('.pt-tile', {
        x: (i: number) => width * (2.5 - game.board[i].col) / 6,
        y: (i: number) => width * (2.5 - game.board[i].row) / 6,
        rotation: (i: number) => (i % 3 - 1) * 8, scale: .82,
        duration: .8, stagger: .025, ease: 'power3.out',
      })
    }, camera)
    return () => ctx.revert()
  }, [game.seed])
  useLayoutEffect(() => { if (reduced) entryMotion.current?.progress(1).kill() }, [reduced])
  useLayoutEffect(() => {
    gsap.set(camera.current, { x: 0, y: 0 })
    const tween = gsap.to(camera.current, { width: `${zoom * 100}%`, xPercent: -focus.x * 100, yPercent: -focus.y * 100,
      rotationX: angled ? 14 : 0, duration: reduced ? 0 : .65, ease: 'power2.inOut', overwrite: true })
    return () => { tween.kill() }
  }, [zoom, focus.x, focus.y, angled, reduced])
  return <div className="pt-board-viewport" aria-label="Bàn chơi 24 địa danh">
    <div className="pt-camera" ref={camera}>
      <div className="pt-board">
        {game.board.map(tile => <button type="button" key={tile.locationId} className="pt-tile" data-id={tile.locationId}
          data-status={tile.status} data-target={targets.includes(tile.locationId)} data-selected={selected.includes(tile.locationId)}
          style={{ gridRow: tile.row + 1, gridColumn: tile.col + 1 }} onClick={() => onTile(tile.locationId)}
          aria-label={`${place(tile.locationId).name} · ${tile.status === 'stable' ? 'Ổn định' : tile.status === 'danger' ? 'Nguy cấp' : 'Đã mất'}${targets.includes(tile.locationId) ? ' · Có thể chọn' : ''}`}
          aria-pressed={selected.includes(tile.locationId)}>
          <span className="pt-paper"><img className="pt-front" src={place(tile.locationId).image} alt="" draggable={false} />
            <img className="pt-back" src={place(tile.locationId).back} alt="" draggable={false} /></span>
          <span className="pt-tile-label">{place(tile.locationId).name}</span>
        </button>)}
      </div>
      {game.players.map(p => {
        const tile = game.board.find(t => t.locationId === p.tile)!
        const together = game.players.filter(other => other.tile === p.tile)
        const i = together.findIndex(other => other.id === p.id)
        const dx = together.length === 1 ? 0 : together.length <= 3 ? (i - (together.length - 1) / 2) * .3 : (i % 3 - 1) * .28
        const dy = together.length > 3 ? (Math.floor(i / 3) - .5) * .32 : 0
        return <Pawn key={p.id} id={p.id} x={(tile.col + .5 + dx) / 6 * 100} y={(tile.row + .5 + dy) / 6 * 100} active={game.players[game.active].id === p.id} />
      })}
    </div>
  </div>
}

function Setup({ onStart, onCancel, hasGame }: { onStart: (g: GameState) => void; onCancel: () => void; hasGame: boolean }) {
  const [count, setCount] = useState<4 | 5 | 6>(4)
  const [difficulty, setDifficulty] = useState<GameState['difficulty']>('learn')
  const [seed, setSeed] = useState('BachDang938')
  const [chosen, setChosen] = useState(cards.slice(0, 4).map(c => c.id))
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  return <section className="pt-setup" aria-labelledby="pt-setup-title">
    <div className="pt-setup-copy"><p className="pt-eyebrow">BẠCH ĐẰNG · 938</p><h1 ref={heading} tabIndex={-1} id="pt-setup-title">BÀN TRẬN<br />CỦA CẢ ĐỘI.</h1>
      <p>Bốn kế sách. Một Cờ Lệnh.<br />Cùng trở về Lương Xâm trước khi dòng nước cuốn mất trận địa.</p>
      <div className="pt-setup-goals">{regularStrategyIds.map(id => <img key={id} src={strategy(id).image} alt={strategy(id).name} />)}</div>
    </div>
    <form className="pt-setup-sheet" onSubmit={e => { e.preventDefault(); onStart(createGame({ playerCount: count, difficulty, seed: seed.trim() || 'BachDang938', characters: chosen }, catalog)) }}>
      <h2>CHỌN ĐỘI RA QUÂN</h2>
      <fieldset><legend>Số nhân vật</legend><div className="pt-segments">{([4, 5, 6] as const).map(n => <button type="button" key={n} aria-pressed={count === n} onClick={() => {
        setCount(n); setChosen(previous => [...previous.slice(0, n), ...cards.map(c => c.id).filter(id => !previous.includes(id)).slice(0, Math.max(0, n - previous.length))])
      }}>{n} người</button>)}</div></fieldset>
      <div className="pt-setup-roles">{cards.map(c => <button type="button" key={c.id} aria-pressed={chosen.includes(c.id)} onClick={() => setChosen(previous => previous.includes(c.id) ? previous.filter(id => id !== c.id) : previous.length < count ? [...previous, c.id] : previous)}>
        <img src={c.image} alt="" /><span>{roleName(c.id)}</span></button>)}</div>
      <label>Độ khó<select value={difficulty} onChange={e => setDifficulty(e.target.value as GameState['difficulty'])}>{Object.entries(difficultyNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
      <label>Mã bàn trận<input value={seed} onChange={e => setSeed(e.target.value)} maxLength={80} autoComplete="off" /><small>Cùng mã và thiết lập sẽ cho cùng bàn trận, bài và thứ tự lượt.</small></label>
      <button className="pt-flag" disabled={chosen.length !== count} type="submit">TRẢI BÀN TRẬN <span aria-hidden="true">◆</span></button>
      {chosen.length !== count && <p role="status">Chọn đủ {count} nhân vật ({chosen.length}/{count}).</p>}
      {hasGame && <button type="button" className="pt-text-button" onClick={onCancel}>Tiếp tục ván đang chơi</button>}
    </form>
  </section>
}

export default function PlayTable() {
  const [session, setSession] = useState<Session>(restore)
  const game = session.game
  const [setup, setSetup] = useState(!game)
  const [tool, setTool] = useState<Tool>('move')
  const [inspected, setInspected] = useState('')
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [selectedTiles, setSelectedTiles] = useState<string[]>([])
  const [commandPlayer, setCommandPlayer] = useState('')
  const [flagGroup, setFlagGroup] = useState<string[]>([])
  const [flagOrigin, setFlagOrigin] = useState('')
  const [inspectTile, setInspectTile] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [clean, setClean] = useState(false)
  const [help, setHelp] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [angled, setAngled] = useState(false)
  const [focus, setFocus] = useState({ x: .5, y: .5 })
  const [loading, setLoading] = useState({ progress: 0, ready: false, failed: false })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const helpDialog = useRef<HTMLDialogElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const opened = useCallback(() => {}, [])
  const completeLoading = useCallback(() => setUnlocked(true), [])

  useEffect(() => {
    document.title = 'Thủy Trận — Bàn chơi'
    let live = true, done = 0
    const report = () => { const progress = Math.min(1, ++done / (assets.length + 1)); if (live) setLoading(s => ({ ...s, progress })) }
    setLoading({ progress: 0, ready: false, failed: false })
    Promise.allSettled([...assets.map(src => new Promise<void>((resolve, reject) => {
      const img = new Image(), timeout = setTimeout(() => finish(false), 12000)
      let finished = false
      const finish = (ok: boolean) => { if (finished) return; finished = true; clearTimeout(timeout); report(); ok ? resolve() : reject(Error(src)) }
      img.onload = () => { img.decode().then(() => finish(true), () => finish(false)) }; img.onerror = () => finish(false); img.src = src
    })), document.fonts.ready.then(report)]).then(results => {
      if (live) setLoading({ ready: results.every(r => r.status === 'fulfilled'), progress: 1, failed: results.some(r => r.status === 'rejected') })
    })
    return () => { live = false }
  }, [loadAttempt])
  useEffect(() => { if (game) { try { localStorage.setItem(STORAGE, JSON.stringify(game)) } catch { /* Current game still works in memory. */ } } }, [game])
  useEffect(() => {
    if (!game) return
    setInspected(game.players[game.active].id); setTool('move'); setSelectedCard(null); setSelectedTiles([])
    setCommandPlayer(game.players.find(p => p.id !== game.players[game.active].id)?.id || '')
  }, [game?.active, game?.turn, setup])
  useEffect(() => { if (help) helpDialog.current?.showModal(); else helpDialog.current?.close() }, [help])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && clean) setClean(false) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [clean])

  const dispatch = (action: Action) => {
    if (!game) return
    try {
      const next = transition(game, action)
      setSession({ game: next, history: [...session.history.slice(-39), game] })
      setError(''); setSelectedCard(null); setSelectedTiles([]); setInspectTile(null); setTool('move')
    } catch (e) { setError(e instanceof Error ? e.message : 'Thao tác chưa hợp lệ.') }
  }
  const actor = game?.players[game.active]
  const owner = game?.players.find(p => p.id === inspected) || actor
  const overLimit = game?.players.find(p => p.hand.length > 5)
  const ended = game?.phase === 'won' || game?.phase === 'lost'
  const canAct = !!game && game.phase === 'actions' && game.actionsLeft > 0 && !overLimit
  const targets = useMemo(() => {
    if (!game || !actor || ended) return []
    if (tool === 'reinforce') return game.board.filter(t => t.status === 'danger').map(t => t.locationId)
    if (tool === 'flag') return flagGroup.length ? game.board.filter(t => t.status !== 'removed' && t.locationId !== flagOrigin).map(t => t.locationId) : []
    if (game.phase === 'escape') return moveTargets(game, game.pendingEscape[0], 'escape')
    if (tool === 'move' && canAct) return moveTargets(game, actor.id)
    if (tool === 'scout' && canAct) return moveTargets(game, actor.id, 'scout')
    if (tool === 'fortify' && canAct) return fortifyTargets(game, actor.id)
    if (tool === 'command' && canAct && commandPlayer) return moveTargets(game, commandPlayer, 'command')
    if (tool === 'synergy') return game.board.filter(t => t.status === 'danger').map(t => t.locationId)
    return []
  }, [game, actor, tool, commandPlayer, flagGroup, flagOrigin, canAct, ended])
  const chooseTool = (next: Tool) => { setTool(next); setSelectedTiles([]); setSelectedCard(null); setError(''); if (next === 'share' && actor) setInspected(actor.id) }
  const tileClick = (id: string) => {
    if (!game || !actor) return
    if (!targets.includes(id)) { setInspectTile(id); return }
    if (tool === 'reinforce' && owner && selectedCard !== null) dispatch({ type: 'reinforce', owner: owner.id, cardIndex: selectedCard, target: id })
    else if (tool === 'flag' && owner && selectedCard !== null) dispatch({ type: 'flag', owner: owner.id, cardIndex: selectedCard, players: flagGroup, target: id })
    else if (game.phase === 'escape') dispatch({ type: 'escape', target: id })
    else if (tool === 'move') dispatch({ type: 'move', target: id })
    else if (tool === 'scout') dispatch({ type: 'scoutMove', target: id })
    else if (tool === 'command') dispatch({ type: 'command', player: commandPlayer, target: id })
    else if (tool === 'synergy') dispatch({ type: 'synergy', target: id })
    else if (tool === 'fortify' && actor.id === 'nha-binh') setSelectedTiles(previous => previous.includes(id) ? previous.filter(t => t !== id) : previous.length < 2 ? [...previous, id] : [previous[1], id])
    else if (tool === 'fortify') dispatch({ type: 'fortify', targets: [id] })
  }
  const selectHand = (i: number) => {
    if (!owner || !game) return
    setError(''); setSelectedCard(i); setSelectedTiles([])
    const id = owner.hand[i]
    if (id === 'gia-co') setTool('reinforce')
    else if (id === 'co-lenh') { setTool('flag'); setFlagOrigin(owner.tile); setFlagGroup(game.players.filter(p => p.tile === owner.tile).map(p => p.id)) }
    else if (owner.id === actor?.id) setTool('share')
    else setTool('inspect')
  }
  const start = (g: GameState) => {
    setSelectedCard(null); setSelectedTiles([]); setTool('move'); setInspected(g.players[g.active].id); setFlagGroup([]); setFlagOrigin('')
    setCommandPlayer(g.players.find(p => p.id !== g.players[g.active].id)?.id || '')
    setSession({ game: g, history: [] }); setSetup(false); setZoom(1); setFocus({ x: .5, y: .5 }); setInspectTile(null); setClean(false); setError('')
    requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: 'instant' }); page.current?.querySelector<HTMLHeadingElement>('.pt-header h1')?.focus({ preventScroll: true }) })
  }
  const undo = () => {
    const previous = session.history[session.history.length - 1]
    if (previous) { setSession({ game: previous, history: session.history.slice(0, -1) }); setTool('move'); setSelectedCard(null); setSelectedTiles([]); setError('') }
  }
  const exportGame = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'thuy-tran-van-choi.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const importGame = async (file?: File) => {
    if (!file) return
    try { if (file.size > 1_000_000) throw Error('File ván chơi phải nhỏ hơn 1 MB.'); const restored = validateGame(JSON.parse(await file.text()), catalog); if (!restored) throw Error('File ván chơi không hợp lệ hoặc khác phiên bản.'); start(restored) }
    catch (e) { setError(e instanceof Error ? e.message : 'Không đọc được file ván chơi.') }
    if (fileInput.current) fileInput.current.value = ''
  }
  const panToActor = () => {
    if (!game || !actor) return
    const t = game.board.find(t => t.locationId === actor.tile)!
    setFocus({ x: (t.col + .5) / 6, y: (t.row + .5) / 6 }); setZoom(1.75)
  }
  const next = () => {
    if (game?.phase === 'actions') dispatch({ type: 'finishActions' })
    else if (game?.phase === 'draw') dispatch({ type: 'drawStrategy' })
    else if (game?.phase === 'flood') dispatch({ type: 'drawFlood' })
  }
  const nextLabel = game?.phase === 'actions' ? 'RÚT KẾ SÁCH' : game?.phase === 'draw' ? (game.drawsRemaining ? `RÚT LÁ ${3 - game.drawsRemaining} / 2` : 'XỬ LÝ TAY BÀI') : game?.phase === 'flood' ? `CÔNG BỐ BIẾN ĐỘNG · ${game.floodRemaining}` : 'CHỌN Ô THOÁT HIỂM'
  const hint = tool === 'flag' ? 'Chọn nhóm cùng ô, rồi chọn một ô đích còn tồn tại.'
    : tool === 'reinforce' ? 'Chọn một ô Nguy cấp để dùng Gia Cố.'
    : game?.phase === 'escape' ? `${roleName(game.pendingEscape[0])}: chọn ô để thoát hiểm.`
    : overLimit ? `${roleName(overLimit.id)} có ${overLimit.hand.length} lá. Bỏ bớt hoặc dùng bài đặc biệt để còn tối đa 5.`
    : tool === 'share' ? 'Chọn một lá Kế sách thường của người có lượt, rồi chọn người nhận.'
    : tool === 'synergy' ? 'Chọn một ô Nguy cấp để dùng 1 Hiệp lực.'
    : tool === 'fortify' && actor?.id === 'nha-binh' ? 'Chọn tối đa hai ô, rồi xác nhận Củng cố.'
    : tool === 'command' ? 'Chọn đồng đội rồi chọn ô đích trong hai bước theo cạnh.'
    : tool === 'scout' ? 'Chọn bất kỳ ô còn tồn tại. Một lần trong lượt.'
    : canAct ? 'Chọn hành động, rồi chạm ô có viền son.' : 'Rút từng lá; cả đội có thể dùng bài đặc biệt trước lá tiếp theo.'
  const eventLocation = inspectTile || (game?.lastEvent.tile && locations.some(l => l.id === game.lastEvent.tile) ? game.lastEvent.tile : null)
  const eventStrategy = game?.lastEvent.card && strategies.some(s => s.id === game.lastEvent.card) ? game.lastEvent.card : null

  return <div ref={page} className="pt-page grain" data-clean={clean} data-ready={unlocked} data-phase={game?.phase}>
    <Curtain ready={loading.ready} progress={loading.progress} failed={loading.failed} onRetry={() => setLoadAttempt(n => n + 1)} onOpen={opened} onComplete={completeLoading} />
    <main inert={!unlocked} className="pt-shell">
      <header className="pt-header"><h1 tabIndex={-1}>THỦY TRẬN</h1><span className="pt-eyebrow">BÀN CHƠI · BẠCH ĐẰNG 938</span>
        <div className="pt-toolbar"><button onClick={() => setHelp(true)}>Luật tại bàn</button><button aria-pressed={clean} onClick={() => setClean(c => !c)}>Quay content</button>
          <button onClick={() => { if (!document.fullscreenElement) page.current?.requestFullscreen().catch(() => setError('Trình duyệt chưa cho phép toàn màn hình.')); else document.exitFullscreen() }}>Toàn màn hình</button>
          <button onClick={() => setSetup(true)}>Ván mới</button><button onClick={() => fileInput.current?.click()}>Mở ván</button></div></header>
      {setup || !game || !actor || !owner ? <Setup hasGame={!!game} onCancel={() => setSetup(false)} onStart={start} /> : <>
        <div className="pt-status-strip"><p role="status" aria-live="polite">{error || game.lastEvent.text}</p><span>LƯỢT {game.turn} · {difficultyNames[game.difficulty]}</span></div>
        <section className="pt-table-layout">
          <aside className="pt-action-panel" aria-label="Hành động của người có lượt">
            <p className="pt-eyebrow">ĐẾN LƯỢT</p><div className="pt-role-heading"><img src={role(actor.id).image} alt={roleName(actor.id)} /><div><h2>{roleName(actor.id)}</h2><p>{place(actor.tile).name}</p></div></div>
            <div className="pt-action-count" aria-label={`Còn ${game.actionsLeft} trên 3 hành động`}>{[1, 2, 3].map(n => <i key={n} data-used={n > game.actionsLeft}>◆</i>)}<span>{game.actionsLeft} hành động</span></div>
            <div className="pt-actions">
              {([['move', 'Di chuyển'], ['fortify', 'Củng cố'], ['share', 'Trao kế sách']] as const).map(([id, name]) => <button key={id} aria-pressed={tool === id} disabled={!canAct} onClick={() => chooseTool(id)}><span>{name}</span><small>1 hành động</small></button>)}
              <button disabled={!canAct || !!game.forecast} onClick={() => dispatch({ type: 'forecast' })}><span>Dò con nước</span><small>{game.forecast ? 'Đã có Dự báo' : '1 hành động'}</small></button>
              {actor.id === 'nha-tuong' && <button disabled={!canAct} aria-pressed={tool === 'command'} onClick={() => chooseTool('command')}><span>Điều binh</span><small>Đồng đội đi tối đa 2 ô</small></button>}
              {actor.id === 'huong-dao-luc' && <button disabled={!canAct || game.guideUsed} aria-pressed={tool === 'scout'} onClick={() => chooseTool('scout')}><span>Thông Giang Đạt Lộ</span><small>{game.guideUsed ? 'Đã dùng trong lượt' : '1 hành động · đến ô bất kỳ'}</small></button>}
            </div>
            <p className="pt-hint">{hint}</p>
            {tool === 'fortify' && actor.id === 'nha-binh' && <button className="pt-small-flag" disabled={!selectedTiles.length} onClick={() => dispatch({ type: 'fortify', targets: selectedTiles })}>CỦNG CỐ {selectedTiles.length} Ô</button>}
            {tool === 'command' && <label>Điều động<select value={commandPlayer} onChange={e => setCommandPlayer(e.target.value)}>{game.players.filter(p => p.id !== actor.id).map(p => <option value={p.id} key={p.id}>{roleName(p.id)}</option>)}</select></label>}
            {tool === 'share' && selectedCard !== null && owner.id === actor.id && regularStrategyIds.includes(owner.hand[selectedCard]) && <div className="pt-recipients">{game.players.filter(p => p.id !== actor.id).map(p => <button key={p.id} disabled={!canAct || (p.tile !== actor.tile && actor.id !== 'truyen-lenh-lam')} onClick={() => dispatch({ type: 'share', cardIndex: selectedCard, recipient: p.id })}>Cho {roleName(p.id)}{p.tile !== actor.tile && actor.id !== 'truyen-lenh-lam' && <small>Khác ô</small>}</button>)}</div>}
            {tool === 'flag' && <fieldset className="pt-group"><legend>Nhóm dùng Cờ Lệnh</legend><select aria-label="Chọn ô của nhóm" value={flagOrigin} onChange={e => { setFlagOrigin(e.target.value); setFlagGroup(game.players.filter(p => p.tile === e.target.value).map(p => p.id)) }}>{[...new Set(game.players.map(p => p.tile))].map(id => <option value={id} key={id}>{place(id).name}</option>)}</select>
              {game.players.filter(p => p.tile === flagOrigin).map(p => <label key={p.id}><input type="checkbox" checked={flagGroup.includes(p.id)} onChange={() => setFlagGroup(g => g.includes(p.id) ? g.filter(id => id !== p.id) : [...g, p.id])} />{roleName(p.id)}</label>)}
            </fieldset>}
            <details><summary>Năng lực · {role(actor.id).skill}</summary><p>{role(actor.id).text}</p></details>
            <button className="pt-flag pt-next" disabled={ended || game.phase === 'escape' || !!overLimit} onClick={next}>{nextLabel} <span aria-hidden="true">◆</span></button>
          </aside>
          <div className="pt-board-column">
            <div className="pt-board-tools"><button className="pt-text-button" onClick={() => { setFocus({ x: .5, y: .5 }); setZoom(1) }}>Toàn bàn</button><button className="pt-text-button" onClick={panToActor}>Theo quân</button>
              <label aria-label="Phóng bàn"><span>Zoom</span><input aria-label="Độ phóng bàn" type="range" min="1" max="2.2" step=".1" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
              <button aria-pressed={angled} onClick={() => setAngled(v => !v)}>Góc nghiêng</button></div>
            <Board game={game} targets={targets} selected={selectedTiles} onTile={tileClick} zoom={zoom} focus={focus} angled={angled} />
            <div className="pt-team" style={{ gridTemplateColumns: `repeat(${game.players.length <= 4 ? 4 : 3}, minmax(0, 1fr))` }} aria-label="Tay bài các nhân vật">{game.players.map(p => <button key={p.id} data-active={p.id === actor.id} aria-pressed={owner.id === p.id} onClick={() => { setInspected(p.id); setSelectedCard(null); setTool('inspect') }}>
              <img src={role(p.id).image} alt="" /><span>{roleName(p.id)}<small>{p.hand.length} lá{p.id === actor.id ? ' · Có lượt' : ''}</small></span></button>)}</div>
          </div>
          <aside className="pt-river-panel" aria-label="Thủy triều và bộ bài">
            <div className="pt-tide-heading"><h2>CON NƯỚC</h2><strong>{game.tide}<small> / 8</small></strong></div>
            <div className="pt-tide-track" aria-label={`Thủy triều nấc ${game.tide}`}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <span key={n} data-current={n === game.tide} data-passed={n < game.tide}>{n}</span>)}</div>
            <div className="pt-goals">{regularStrategyIds.map(id => <button key={id} data-complete={game.completed.includes(id)} disabled={!canAct || !canComplete(game, id)} onClick={() => dispatch({ type: 'complete', strategy: id })} title={game.completed.includes(id) ? 'Đã hoàn thành' : 'Cần 4 lá cùng loại và đứng ở địa danh tương ứng'}>
              <img src={strategy(id).image} alt="" /><span>{strategy(id).name}<small>{game.completed.includes(id) ? '◆ Đã hoàn thành' : `${actor.hand.filter(c => c === id).length} / 4 lá`}</small></span></button>)}</div>
            <button className="pt-synergy" disabled={ended || !game.synergy || game.phase === 'escape' || !!overLimit} aria-pressed={tool === 'synergy'} onClick={() => chooseTool('synergy')}><span>HIỆP LỰC</span><strong>{game.synergy}</strong><small>Cứu 1 ô trước khi công bố</small></button>
            <div className="pt-decks"><div className="pt-deck" data-kind="strategy"><span>KẾ SÁCH</span><strong>{game.strategyDeck.length}</strong><small>{game.strategyDiscard.length} lá bỏ</small></div>
              <div className="pt-deck" data-kind="flood"><span>BIẾN ĐỘNG</span><strong>{game.floodDeck.length}</strong><small>{game.floodDiscard.length} lá bỏ</small></div></div>
            {game.forecast && <p className="pt-forecast">◆ DỰ BÁO<br /><strong>{place(game.forecast).name}</strong></p>}
            {(eventLocation || eventStrategy) && <figure className="pt-event-card" key={`${eventLocation}-${eventStrategy}-${game.turn}-${game.lastEvent.type}`}>
              <img src={eventLocation ? (game.board.find(t => t.locationId === eventLocation)?.status === 'danger' ? place(eventLocation).back : place(eventLocation).image) : strategy(eventStrategy!).image} alt={eventLocation ? place(eventLocation).name : strategy(eventStrategy!).name} />
              <figcaption>{eventLocation ? place(eventLocation).name : strategy(eventStrategy!).name}{inspectTile && <button onClick={() => setInspectTile(null)} aria-label="Đóng xem địa danh">×</button>}</figcaption>
            </figure>}
          </aside>
        </section>
        <section className="pt-hand-area" aria-label={`Tay bài ${roleName(owner.id)}`}>
          <div className="pt-hand-heading"><p><strong>{roleName(owner.id)}</strong><span>{owner.hand.length} / 5 lá</span></p>
            {overLimit && <button className="pt-small-flag" onClick={() => { setInspected(overLimit.id); setSelectedCard(null) }}>XỬ LÝ TAY BÀI {roleName(overLimit.id)}</button>}
            <div className="pt-hand-tools"><button disabled={!session.history.length} onClick={undo}>Hoàn tác</button><button onClick={exportGame}>Lưu file</button><button onClick={() => fileInput.current?.click()}>Mở file</button></div>
          </div>
          <div className="pt-hand">{owner.hand.map((id, i) => <button key={`${i}-${id}`} data-card={id} aria-pressed={selectedCard === i} onClick={() => selectHand(i)} disabled={ended} title={strategy(id).name}><img src={strategy(id).image} alt={strategy(id).name} /><span>{strategy(id).name}</span></button>)}
            {!owner.hand.length && <p className="pt-empty-hand">Chưa có lá bài trên tay.</p>}</div>
          {selectedCard !== null && <div className="pt-card-choices"><strong>{strategy(owner.hand[selectedCard]).name}</strong>
            <button disabled={ended || owner.hand.length <= 5} onClick={() => dispatch({ type: 'discard', player: owner.id, cardIndex: selectedCard })}>Bỏ lá này</button>
            {owner.hand[selectedCard] === 'co-lenh' && <button disabled={ended || game.completed.length !== 4 || game.players.some(p => p.tile !== 'luong-xam')} className="pt-small-flag" onClick={() => dispatch({ type: 'victory', owner: owner.id, cardIndex: selectedCard })}>PHÁT LỆNH · THẮNG VÁN</button>}
            <button className="pt-text-button" onClick={() => { setSelectedCard(null); setTool('move') }}>Hủy chọn</button></div>}
        </section>
        <details className="pt-log"><summary>Nhật ký ván · {game.seed}</summary><ol>{game.log.slice().reverse().map((line, i) => <li key={i}>{line}</li>)}</ol></details>
        {ended && <section className="pt-ending" role="status"><p className="pt-eyebrow">CẢ ĐỘI {game.phase === 'won' ? 'CÙNG THẮNG' : 'CÙNG THUA'}</p><h2>{game.phase === 'won' ? 'THẾ TRẬN ĐÃ THÀNH.' : 'DÒNG NƯỚC ĐÃ ĐỔI.'}</h2><p>{game.lastEvent.text}</p><div><button className="pt-flag" onClick={() => setSetup(true)}>VÁN MỚI ◆</button><button disabled={!session.history.length} onClick={undo}>Hoàn tác bước cuối</button></div></section>}
      </>}
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={e => importGame(e.target.files?.[0])} />
    </main>
    {clean && <div className="pt-record-controls"><button onClick={() => setClean(false)}>Hiện điều khiển</button><button disabled={!game || ended || !!overLimit || game.phase === 'escape'} onClick={next}>{nextLabel}</button><button disabled={!session.history.length} onClick={undo}>Hoàn tác</button></div>}
    <dialog className="pt-help" ref={helpDialog} onCancel={() => setHelp(false)} onClick={e => { if (e.target === e.currentTarget) setHelp(false) }}>
      <div><header><h2>LUẬT TẠI BÀN</h2><button aria-label="Đóng luật tại bàn" onClick={() => setHelp(false)}>×</button></header>
        <p>0–3 hành động → rút 2 Kế sách → rút Biến động theo Thủy triều.</p>
        {basicActions.map(a => <details key={a.name}><summary>{a.name}</summary><p>{a.text}</p></details>)}
        {quickRules.slice(1).map(rule => <details key={rule.title}><summary>{rule.title}</summary>{rule.paragraphs.map(p => <p key={p}>{p}</p>)}</details>)}
        <details><summary>Sáu năng lực</summary>{cards.map(c => <p key={c.id}><strong>{roleName(c.id)}:</strong> {c.text}</p>)}</details>
        <p className="pt-help-note">Hướng Đạo thoát đến ô còn tồn tại bất kỳ; Thuyền Nhẹ thoát tới ô còn tồn tại gần nhất theo đường thẳng qua ô Nguy cấp hoặc khoảng trống. Nha Binh được củng cố cả ô đang đứng.</p>
      </div>
    </dialog>
  </div>
}
