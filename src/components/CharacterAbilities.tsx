import { type CSSProperties, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { byId, cards } from "../data/cards"
import { locations } from "../data/locations"
import { strategies } from "../data/strategies"
import useReducedMotion from "../hooks/useReducedMotion"

const place = (cell: number) => ({
  left: `${(((cell % 3) + 0.5) / 3) * 100}%`,
  top: `${((Math.floor(cell / 3) + 0.5) / 3) * 100}%`,
})
const name = (card: typeof cards[number]) =>
  [card.prefix, card.role].filter(Boolean).join(" ")
const sampleTiles = locations.slice(6, 15)
const sampleStrategy = strategies.find((card) => card.id === "coc-ngam")!

export default function CharacterAbilities() {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState("di")
  const [run, setRun] = useState(0)
  const [phase, setPhase] = useState("ready")
  const [beat, setBeat] = useState(0)
  const card = cards[selected]
  const commander = card.id === "nha-tuong"
  const repair = card.id === "nha-binh"
  const diagonal = ["tham-quan", "thuyen-nhe"].includes(card.id)
  const remote = ["truyen-lenh-lam", "huong-dao-luc"].includes(card.id)
  const escape = diagonal && mode === "thoat-hiem"
  const actorCell = commander ? 0 : repair ? 4 : 6
  const mate = byId("nha-binh")
  const danger = repair
    ? [3, 5]
    : diagonal && mode === "cung-co"
      ? [4]
      : escape
        ? [6]
        : []
  const targets = commander ? [8] : repair ? [3, 5] : remote ? [2] : [4]
  const action = commander
    ? "Điều động đồng đội"
    : repair
      ? "Củng cố hai ô"
      : remote
        ? "Chuyển Cọc Ngầm"
        : mode === "di"
          ? "Đi chéo"
          : mode === "cung-co"
            ? "Củng cố chéo"
            : "Thoát hiểm chéo"
  const prompt = commander
    ? "Đồng đội đi tối đa hai ô. Bạn giữ vị trí."
    : repair
      ? "Hai ô kề cùng Nguy cấp. Cứu cả hai."
      : remote
        ? "Cho một lá Kế sách. Không cần cùng ô."
        : mode === "di"
          ? "Sang một ô theo đường chéo."
          : mode === "cung-co"
            ? "Cứu ô chéo. Nhân vật giữ vị trí."
            : "Ô đang đứng bị mất. Thoát sang ô chéo."
  const result = commander
    ? "Đồng đội đã đi hai ô. Nha Tướng đứng yên."
    : repair
      ? "Hai ô trở về Ổn định. Nha Binh đứng yên."
      : remote
        ? `${name(mate)} nhận Cọc Ngầm. Hai quân giữ vị trí.`
        : mode === "di"
          ? "Đã đi một ô chéo."
          : mode === "cung-co"
            ? "Ô chéo trở về Ổn định. Nhân vật đứng yên."
            : "Đã thoát khỏi ô mất. Không tốn hành động."
  const path = commander
    ? "M16.7 83.3 H83.3"
    : repair
      ? "M50 50 H16.7 M50 50 H83.3"
      : remote
        ? "M29 83.3 Q65 75 71 16.7"
        : "M16.7 83.3 L50 50"

  useLayoutEffect(() => {
    setPhase(run ? "playing" : "ready")
    setBeat(0)
    const ctx = gsap.context(() => {
      gsap.set(".ability-actor", place(actorCell))
      if (commander || remote) gsap.set(".ability-mate", place(remote ? 2 : 6))
      if (remote)
        gsap.set(".ability-flight", { left: "29%", top: "83.3%", rotation: -8 })
      gsap.set(".ability-route", { strokeDashoffset: 1 })
      gsap.set(".ability-tile-paper", {
        rotationY: (i) => (danger.includes(i) ? 180 : 0),
        opacity: 1,
        yPercent: 0,
      })
      if (!run) return
      const duration = reduced ? 0 : 0.75
      const timeline = gsap.timeline({ onComplete: () => setPhase("done") })
      timeline.to(
        ".ability-route",
        { strokeDashoffset: 0, duration: reduced ? 0 : 1.5, ease: "none" },
        0,
      )
      if (commander) {
        timeline
          .to(
            ".ability-mate",
            { ...place(7), duration, ease: "power2.inOut" },
            0,
          )
          .call(() => setBeat(1), [], duration)
          .to(
            ".ability-mate",
            { ...place(8), duration, ease: "power2.inOut" },
            duration + (reduced ? 0 : 0.25),
          )
      } else if (repair) {
        timeline
          .to(
            ".ability-tile-3 .ability-tile-paper",
            { rotationY: 0, duration },
            0,
          )
          .call(() => setBeat(1), [], duration)
          .to(
            ".ability-tile-5 .ability-tile-paper",
            { rotationY: 0, duration },
            duration + (reduced ? 0 : 0.2),
          )
      } else if (remote) {
        timeline
          .to(
            ".ability-flight",
            {
              left: "54%",
              top: "61%",
              rotation: 8,
              duration,
              ease: "power2.in",
            },
            0,
          )
          .to(
            ".ability-flight",
            {
              left: "71%",
              top: "16.7%",
              rotation: -4,
              duration,
              ease: "power2.out",
            },
            duration,
          )
      } else if (mode === "cung-co") {
        timeline.to(
          ".ability-tile-4 .ability-tile-paper",
          { rotationY: 0, duration },
          0,
        )
      } else if (escape) {
        timeline
          .to(
            ".ability-tile-6 .ability-tile-paper",
            { opacity: 0, yPercent: 60, duration },
            0,
          )
          .call(() => setBeat(1), [], duration)
          .to(
            ".ability-actor",
            { ...place(4), duration, ease: "power2.inOut" },
            duration,
          )
      } else {
        timeline.to(
          ".ability-actor",
          { ...place(4), duration, ease: "power2.inOut" },
          0,
        )
      }
    }, root)
    return () => ctx.revert()
  }, [selected, mode, run, reduced])

  const play = () => {
    if (phase !== "playing") setRun((value) => value + 1)
  }
  const choose = (index: number) => {
    setSelected(index)
    setRun(0)
    setMode("di")
  }
  const spent = run > 0 && !escape ? 1 : 0
  return (
    <div
      ref={root}
      className="rules-abilities"
      data-role={card.id}
      data-done={phase === "done"}
      data-phase={phase}
      style={{ "--ability-ink": card.bg } as CSSProperties}
    >
      <div
        className="ability-picker"
        role="group"
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
            <span>{name(item)}</span>
          </button>
        ))}
      </div>
      <div className="ability-demonstration">
        <div className="ability-person">
          <img src={card.image} alt={`Thẻ ${name(card)}`} />
          <div>
            <h3>{name(card)}</h3>
            <p className="rules-character-skill">{card.skill}</p>
            <details className="ability-explanation">
              <summary>Luật trên thẻ</summary>
              <p>{card.text}</p>
              {remote && (
                <p>
                  Mỗi lá tốn một hành động. Chỉ cho Kế sách thường mình giữ,
                  không lấy bài hay chuyển bài đặc biệt.
                </p>
              )}
              {commander && (
                <p>
                  Đi theo cạnh ngang/dọc, không qua ô mất và không dùng năng lực
                  của người được di chuyển.
                </p>
              )}
              {diagonal && (
                <p>
                  Di chuyển và củng cố tốn một hành động mỗi lần. Thoát hiểm
                  không tốn hành động; đích đến phải là ô còn tồn tại.
                </p>
              )}
            </details>
          </div>
        </div>
        <div className="ability-scene">
          <div className="ability-scene-heading">
            <p id="ability-prompt">{prompt}</p>
            <span
              className="ability-cost"
              id="ability-cost"
              data-spent={spent}
              data-free={escape}
            >
              <span className="rules-diamond" aria-hidden="true" />
              {escape
                ? "Không tốn hành động"
                : spent
                  ? "Đã dùng 1 hành động"
                  : "1 hành động"}
            </span>
          </div>
          {diagonal && (
            <div
              className="ability-modes"
              role="group"
              aria-label="Chọn tình huống đường chéo"
            >
              {[
                ["di", "Di chuyển"],
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
          <div className="ability-field">
            <div
              className="ability-arena"
              aria-label="Cụm chín địa danh minh họa, không phải bàn chơi thật"
            >
              {sampleTiles.map((tile, i) => {
                const target = targets.includes(i)
                const paper = (
                  <div className="ability-tile-paper">
                    <img src={tile.image} alt="" />
                    <img src={tile.back} alt="" />
                  </div>
                )
                return (
                  <div
                    key={tile.id}
                    className={`ability-tile ability-tile-${i}`}
                    data-target={target}
                    data-lost={escape && i === 6 && beat > 0}
                  >
                    {target ? (
                      <button
                        type="button"
                        onClick={play}
                        disabled={phase === "playing"}
                        aria-label={`${
                          phase === "done" ? "Xem lại" : action
                        } · ${tile.name}`}
                        aria-describedby="ability-prompt ability-cost"
                      >
                        {paper}
                        <span
                          className="ability-target-mark"
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      paper
                    )}
                  </div>
                )
              })}
              <svg
                viewBox="0 0 100 100"
                className="ability-path"
                aria-hidden="true"
              >
                <path d={path} className="ability-guide" />
                <path d={path} className="ability-route" pathLength="1" />
              </svg>
              <span
                className="ability-token ability-actor"
                style={{ ...place(actorCell), background: card.bg }}
                role="img"
                aria-label={name(card)}
              >
                <span className="ability-token-face">
                  <img src={card.image} alt="" />
                </span>
                <span className="ability-token-name">{name(card)}</span>
              </span>
              {(commander || remote) && (
                <span
                  className="ability-token ability-mate"
                  style={{ ...place(remote ? 2 : 6), background: mate.bg }}
                  role="img"
                  aria-label={`Đồng đội · ${name(mate)}`}
                >
                  <span className="ability-token-face">
                    <img src={mate.image} alt="" />
                  </span>
                  <span className="ability-token-name">{name(mate)}</span>
                </span>
              )}
              {remote && (
                <img
                  className="ability-flight"
                  src={sampleStrategy.image}
                  alt="Lá Cọc Ngầm được cho từ nhân vật đang chọn sang Nha Binh"
                />
              )}
            </div>
          </div>
          <div className="ability-controls">
            <button
              type="button"
              className="rules-button ability-play"
              aria-describedby="ability-prompt ability-cost"
              onClick={play}
              disabled={phase === "playing"}
            >
              {phase === "playing"
                ? "Đang minh họa…"
                : phase === "done"
                  ? "Xem lại"
                  : action}
              <span className="rules-diamond" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="rules-text-button ability-reset"
              onClick={() => setRun(0)}
              disabled={run === 0}
            >
              Đặt lại
            </button>
          </div>
          <p className="ability-result" role="status" aria-live="polite">
            {phase === "done"
              ? result
              : phase === "playing"
                ? commander && beat
                  ? "Đã đi một ô. Còn một ô nữa."
                  : repair && beat
                    ? "Một ô đã Ổn định. Cứu ô thứ hai."
                    : escape && beat
                      ? "Ô đã mất. Nhân vật phải thoát ngay."
                      : action
                : "Chạm ô viền màu hoặc bấm nút để xem."}
          </p>
        </div>
      </div>
    </div>
  )
}
