import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { cards } from "../data/cards"
import { locations } from "../data/locations"
import { strategies } from "../data/strategies"
import useReducedMotion from "../hooks/useReducedMotion"

const place = (cell: number) => ({
  left: `${(((cell % 3) + 0.5) / 3) * 100}%`,
  top: `${((Math.floor(cell / 3) + 0.5) / 3) * 100}%`,
})
const name = (i: number) =>
  [cards[i].prefix, cards[i].role].filter(Boolean).join(" ")

export default function CharacterAbilities() {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState("di")
  const [run, setRun] = useState(0)
  const [done, setDone] = useState(false)
  const card = cards[selected]
  const diagonal = selected === 2 || selected === 3
  const remote = selected >= 4
  const repair = selected === 1
  const actorCell = selected === 0 ? 0 : repair ? 4 : 6
  const danger = repair
    ? [3, 5]
    : diagonal && mode === "cung-co"
      ? [4]
      : diagonal && mode === "thoat-hiem"
        ? [6]
        : []
  const action =
    selected === 0
      ? "Điều động"
      : repair
        ? "Củng cố hai ô"
        : remote
          ? "Trao bài"
          : mode === "di"
            ? "Đi chéo"
            : mode === "cung-co"
              ? "Củng cố chéo"
              : "Thoát hiểm chéo"
  const result =
    selected === 0
      ? "Đồng đội đi hai ô · 1 hành động"
      : repair
        ? "Hai ô ổn định · 1 hành động"
        : remote
          ? "Kế sách tới đồng đội ở xa"
          : mode === "di"
            ? "Đi một ô theo đường chéo"
            : mode === "cung-co"
              ? "Ô chéo trở về Ổn định"
              : "Rời ô mất theo đường chéo"

  useLayoutEffect(() => {
    setDone(false)
    const ctx = gsap.context(() => {
      gsap.set(".ability-actor", place(actorCell))
      if (selected === 0 || remote)
        gsap.set(".ability-mate", place(remote ? 2 : 6))
      if (remote) gsap.set(".ability-flight", { ...place(6), opacity: 0 })
      gsap.set(".ability-tile-paper", {
        rotationY: (i) => (danger.includes(i) ? 180 : 0),
        opacity: 1,
      })
      if (!run) return
      const timeline = gsap.timeline({ onComplete: () => setDone(true) })
      const duration = reduced ? 0 : 0.55
      if (selected === 0) {
        timeline
          .to(".ability-mate", { ...place(7), duration, ease: "power2.inOut" })
          .to(".ability-mate", { ...place(8), duration, ease: "power2.inOut" })
      } else if (repair) {
        timeline.to(
          ".ability-tile-3 .ability-tile-paper, .ability-tile-5 .ability-tile-paper",
          { rotationY: 0, duration },
        )
      } else if (remote) {
        timeline
          .set(".ability-flight", { opacity: 1 })
          .to(".ability-flight", {
            ...place(2),
            rotation: 12,
            duration: reduced ? 0 : 0.85,
            ease: "power2.inOut",
          })
      } else if (mode === "cung-co") {
        timeline.to(".ability-tile-4 .ability-tile-paper", {
          rotationY: 0,
          duration,
        })
      } else {
        if (mode === "thoat-hiem")
          timeline.to(".ability-tile-6 .ability-tile-paper", {
            opacity: 0,
            yPercent: 45,
            duration,
          })
        timeline.to(".ability-actor", {
          ...place(4),
          duration,
          ease: "power2.inOut",
        })
      }
    }, root)
    return () => ctx.revert()
  }, [selected, mode, run, reduced])

  const choose = (index: number) => {
    setSelected(index)
    setRun(0)
    setMode("di")
  }
  return (
    <div
      ref={root}
      className="rules-abilities"
      data-role={card.id}
      data-done={done}
    >
      <div
        className="ability-picker"
        aria-label="Chọn nhân vật để thử năng lực"
      >
        {cards.map((item, i) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={i === selected}
            onClick={() => choose(i)}
          >
            <img src={item.image} alt="" />
            <span>{name(i)}</span>
          </button>
        ))}
      </div>
      <div className="ability-demonstration">
        <div className="ability-person">
          <img src={card.image} alt={`Thẻ ${name(selected)}`} />
          <div>
            <h3>{name(selected)}</h3>
            <p className="rules-character-skill">{card.skill}</p>
          </div>
        </div>
        <div>
          <div
            className="ability-arena"
            aria-label="Tình huống minh họa năng lực, không phải bàn chơi thật"
          >
            {locations.slice(6, 15).map((tile, i) => (
              <div key={tile.id} className={`ability-tile ability-tile-${i}`}>
                <div className="ability-tile-paper">
                  <img src={tile.image} alt="" />
                  <img src={tile.back} alt="" />
                </div>
              </div>
            ))}
            <svg
              viewBox="0 0 100 100"
              className="ability-path"
              aria-hidden="true"
            >
              <path
                d={
                  selected === 0
                    ? "M16.7 83.3 H83.3"
                    : repair
                      ? "M16.7 50 H83.3"
                      : remote
                        ? "M16.7 83.3 L83.3 16.7"
                        : "M16.7 83.3 L50 50"
                }
              />
            </svg>
            <span
              className="ability-token ability-actor"
              style={{ ...place(actorCell), background: card.bg }}
              role="img"
              aria-label={name(selected)}
            >
              <img src={card.image} alt="" />
            </span>
            {(selected === 0 || remote) && (
              <span
                className="ability-token ability-mate"
                style={place(remote ? 2 : 6)}
                role="img"
                aria-label="Đồng đội"
              >
                <img src={cards[1].image} alt="" />
              </span>
            )}
            {remote && (
              <img
                className="ability-flight"
                src={strategies.find((c) => c.id === "coc-ngam")!.image}
                alt=""
                aria-hidden="true"
              />
            )}
          </div>
          {diagonal && (
            <div
              className="ability-modes"
              aria-label="Chọn tình huống đường chéo"
            >
              {[
                ["di", "Đi"],
                ["cung-co", "Củng cố"],
                ["thoat-hiem", "Thoát hiểm"],
              ].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={mode === id}
                  onClick={() => {
                    setMode(id)
                    setRun(0)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="rules-button ability-play"
            onClick={() => setRun((value) => value + 1)}
          >
            {done ? "Thử lại" : action}
            <span className="rules-diamond" aria-hidden="true" />
          </button>
          <p className="ability-result" role="status" aria-live="polite">
            {done ? result : "Tình huống minh họa"}
          </p>
        </div>
      </div>
      <details className="ability-explanation">
        <summary>Đọc năng lực</summary>
        <p>{card.text}</p>
        {remote && (
          <p className="rules-note">
            Mỗi lá vẫn tốn một hành động; chỉ chuyển bài thuộc bốn kế sách.
          </p>
        )}
        {selected === 0 && (
          <p className="rules-note">
            Đi theo cạnh ngang/dọc; không dùng năng lực của người được di
            chuyển.
          </p>
        )}
      </details>
    </div>
  )
}
