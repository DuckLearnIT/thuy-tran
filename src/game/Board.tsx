import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import { cards } from '../data/cards'
import { locations } from '../data/locations'
import useReducedMotion from '../hooks/useReducedMotion'
import type { GameState, LocationStatus } from './engine'
export type WaterCue = { tile: string; status: LocationStatus; applied: boolean; from: { x: number; y: number }; to: { x: number; y: number } }
const role = (id: string) => cards.find(c => c.id === id)!
const place = (id: string) => locations.find(c => c.id === id)!
const roleName = (id: string) => [role(id).prefix, role(id).role].filter(Boolean).join(' ')

function Pawn({ id, x, y, active, size }: { id: string; x: number; y: number; active: boolean; size: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const initial = useRef({ x, y })
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    const tween = gsap.to(ref.current, { left: `${x}%`, top: `${y}%`, duration: reduced ? 0 : .5, ease: 'power2.inOut', overwrite: true })
    return () => { tween.kill() }
  }, [x, y, reduced])
  return <div ref={ref} className="wg-pawn" data-active={active} data-player={id} title={roleName(id)}
    style={{ '--pawn-color': role(id).bg, '--pawn-accent': role(id).accent, '--pawn-size': size, left: `${initial.current.x}%`, top: `${initial.current.y}%` } as CSSProperties}>
    <img src={role(id).image} alt={roleName(id)} draggable={false} />
  </div>
}

export default function Board({ game, targets, selected, onTile, waterCue }: {
  game: GameState; targets: string[]; selected: string[]; onTile: (id: string) => void
  waterCue?: WaterCue | null
}) {
  const camera = useRef<HTMLDivElement>(null)
  const entryMotion = useRef<gsap.core.Tween | null>(null)
  const reduced = useReducedMotion()
  useLayoutEffect(() => {
    if (!camera.current || reduced) return
    const width = camera.current.clientWidth
    const ctx = gsap.context(() => {
      entryMotion.current = gsap.from('.wg-tile', {
        x: (i: number) => width * (2.5 - game.board[i].col) / 6,
        y: (i: number) => width * (2.5 - game.board[i].row) / 6,
        rotation: (i: number) => (i % 3 - 1) * 8, scale: .82,
        duration: .8, stagger: .025, ease: 'power3.out',
      })
    }, camera)
    return () => ctx.revert()
  }, [game.seed])
  useLayoutEffect(() => { if (reduced) entryMotion.current?.progress(1).kill() }, [reduced])
  return <div className="wg-board-viewport" aria-label="Bàn chơi 24 địa danh">
    <div className="wg-camera" ref={camera}>
      <div className="wg-board">
        {game.board.map(tile => <button type="button" key={tile.locationId} className="wg-tile" data-id={tile.locationId}
          data-status={waterCue?.tile === tile.locationId && waterCue.applied ? waterCue.status : tile.status}
          data-hit={waterCue?.tile === tile.locationId} data-target={targets.includes(tile.locationId)} data-selected={selected.includes(tile.locationId)}
          style={{ gridRow: tile.row + 1, gridColumn: tile.col + 1 }} disabled={!targets.includes(tile.locationId)} onClick={() => onTile(tile.locationId)}
          aria-label={`${place(tile.locationId).name} · ${tile.status === 'stable' ? 'Ổn định' : tile.status === 'danger' ? 'Nguy cấp' : 'Đã mất'}${targets.includes(tile.locationId) ? ' · Có thể chọn' : ''}`}
          aria-pressed={selected.includes(tile.locationId)}>
          <span className="wg-paper"><img className="wg-front" src={place(tile.locationId).image} alt="" draggable={false} />
            <img className="wg-back" src={place(tile.locationId).back} alt="" draggable={false} /></span>
          <span className="wg-tile-label">{place(tile.locationId).name}</span>
        </button>)}
      </div>
      {game.players.map(p => {
        const tile = game.board.find(t => t.locationId === p.tile)!
        const together = game.players.filter(other => other.tile === p.tile)
        const i = together.findIndex(other => other.id === p.id)
        const columns = together.length > 4 ? 3 : Math.min(2, together.length)
        const row = Math.floor(i / columns), rows = Math.ceil(together.length / columns)
        const rowCount = Math.min(columns, together.length - row * columns)
        const dx = (i % columns - (rowCount - 1) / 2) * (columns === 3 ? .31 : .35)
        const dy = (row - (rows - 1) / 2) * .35
        const size = together.length > 4 ? .24 : together.length > 1 ? .28 : .33
        return <Pawn key={p.id} id={p.id} size={size} x={(tile.col + .5 + dx) / 6 * 100} y={(tile.row + .5 + dy) / 6 * 100} active={(game.phase === 'escape' ? game.pendingEscape[0] : game.players[game.active].id) === p.id} />
      })}
    </div>
  </div>
}
