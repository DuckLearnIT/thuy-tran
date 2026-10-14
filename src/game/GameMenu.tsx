import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Difficulty } from './engine'
import './menu.css'

export type GameMenuOptions = {
  difficulty: Difficulty
  playerCount: 4 | 5 | 6
}

export type GameMenuProps = {
  initialDifficulty?: Difficulty
  initialPlayers?: 4 | 5 | 6
  canResume: boolean
  onResume: () => void
  onStart: (options: GameMenuOptions) => void
}

const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: 'learn', label: 'Làm quen' },
  { value: 'standard', label: 'Tiêu chuẩn' },
  { value: 'hard', label: 'Khó' },
  { value: 'legend', label: 'Huyền thoại' },
]

const playerCounts: Array<4 | 5 | 6> = [4, 5, 6]

export default function GameMenu({
  initialDifficulty = 'learn',
  initialPlayers = 4,
  canResume,
  onResume,
  onStart,
}: GameMenuProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
  const [playerCount, setPlayerCount] = useState<4 | 5 | 6>(initialPlayers)
  const menu = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = menu.current
    if (!element) return

    const focusable = () => Array.from(element.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:checked:not([disabled])',
    ))
    element.querySelector<HTMLInputElement>('input[name=player-count]:checked')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (canResume) {
          event.preventDefault()
          onResume()
        }
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    element.addEventListener('keydown', onKeyDown)
    return () => element.removeEventListener('keydown', onKeyDown)
  }, [canResume, onResume])

  const start = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onStart({ difficulty, playerCount })
  }

  return (
    <section ref={menu} className="wg-menu" role="dialog" aria-modal="true" aria-labelledby="wg-menu-title">
      <div className="wg-menu-panel">
        <header className="wg-menu-header">
          <span className="wg-menu-mark" aria-hidden="true" />
          <h1 id="wg-menu-title">THỦY TRẬN</h1>
        </header>

        <form className="wg-menu-form" onSubmit={start}>
          <fieldset className="wg-menu-fieldset">
            <legend>Số người</legend>
            <div className="wg-menu-options wg-menu-options--players" role="group" aria-label="Số người chơi">
              {playerCounts.map((count) => (
                <label className="wg-menu-option" key={count}>
                  <input
                    type="radio"
                    name="player-count"
                    value={count}
                    checked={playerCount === count}
                    onChange={() => setPlayerCount(count)}
                  />
                  <span>{count}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="wg-menu-fieldset">
            <legend>Độ khó</legend>
            <div className="wg-menu-options wg-menu-options--difficulty" role="group" aria-label="Độ khó">
              {difficulties.map(({ value, label }) => (
                <label className="wg-menu-option" key={value}>
                  <input
                    type="radio"
                    name="difficulty"
                    value={value}
                    checked={difficulty === value}
                    onChange={() => setDifficulty(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="wg-menu-note">Vai trò được chia ngẫu nhiên.</p>

          <div className="wg-menu-actions">
            <button className="wg-menu-primary" type="submit">Vào trận</button>
            {canResume && (
              <button className="wg-menu-secondary" type="button" onClick={onResume}>Tiếp tục ván</button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
