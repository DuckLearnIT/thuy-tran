import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import gsap from "gsap"

import { ScrollTrigger } from "gsap/ScrollTrigger"

import { cards } from "../data/cards"

import { locations } from "../data/locations"

import { strategies } from "../data/strategies"

import { boardRows, matchScenes, regularStrategyIds } from "../data/rules"

import useReducedMotion from "../hooks/useReducedMotion"

import "./rules.css"

gsap.registerPlugin(ScrollTrigger)

export const roleName = (id: string) => {
  const card = cards.find((item) => item.id === id)!

  return [card.prefix, card.role].filter(Boolean).join(" ")
}

export const regularCards = regularStrategyIds.map(
  (id) => strategies.find((card) => card.id === id)!,
)

let nextTile = 0

const cells = boardRows.flatMap((length, row) =>
  Array.from({ length }, (_, col) => ({
    tile: locations[nextTile++],

    row,

    col: col + (6 - length) / 2,
  })),
)

const party = ["truyen-lenh-lam", "nha-binh", "tham-quan", "nha-tuong"].map(
  (id) => ({
    card: cards.find((card) => card.id === id)!,

    spawn: locations.findIndex((tile) => tile.characterId === id),
  }),
)

const point = (index: number) => ({
  left: `${((cells[index].col + 0.5) / 6) * 100}%`,

  top: `${((cells[index].row + 0.5) / 6) * 100}%`,
})

const initialDanger = [
  "bach-dang",

  "song-chanh",

  "bai-tiep-luong",

  "go-dat-cao",
]

const dangerous = (id: string, phase: number) => {
  if (id === "song-chanh") return phase < 7

  if (id === "bai-tiep-luong") return phase < 2 || (phase >= 5 && phase < 8)

  return initialDanger.includes(id)
}

// The scroll sequence remains the only match state. Board actions simply seek it.

const scenePrompts = [
  {
    brief: "24 địa danh. Bốn người. Cùng một mục tiêu.",

    action: "Đi tới Bến Tập Kết",

    target: "ben-tap-ket",
  },

  {
    brief: "Đi một ô liền kề · dùng 1 hành động.",

    action: "Củng cố bến",

    target: "bai-tiep-luong",
  },

  {
    brief: "Lật ô Nguy cấp về Ổn định.",

    action: "Cho Nha Binh một lá",

    target: "ben-chuyen-go",
  },

  {
    brief: "Cho bài từ xa. Nha Binh đủ bốn Cọc Ngầm.",

    action: "Rút hai Kế sách",

    target: "",
  },

  {
    brief: "Rút hai lá. Trên tay không quá năm lá.",

    action: "Rút Biến động",

    target: "",
  },

  {
    brief: "Bãi tiếp lương ngập lại, nhưng chưa mất.",

    action: "Đến lượt Nha Binh",

    target: "bai-coc-ngam",
  },

  {
    brief: "Ở lượt kế: đi đến ô phù hợp, bỏ bốn Cọc Ngầm → +1 Hiệp lực.",

    action: "Xem Triều Biến",

    target: "",
  },

  {
    brief: "Ở lượt sau: triều lên. Sông Chanh ngập lần hai và mất.",

    action: "Dùng Hiệp lực",

    target: "bai-tiep-luong",
  },

  {
    brief: "Cứu bến trước khi công bố lá Biến động · không tốn hành động.",

    action: "Cả đội về doanh",

    target: "luong-xam",
  },

  {
    brief: "Sau nhiều lượt: đủ bốn kế sách, cả đội về doanh, dùng Cờ Lệnh.",

    action: "Trải lại",

    target: "",
  },
]

const shotTitles = [
  "Trải trận.",

  "Đi.",

  "Cứu bến.",

  "Trao bài.",

  "Rút hai lá.",

  "Nước lên.",

  "Cọc Ngầm.",

  "Triều Biến.",

  "Hiệp lực.",

  "Cùng thắng.",
]

const shotCaptions = [
  "24 địa danh · 4 người",

  "Một ô · một hành động",

  "Nguy cấp → Ổn định",

  "Chuyển bài từ xa",

  "Trên tay tối đa 5 lá",

  "Ổn định → Nguy cấp",

  "4 lá → 1 Hiệp lực",

  "Ngập lần hai → mất ô",

  "Cứu bến trước khi rút",

  "4 kế sách · về doanh · Cờ Lệnh",
]

export const storyRiver = "#c9e1d5"

// One camera over the existing board; the scroll timeline remains the match state.

const shots = [
  { focus: "", zoom: 1, roll: 0, tilt: 0, bg: storyRiver },

  { focus: "ben-tap-ket", zoom: 1.6, roll: -3, tilt: 8, bg: "#dce3ca" },

  { focus: "bai-tiep-luong", zoom: 1.8, roll: 2, tilt: 0, bg: "#d4e4dd" },

  { focus: "ben-chuyen-go", zoom: 1.25, roll: -4, tilt: 10, bg: "#ede1c9" },

  { focus: "", zoom: 0.94, roll: 3, tilt: 12, bg: "#eee3cd" },

  { focus: "bai-tiep-luong", zoom: 1.85, roll: -2, tilt: 0, bg: "#bdd9e2" },

  { focus: "bai-coc-ngam", zoom: 1.7, roll: 3, tilt: 8, bg: "#e9d9b6" },

  { focus: "song-chanh", zoom: 1.85, roll: -4, tilt: 12, bg: "#e6cbbd" },

  { focus: "bai-tiep-luong", zoom: 1.8, roll: 2, tilt: 0, bg: "#c5ddd3" },

  { focus: "luong-xam", zoom: 1.55, roll: 0, tilt: 5, bg: "#efd9a8" },
]

function MatchBoard({
  phase,

  animated = false,

  onAdvance,

  busy = false,

  settled = true,

  onOverview,
}: {
  phase: number

  animated?: boolean

  onAdvance?: () => void

  busy?: boolean

  settled?: boolean

  onOverview?: () => void
}) {
  const completed = phase === 9 ? 4 : phase >= 6 ? 1 : 0

  const [inspection, setInspection] = useState<{
    kind: "tile" | "person" | "strategy"

    index: number
  } | null>(null)

  const [back, setBack] = useState(false)

  const [hovered, setHovered] = useState<{
    button: HTMLButtonElement

    name: string
  } | null>(null)

  const table = useRef<HTMLDivElement>(null)

  const caption = useRef<HTMLSpanElement>(null)

  // Labels stay in screen space instead of being enlarged as part of the 3D plane.

  useLayoutEffect(() => {
    if (!hovered) return

    let frame = 0

    const position = () => {
      if (hovered.button.disabled) {
        setHovered(null)

        return
      }

      const target = hovered.button.getBoundingClientRect()

      const bounds = table.current!.getBoundingClientRect()

      const label = caption.current!

      const half = label.offsetWidth / 2 + 8

      const x = Math.max(
        half,

        Math.min(innerWidth - half, target.left + target.width / 2),
      )

      label.style.left = `${x - bounds.left}px`

      label.style.top = `${Math.max(110 + label.offsetHeight, target.top - 8) - bounds.top}px`

      frame = requestAnimationFrame(position)
    }

    position()

    return () => cancelAnimationFrame(frame)
  }, [hovered])

  const dialog = useRef<HTMLDialogElement>(null)

  const selected =
    inspection?.kind === "tile" ? locations[inspection.index] : null

  const person =
    inspection?.kind === "person" ? party[inspection.index].card : null

  const strategy =
    inspection?.kind === "strategy" ? strategies[inspection.index] : null

  useEffect(() => {
    if (!inspection) {
      dialog.current?.close()

      return
    }

    dialog.current?.showModal()

    const overflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = "hidden"

    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [inspection])

  const inspect = (kind: "tile" | "person" | "strategy", index: number) => {
    setHovered(null)

    setBack(kind === "tile" && dangerous(locations[index].id, phase))

    setInspection({ kind, index })
  }

  const route =
    phase === 1 ? [21, 20] : phase === 3 ? [20, 9] : phase === 6 ? [9, 8] : null

  const routePoint = (index: number) =>
    `${((cells[index].col + 0.5) * 100) / 6},${((cells[index].row + 0.5) * 100) / 6}`

  return (
    <>
      <div ref={table} className="match-table" data-scene={phase}>
        <div className="match-camera">
          <div
            className="match-board"
            aria-label="Bàn trận minh họa 24 địa danh, sáu hàng 2–4–6–6–4–2"
            onFocusCapture={(event) => {
              if (event.target.matches(":focus-visible")) onOverview?.()
            }}
          >
            <svg
              className="match-river-lines"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <path d="M-10 30 Q25 5 55 30 T115 30 M-10 50 Q25 25 55 50 T115 50 M-10 70 Q25 45 55 70 T115 70" />
            </svg>
            {cells.map(({ tile, row, col }, index) => {
              const removed = tile.id === "song-chanh" && phase >= 7

              const danger = dangerous(tile.id, phase) && !removed

              const actionable =
                onAdvance && scenePrompts[phase].target === tile.id

              return (
                <figure
                  className="match-tile"
                  key={tile.id}
                  data-id={tile.id}
                  data-danger={danger}
                  data-removed={removed}
                  data-focus={matchScenes[phase].focus.includes(tile.id)}
                  data-actionable={!!actionable}
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                >
                  <button
                    type="button"
                    className="match-tile-hit"
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch")
                        setHovered({
                          button: event.currentTarget,

                          name: tile.name,
                        })
                    }}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={(event) => {
                      if (event.currentTarget.matches(":focus-visible"))
                        setHovered({
                          button: event.currentTarget,

                          name: tile.name,
                        })
                    }}
                    onBlur={() => setHovered(null)}
                    disabled={removed}
                    aria-disabled={busy}
                    aria-label={
                      actionable
                        ? `${scenePrompts[phase].action} · ${tile.name}`
                        : `Xem ${tile.name} · ${
                            danger ? "Nguy cấp" : "Ổn định"
                          }`
                    }
                    aria-haspopup={actionable ? undefined : "dialog"}
                    onClick={() =>
                      !busy &&
                      (actionable ? onAdvance!() : inspect("tile", index))
                    }
                  >
                    <div className="match-tile-paper">
                      <img
                        src={tile.image}
                        width={896}
                        height={896}
                        alt={`${tile.name} · ${
                          removed ? "đã mất" : danger ? "Nguy cấp" : "Ổn định"
                        }`}
                        draggable={false}
                      />
                      <img
                        src={tile.back}
                        width={896}
                        height={896}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                      />
                    </div>
                  </button>
                </figure>
              )
            })}
            {route && (
              <svg
                key={phase}
                className="match-route"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <path
                  d={`M${routePoint(route[0])} ${
                    phase === 3 ? "Q50 20" : "L"
                  } ${routePoint(route[1])}`}
                />
              </svg>
            )}
            {animated && (
              <>
                <img
                  className="match-flying-card"
                  src={regularCards[0].image}
                  alt=""
                  aria-hidden="true"
                  style={point(20)}
                />
                {regularCards.slice(1, 3).map((card, i) => (
                  <img
                    key={card.id}
                    className={`match-dealt-card match-dealt-${i}`}
                    src={card.image}
                    alt=""
                    aria-hidden="true"
                  />
                ))}
                {Array.from({ length: 4 }, (_, i) => (
                  <img
                    key={i}
                    className={`match-spent-card match-spent-${i}`}
                    src={regularCards[0].image}
                    alt=""
                    aria-hidden="true"
                  />
                ))}
              </>
            )}
            {party.map(({ card, spawn }, i) => {
              const tileIndex =
                phase === 9
                  ? 4
                  : i === 0 && phase >= 1
                    ? 20
                    : i === 1 && phase >= 6
                      ? 8
                      : spawn

              const position = {
                ...point(animated ? spawn : tileIndex),

                ...(!animated && phase === 9
                  ? {
                      transform: `translate(${i % 2 === 0 ? -115 : 15}%, ${
                        i < 2 ? -115 : 15
                      }%)`,
                    }
                  : {}),
              }

              return (
                <span
                  key={card.id}
                  className={`match-pawn match-pawn-${i}`}
                  style={
                    { ...position, "--pawn-color": card.bg } as CSSProperties
                  }
                  role="img"
                  aria-label={`${roleName(card.id)} · ${
                    phase === 9 && !settled
                      ? "đang về Đại bản doanh"
                      : locations[tileIndex].name
                  }`}
                >
                  <img
                    src={card.image}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                  />
                </span>
              )
            })}
          </div>
        </div>
        {hovered && (
          <span ref={caption} className="match-tile-caption" aria-hidden="true">
            {hovered.name}
          </span>
        )}
      </div>
      <aside className="match-sidebar" aria-label="Bài và nhân vật liên quan">
        <MatchHand
          phase={phase}
          settled={settled}
          busy={busy}
          onInspect={(id) =>
            inspect(
              "strategy",

              strategies.findIndex((card) => card.id === id),
            )
          }
        />
        <div
          className="match-strategies"
          aria-label={`${completed} trên bốn kế sách đã hoàn thành`}
        >
          {regularCards.map((card, i) => (
            <div key={card.id} data-complete={i < completed}>
              <img src={card.image} alt="" aria-hidden="true" />
              <span className="rules-diamond" aria-hidden="true" />
              <span>{card.name}</span>
              <span className="sr-only">
                {i < completed ? " · đã hoàn thành" : " · chưa hoàn thành"}
              </span>
            </div>
          ))}
        </div>
        <div className="match-roster">
          <h3>Đồng đội</h3>
          <div
            className="match-party"
            aria-label="Bốn người trong ván minh họa"
          >
            {party.map(({ card }) => (
              <button
                type="button"
                key={card.id}
                title={roleName(card.id)}
                data-active={
                  (phase >= 1 && phase <= 5 && card.id === "truyen-lenh-lam") ||
                  (phase === 6 && card.id === "nha-binh")
                }
                aria-label={`Xem nhân vật ${roleName(card.id)}`}
                aria-disabled={busy}
                onClick={() =>
                  !busy &&
                  inspect(
                    "person",

                    party.findIndex((p) => p.card.id === card.id),
                  )
                }
                aria-haspopup="dialog"
              >
                <img src={card.image} alt="" />
                <i style={{ background: card.bg }} />
                <span>{roleName(card.id)}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      <dialog
        className="match-inspect"
        ref={dialog}
        aria-labelledby={animated ? "match-inspect-title" : undefined}
        aria-label={!animated ? "Xem thẻ" : undefined}
        onCancel={(event) => {
          event.preventDefault()

          setInspection(null)
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const r = event.currentTarget.getBoundingClientRect()

            if (
              event.clientX < r.left ||
              event.clientX > r.right ||
              event.clientY < r.top ||
              event.clientY > r.bottom
            )
              setInspection(null)
          }
        }}
      >
        <button
          type="button"
          className="match-inspect-close"
          onClick={() => setInspection(null)}
          autoFocus
        >
          Đóng
        </button>
        {selected && (
          <>
            <h3 id={animated ? "match-inspect-title" : undefined}>
              {selected.name}
            </h3>
            <div className="match-inspect-paper" data-back={back}>
              <img
                src={selected.image}
                alt={`${selected.name} · Ổn định`}
                aria-hidden={back}
              />
              <img
                src={selected.back}
                alt={`${selected.name} · Nguy cấp`}
                aria-hidden={!back}
              />
            </div>
            <div className="match-inspect-face">
              <span role="status">{back ? "Nguy cấp" : "Ổn định"}</span>
              <button type="button" onClick={() => setBack(!back)}>
                {back ? "Xem mặt ổn định" : "Lật mặt nguy cấp"}
              </button>
            </div>
          </>
        )}
        {person && (
          <>
            <h3 id={animated ? "match-inspect-title" : undefined}>
              {roleName(person.id)}
            </h3>
            <img
              className="match-inspect-person"
              src={person.image}
              alt={roleName(person.id)}
            />
            <p>{person.text}</p>
          </>
        )}
        {strategy && (
          <>
            <h3 id={animated ? "match-inspect-title" : undefined}>
              {strategy.name}
            </h3>
            <img
              className="match-inspect-person"
              src={strategy.image}
              alt={strategy.name}
            />
            {strategy.lines.map((line, i) => (
              <p key={i}>
                {line.label && <strong>{line.label} · </strong>}
                {line.text}
              </p>
            ))}
          </>
        )}
        <p className="rules-note">Xem thẻ không thay đổi ván minh họa.</p>
      </dialog>
    </>
  )
}

function MatchHand({
  phase,

  settled = true,

  busy = false,

  onInspect,
}: {
  phase: number

  settled?: boolean

  busy?: boolean

  onInspect: (id: string) => void
}) {
  const coc = regularCards[0]

  const trieu = strategies.find((card) => card.id === "trieu-bien")!

  const co = strategies.find((card) => card.id === "co-lenh")!

  const artwork = (card: typeof coc, index = 0) => (
    <button
      type="button"
      className="match-hand-card"
      key={`${card.id}-${index}`}
      style={{ "--card-order": index } as CSSProperties}
      aria-label={`Xem thẻ ${card.name}`}
      aria-haspopup="dialog"
      aria-disabled={busy}
      onClick={() => !busy && onInspect(card.id)}
    >
      <img src={card.image} alt={card.name} />
    </button>
  )

  return (
    <div className="match-hand">
      {phase >= 1 && phase <= 3 && (
        <>
          <p>Nha Binh · {phase === 3 ? "4" : "3"} Cọc Ngầm</p>
          <button
            type="button"
            className="match-hand-fan"
            aria-label="Xem thẻ Cọc Ngầm"
            aria-haspopup="dialog"
            aria-disabled={busy}
            onClick={() => !busy && onInspect(coc.id)}
          >
            {Array.from({ length: phase === 3 ? 4 : 3 }, (_, i) => (
              <img
                key={i}
                src={coc.image}
                alt=""
                style={{ "--card-order": i } as CSSProperties}
              />
            ))}
          </button>
        </>
      )}
      {phase === 4 && (
        <>
          <p>Hai lá Kế sách vừa rút</p>
          <div className="match-hand-pair">
            {regularCards.slice(1, 3).map((card) => artwork(card))}
          </div>
        </>
      )}
      {phase === 5 && (
        <div className="match-draw-label">
          <p>Biến động dòng nước</p>
          <strong>Bãi tiếp lương</strong>
          <span>Ổn định → Nguy cấp</span>
        </div>
      )}
      {phase === 6 && (
        <div className="match-draw-label">
          <p>Cọc Ngầm · đã hoàn thành</p>
          <strong>+1 Hiệp lực</strong>
          <span>Một dấu chung cho cả đội</span>
        </div>
      )}
      {phase === 7 && (
        <div className="match-special">
          {artwork(trieu)}
          <p>
            Thủy triều
            <br />
            <strong>Nấc 1 → Nấc 2</strong>
          </p>
        </div>
      )}
      {phase === 8 && (
        <div className="match-draw-label">
          <p>Hiệp lực · dùng một dấu</p>
          <strong>Nguy cấp → Ổn định</strong>
          <span>Cứu Bãi tiếp lương trước khi rút bài</span>
        </div>
      )}
      {phase === 9 && (
        <div className="match-special">
          {artwork(co)}
          <p>
            Cờ Lệnh
            <br />
            <strong>
              {settled ? "Cả đội cùng thắng" : "Chờ cả đội về doanh"}
            </strong>
          </p>
        </div>
      )}
    </div>
  )
}

export default function MatchStory({
  unlocked,
  landing = false,
}: {
  unlocked: boolean
  landing?: boolean
}) {
  const root = useRef<HTMLElement>(null)

  const reduced = useReducedMotion()

  const [short, setShort] = useState(() => innerHeight <= 620)

  const [phase, setPhase] = useState(0)

  const [settled, setSettled] = useState(false)

  const [busy, setBusy] = useState(false)

  const [overview, setOverview] = useState(false)

  const pending = useRef<number | null>(null)

  const trigger = useRef<ScrollTrigger | null>(null)

  const staticMode = reduced || short

  const clearPending = useCallback(() => {
    pending.current = null

    setBusy(false)
  }, [])

  useEffect(() => {
    const interrupt = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        ![
          "ArrowUp",

          "ArrowDown",

          "PageUp",

          "PageDown",

          "Home",

          "End",

          " ",
        ].includes(event.key)
      )
        return

      clearPending()
    }

    window.addEventListener("wheel", interrupt, { passive: true })

    window.addEventListener("touchstart", interrupt, { passive: true })

    window.addEventListener("keydown", interrupt)

    window.addEventListener("scrollend", clearPending)

    return () => {
      window.removeEventListener("wheel", interrupt)

      window.removeEventListener("touchstart", interrupt)

      window.removeEventListener("keydown", interrupt)

      window.removeEventListener("scrollend", clearPending)
    }
  }, [clearPending])

  useEffect(() => {
    const resize = () => setShort(innerHeight <= 620)

    window.addEventListener("resize", resize)

    return () => window.removeEventListener("resize", resize)
  }, [])

  useLayoutEffect(() => {
    if (!unlocked || staticMode) return

    const model = { progress: 0 }

    let preservedProgress: number | null = null

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        onUpdate: () => {
          const nextPhase = Math.min(9, Math.floor(model.progress))

          setPhase(nextPhase)

          setSettled(model.progress >= nextPhase + 0.78)

          if (
            pending.current !== null &&
            Math.abs(model.progress - (pending.current + 0.96)) < 0.03
          )
            clearPending()
        },

        scrollTrigger: {
          trigger: root.current,

          start: "top top",

          end: "+=650%",

          scrub: 0.35,

          pin: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,

          onRefreshInit: (self) => {
            preservedProgress = self.isActive ? self.progress : null
          },

          onRefresh: (self) => {
            if (preservedProgress !== null)
              self.scroll(
                self.start + preservedProgress * (self.end - self.start),
              )

            preservedProgress = null
          },
        },
      })

      trigger.current = timeline.scrollTrigger!

      timeline.to(model, { progress: 10, duration: 10, ease: "none" }, 0)

      timeline.fromTo(
        ".match-camera",

        {
          width: "72%",

          xPercent: -50,

          yPercent: -50,

          rotation: -9,

          rotationX: 20,
        },

        {
          width: "100%",

          rotation: 0,

          rotationX: 0,

          duration: 0.8,

          ease: "power2.out",
        },

        0,
      )

      shots.slice(1).forEach((shot, i) => {
        const cell = cells.find((c) => c.tile.id === shot.focus)

        const zoom = () =>
          shot.zoom * (innerWidth <= 900 && shot.focus ? 1.18 : 1)

        timeline.to(
          ".match-camera",

          {
            width: () => `${zoom() * 100}%`,

            xPercent: () => (cell ? -((cell.col + 0.5) / 6) * 100 : -50),

            yPercent: () => (cell ? -((cell.row + 0.5) / 6) * 100 : -50),

            rotation: shot.roll,

            rotationX: shot.tilt,

            duration: 0.65,

            ease: "power2.inOut",
          },

          i + 1,
        )

        timeline.to(
          root.current,

          { backgroundColor: shot.bg, duration: 0.65, ease: "none" },

          i + 1,
        )
      })

      timeline.to(
        ".match-camera",

        {
          width: "100%",

          xPercent: -50,

          yPercent: -50,

          rotation: 0,

          rotationX: 0,

          duration: 0.35,

          ease: "power2.inOut",
        },

        9.65,
      )

      timeline.to(
        root.current,

        { backgroundColor: storyRiver, duration: 0.3, ease: "none" },

        9.65,
      )

      gsap.set(".match-tile-paper", {
        rotationY: (i) => (initialDanger.includes(cells[i].tile.id) ? 180 : 0),

        opacity: 1,

        yPercent: 0,

        rotation: 0,
      })

      timeline.to(
        '[data-id="bai-tiep-luong"] .match-tile-paper',

        { rotationY: 0, duration: 0.3 },

        2.35,
      )

      timeline.to(
        '[data-id="bai-tiep-luong"] .match-tile-paper',

        { rotationY: 180, duration: 0.3 },

        5.35,
      )

      timeline.to(
        '[data-id="song-chanh"] .match-tile-paper',

        { yPercent: 90, rotation: 16, opacity: 0, duration: 0.35 },

        7.35,
      )

      timeline.to(
        '[data-id="bai-tiep-luong"] .match-tile-paper',

        { rotationY: 0, duration: 0.3 },

        8.35,
      )

      timeline.from(
        ".match-tile",

        {
          x: (i) =>
            (2.5 - cells[i].col) *
            (root.current!.querySelector(".match-board")!.clientWidth / 6),

          y: (i) =>
            (2.5 - cells[i].row) *
              (root.current!.querySelector(".match-board")!.clientWidth / 6) +
            40,

          rotation: (i) => ((i % 3) - 1) * 8,

          scale: 0.7,

          duration: 0.55,

          stagger: (i) => cells[i].col * 0.04,
        },

        0,
      )

      timeline.from(
        ".match-pawn",

        { autoAlpha: 0, duration: 0.2, stagger: 0.03 },

        0.45,
      )

      timeline.to(
        ".match-pawn-0",

        { ...point(20), duration: 0.55, ease: "power2.inOut" },

        1.05,
      )

      timeline.to(
        ".match-pawn-1",

        { ...point(8), duration: 0.55, ease: "power2.inOut" },

        6.05,
      )

      timeline.fromTo(
        ".match-flying-card",

        { ...point(20), opacity: 0, scale: 0.65, rotation: -15 },

        {
          ...point(9),

          opacity: 1,

          scale: 1.15,

          rotation: 12,

          duration: 0.5,

          ease: "power2.inOut",
        },

        3.05,
      )

      timeline.to(
        ".match-flying-card",

        { opacity: 0, scale: 0.5, duration: 0.15 },

        3.55,
      )
      ;[0, 1].forEach((i) => {
        timeline.fromTo(
          `.match-dealt-${i}`,

          { left: "84%", top: "85%", opacity: 0, rotation: 15, scale: 0.65 },

          {
            left: () => `${(innerWidth <= 900 ? 3 : 109) + i * 7}%`,

            top: () => (innerWidth <= 900 ? "104%" : "20%"),

            opacity: 1,

            rotation: -8,

            scale: 1.25,

            duration: 0.4,

            ease: "power2.inOut",
          },

          4.05 + i * 0.16,
        )

        timeline.to(
          `.match-dealt-${i}`,

          { opacity: 0, scale: 0.7, duration: 0.15 },

          4.5 + i * 0.16,
        )
      })
      ;[0, 1, 2, 3].forEach((i) => {
        timeline.fromTo(
          `.match-spent-${i}`,

          { ...point(8), opacity: 0, scale: 0.7, rotation: i * 8 - 12 },

          {
            left: `${84 + i}%`,

            top: "88%",

            opacity: 1,

            scale: 1,

            rotation: i * 5 - 8,

            duration: 0.25,

            ease: "power2.inOut",
          },

          6.4 + i * 0.07,
        )

        timeline.to(`.match-spent-${i}`, { opacity: 0, duration: 0.12 }, 6.82)
      })

      party.forEach((_, i) =>
        timeline.to(
          `.match-pawn-${i}`,

          {
            ...point(4),

            xPercent: i % 2 === 0 ? -115 : 15,

            yPercent: i < 2 ? -115 : 15,

            duration: 0.6,

            ease: "power2.inOut",
          },

          9.05 + i * 0.04,
        ),
      )
    }, root)

    return () => {
      trigger.current = null

      ctx.revert()
    }
  }, [unlocked, staticMode, clearPending])

  const seek = (index: number) => {
    setOverview(false)

    const scene = Math.max(0, Math.min(9, index))

    if (trigger.current && pending.current === null) {
      pending.current = scene

      setBusy(true)

      window.scrollTo({
        top:
          trigger.current.start +
          ((trigger.current.end - trigger.current.start) * (scene + 0.96)) / 10,

        behavior: "smooth",
      })
    }
  }

  if (staticMode)
    return (
      <section
        id="van-minh-hoa"
        className="match-static"
        aria-labelledby="van-minh-hoa-title"
      >
        <div className="match-static-intro">
          <p className="rules-eyebrow">Ván minh họa / đọc từng cảnh</p>
          <h2 id="van-minh-hoa-title" tabIndex={-1}>
            Theo một ván chơi.
          </h2>
          <p>
            Các lượt được rút gọn để làm rõ luật. Thứ tự địa danh là một bố trí
            minh họa.
          </p>
        </div>
        {matchScenes.map((scene, i) => (
          <article key={scene.title} className="match-static-scene">
            <div>
              <p className="rules-eyebrow">
                {String(i + 1).padStart(2, "0")} / {scene.label}
              </p>
              <h3>{scene.title}</h3>
              <p>{scenePrompts[i].brief}</p>
              <span className="sr-only">
                {scene.text} {scene.note}
              </span>
            </div>
            <MatchBoard phase={i} />
          </article>
        ))}
      </section>
    )

  const scene = matchScenes[phase]

  return (
    <section
      ref={root}
      id="van-minh-hoa"
      className="match-story"
      aria-labelledby="van-minh-hoa-title"
      data-phase={phase}
      data-busy={busy}
      data-won={phase === 9 && settled}
      data-overview={overview}
    >
      <div className="match-topline">
        <span>
          {landing ? (
            <a className="match-skip" href="#nhan-lenh">
              Bỏ qua ván
            </a>
          ) : (
            "Ván minh họa"
          )}
        </span>
        <div className="match-water-status">
          <span>
            Triều <b>{phase >= 7 ? "2" : "1"}</b>
          </span>
          <span>
            Hiệp lực{" "}
            <b>{phase === 9 ? "3" : phase === 6 || phase === 7 ? "1" : "0"}</b>
          </span>
        </div>
      </div>
      <div className="match-layout">
        <div className="match-copy">
          <p className="rules-eyebrow">
            {String(phase + 1).padStart(2, "0")} / 10
          </p>
          <h2 id="van-minh-hoa-title" tabIndex={-1}>
            {phase === 9 && !settled ? "Về doanh." : shotTitles[phase]}
          </h2>
          <p className="match-brief" key={phase}>
            {shotCaptions[phase]}
          </p>
          <span className="sr-only">
            {scene.text} {scene.note}
          </span>
          {phase >= 1 && phase <= 5 && (
            <div
              className="match-action-budget"
              aria-label={`Đã dùng ${Math.min(phase, 3)} trên ba hành động`}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} data-used={phase > i} aria-hidden="true" />
              ))}
              <span className="sr-only">
                {Math.min(phase, 3)} / 3 hành động
              </span>
            </div>
          )}
        </div>
        <MatchBoard
          phase={phase}
          animated
          busy={busy}
          settled={settled}
          onAdvance={phase === 0 ? () => seek(1) : undefined}
          onOverview={() => setOverview(true)}
        />
      </div>
      <div className="match-bottomline">
        <div className="match-controls">
          <button
            type="button"
            onClick={() => seek(phase - 1)}
            disabled={phase === 0}
            aria-disabled={busy}
          >
            Cảnh trước
          </button>
          <span role="status" aria-live="polite">
            {String(phase + 1).padStart(2, "0")} / 10
            <span className="sr-only">
              {" "}
              · {scene.title} {scene.text}
            </span>
          </span>
          <button
            type="button"
            className="match-play"
            onClick={() => seek(phase === 9 ? 0 : phase + 1)}
            aria-disabled={busy}
          >
            {phase === 9 ? "Xem lại" : "Cảnh tiếp"}
            <span className="rules-diamond" aria-hidden="true" />
          </button>
        </div>
        <span className="match-disclaimer">Ván rút gọn</span>
        <button
          type="button"
          className="match-overview"
          aria-pressed={overview}
          onClick={() => setOverview((value) => !value)}
        >
          {overview ? "Theo cảnh" : "Toàn bàn"}
        </button>
        <a href={landing ? "?page=cach-choi#chuan-bi" : "#tra-cuu"}>
          {landing ? "Đọc luật đầy đủ" : "Tra cứu luật"}
        </a>
      </div>
    </section>
  )
}
