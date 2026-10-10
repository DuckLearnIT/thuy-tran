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

import {
  basicActions,
  boardRows,
  fullRulesSource,
  inventory,
  lossConditions,
  matchScenes,
  quickRules,
  regularStrategyIds,
  ruleChapters,
  rulesSource,
  setupSteps,
} from "../data/rules"

import { preloadAssets } from "../preloadAssets"

import useReducedMotion from "../hooks/useReducedMotion"

import Curtain from "./Curtain"

import Cursor from "./Cursor"

import SiteFooter from "./SiteFooter"

import Wave from "./Wave"

import "./rules.css"

gsap.registerPlugin(ScrollTrigger)

const roleName = (id: string) => {
  const card = cards.find((item) => item.id === id)!

  return [card.prefix, card.role].filter(Boolean).join(" ")
}

const regularCards = regularStrategyIds.map(
  (id) => strategies.find((card) => card.id === id)!,
)

const toc = ruleChapters

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

function MatchBoard({
  phase,
  animated = false,
}: {
  phase: number
  animated?: boolean
}) {
  const completed = phase === 9 ? 4 : phase >= 6 ? 1 : 0

  return (
    <div className="match-table">
      <div
        className="match-board"
        aria-label="Bàn trận minh họa 24 địa danh, sáu hàng 2–4–6–6–4–2"
      >
        {cells.map(({ tile, row, col }) => {
          const removed = tile.id === "song-chanh" && phase >= 7

          const danger = dangerous(tile.id, phase) && !removed

          return (
            <figure
              className="match-tile"
              key={tile.id}
              data-id={tile.id}
              data-danger={danger}
              data-removed={removed}
              data-focus={matchScenes[phase].focus.includes(tile.id)}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
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
            </figure>
          )
        })}
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
                  transform: `translate(${i % 2 === 0 ? -95 : -5}%, ${
                    i < 2 ? -95 : -5
                  }%)`,
                }
              : {}),
          }
          return (
            <span
              key={card.id}
              className={`match-pawn match-pawn-${i}`}
              style={{ ...position, "--pawn-color": card.bg } as CSSProperties}
              role="img"
              aria-label={`${roleName(card.id)} · ${locations[tileIndex].name}`}
            />
          )
        })}
      </div>
      <div className="match-party" aria-label="Bốn người trong ván minh họa">
        {party.map(({ card }) => (
          <span key={card.id}>
            <i style={{ background: card.bg }} />
            {roleName(card.id)}
          </span>
        ))}
      </div>
      <div
        className="match-strategies"
        aria-label={`${completed} trên bốn kế sách đã hoàn thành`}
      >
        {regularCards.map((card, i) => (
          <div key={card.id} data-complete={i < completed}>
            <span className="rules-diamond" aria-hidden="true" />
            <span>{card.name}</span>
            <span className="sr-only">
              {i < completed ? " · đã hoàn thành" : " · chưa hoàn thành"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchHand({ phase }: { phase: number }) {
  const coc = regularCards[0]

  const trieu = strategies.find((card) => card.id === "trieu-bien")!

  const co = strategies.find((card) => card.id === "co-lenh")!

  return (
    <div className="match-hand">
      {phase >= 1 && phase <= 3 && (
        <>
          <p>Nha Binh · {phase === 3 ? "4" : "3"} Cọc Ngầm</p>
          <div className="match-hand-fan">
            {Array.from({ length: phase === 3 ? 4 : 3 }, (_, i) => (
              <img
                key={i}
                src={coc.image}
                alt={`Cọc Ngầm ${i + 1}`}
                style={{ "--card-order": i } as CSSProperties}
              />
            ))}
          </div>
        </>
      )}
      {phase === 4 && (
        <>
          <p>Hai lá Kế sách vừa rút</p>
          <div className="match-hand-pair">
            {regularCards.slice(1, 3).map((card) => (
              <img key={card.id} src={card.image} alt={card.name} />
            ))}
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
          <img src={trieu.image} alt="Triều Biến" />
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
          <img src={co.image} alt="Cờ Lệnh được dùng để thắng" />
          <p>
            Cờ Lệnh
            <br />
            <strong>Cả đội cùng thắng</strong>
          </p>
        </div>
      )}
    </div>
  )
}

function MatchStory({ unlocked }: { unlocked: boolean }) {
  const root = useRef<HTMLElement>(null)

  const reduced = useReducedMotion()

  const [short, setShort] = useState(() => innerHeight <= 620)

  const [phase, setPhase] = useState(0)

  const trigger = useRef<ScrollTrigger | null>(null)

  const staticMode = reduced || short

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
        onUpdate: () => setPhase(Math.min(9, Math.floor(model.progress))),

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

      party.forEach((_, i) =>
        timeline.to(
          `.match-pawn-${i}`,
          {
            ...point(4),
            xPercent: i % 2 === 0 ? -95 : -5,
            yPercent: i < 2 ? -95 : -5,
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
  }, [unlocked, staticMode])

  const seek = (index: number) => {
    const scene = Math.max(0, Math.min(9, index))

    if (trigger.current)
      window.scrollTo({
        top:
          trigger.current.start +
          ((trigger.current.end - trigger.current.start) * (scene + 0.8)) / 10,
        behavior: "smooth",
      })
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
              <p>{scene.text}</p>
              <p className="rules-note">{scene.note}</p>
              <MatchHand phase={i} />
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
    >
      <div className="match-topline">
        <span>Ván minh họa / rút gọn</span>
        <span>4 người · Làm quen</span>
      </div>
      <div className="match-layout">
        <div className="match-copy">
          <p className="rules-eyebrow">
            {String(phase + 1).padStart(2, "0")} / {scene.label}
          </p>
          <h2 id="van-minh-hoa-title" tabIndex={-1}>
            {scene.title}
          </h2>
          <p>{scene.text}</p>
          <p className="match-note">{scene.note}</p>
          {phase >= 1 && phase <= 5 && (
            <div
              className="match-action-budget"
              aria-label={`Đã dùng ${Math.min(phase, 3)} trên ba hành động`}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} data-used={phase > i} aria-hidden="true" />
              ))}
              <span>{Math.min(phase, 3)} / 3 hành động</span>
            </div>
          )}
          <MatchHand phase={phase} />
        </div>
        <MatchBoard phase={phase} animated />
      </div>
      <div className="match-bottomline">
        <div className="match-controls">
          <button
            type="button"
            onClick={() => seek(phase - 1)}
            disabled={phase === 0}
          >
            Cảnh trước
          </button>
          <span role="status" aria-live="polite">
            {String(phase + 1).padStart(2, "0")} / 10
            <span className="sr-only"> · {scene.title} {scene.text}</span>
          </span>
          <button
            type="button"
            onClick={() => seek(phase + 1)}
            disabled={phase === 9}
          >
            Cảnh tiếp
          </button>
        </div>
        <span className="match-disclaimer">
          Các lượt được rút gọn · cuộn để tiếp tục
        </span>
        <a href="#tra-cuu">Tra cứu luật</a>
      </div>
    </section>
  )
}

function ChapterHeading({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="rules-chapter-heading">
      <p className="rules-eyebrow">
        Luật trên bàn / {toc.find((item) => item.id === id)?.label}
      </p>
      <h2 id={`${id}-title`} tabIndex={-1}>
        {children}
      </h2>
    </div>
  )
}

export default function Rules() {
  const root = useRef<HTMLElement>(null)

  const progressRef = useRef<HTMLDivElement>(null)

  const menuButton = useRef<HTMLButtonElement>(null)

  const reduced = useReducedMotion()

  const [menu, setMenu] = useState(false)

  const [active, setActive] = useState(toc[0].id)

  const [attempt, setAttempt] = useState(0)

  const [ready, setReady] = useState(false)

  const [failed, setFailed] = useState(false)

  const [progress, setProgress] = useState(0)

  const [unlocked, setUnlocked] = useState(false)

  const [opening, setOpening] = useState(false)

  const onOpen = useCallback(() => setOpening(true), [])

  const onComplete = useCallback(() => setUnlocked(true), [])

  useEffect(() => {
    const title = document.title

    document.title = "Cách chơi — Thủy Trận"

    return () => {
      document.title = title
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    setFailed(false)

    preloadAssets((value) => {
      if (!cancelled) setProgress(value)
    })

      .then(() => {
        if (!cancelled) setReady(true)
      })

      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  useLayoutEffect(() => {
    if (unlocked) return

    const overflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = "hidden"

    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [unlocked])

  useLayoutEffect(() => {
    if (!opening || reduced) return

    const ctx = gsap.context(() => {
      gsap.from(".rules-title-line", {
        y: 32,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      })

      gsap.from(".rules-opening-card", {
        y: 90,
        rotation: -12,
        duration: 1,
        stagger: 0.07,
        ease: "power3.out",
      })
    }, root)

    return () => ctx.revert()
  }, [opening, reduced])

  useEffect(() => {
    if (!unlocked) return

    let frame = 0

    const update = () => {
      frame = 0

      const distance = document.documentElement.scrollHeight - innerHeight

      const value =
        distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 0

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${value})`

        progressRef.current.setAttribute(
          "aria-valuenow",
          String(Math.round(value * 100)),
        )
      }

      const visited = toc.filter(({ id }) => {
        const target = document.getElementById(id)

        const pin = ScrollTrigger.getAll().find(
          (item) => item.pin && item.trigger === target,
        )

        return (
          (pin?.start ??
            (target?.getBoundingClientRect().top ?? Infinity) + scrollY) <=
          scrollY + 140
        )
      })

      setActive(visited.at(-1)?.id ?? toc[0].id)
    }

    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const restoreAnchor = () => {
      const target = document.getElementById(location.hash.slice(1))

      const pin = ScrollTrigger.getAll().find(
        (item) => item.pin && item.trigger === target,
      )

      if (target)
        window.scrollTo({
          top: pin?.start ?? target.getBoundingClientRect().top + scrollY - 120,
          behavior: "instant",
        })

      scroll()
    }

    // Child layout effects have installed the pin before resolving direct hashes.

    ScrollTrigger.refresh()

    restoreAnchor()

    window.addEventListener("scroll", scroll, { passive: true })

    window.addEventListener("resize", scroll)

    window.addEventListener("popstate", restoreAnchor)

    window.addEventListener("hashchange", restoreAnchor)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", scroll)
      window.removeEventListener("resize", scroll)
      window.removeEventListener("popstate", restoreAnchor)
      window.removeEventListener("hashchange", restoreAnchor)
    }
  }, [unlocked])

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

    const target = document.getElementById(id)

    if (!target) return

    event.preventDefault()

    history.pushState(null, "", `#${id}`)

    setMenu(false)

    const pin = ScrollTrigger.getAll().find(
      (item) => item.pin && item.trigger === target,
    )

    window.scrollTo({
      top: pin?.start ?? target.getBoundingClientRect().top + scrollY - 120,
      behavior: reduced ? "instant" : "smooth",
    })

    document.getElementById(`${id}-title`)?.focus({ preventScroll: true })
  }

  return (
    <main ref={root} id="cach-choi" className="rules-page grain" tabIndex={-1}>
      <Curtain
        ready={ready}
        progress={progress}
        failed={failed}
        onRetry={() => setAttempt((value) => value + 1)}
        onOpen={onOpen}
        onComplete={onComplete}
      />
      {failed && !ready && (
        <button
          type="button"
          className="rules-load-fallback"
          onClick={() => setReady(true)}
        >
          Đọc luật không chờ tranh
        </button>
      )}
      <div inert={!unlocked} aria-hidden={!unlocked}>
        <Cursor />
        <div
          ref={progressRef}
          className="page-progress"
          role="progressbar"
          aria-label="Tiến trình đọc luật"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        />
        <header className="rules-header">
          <a className="display rules-brand" href="./#top">
            Thủy Trận
          </a>
          <nav aria-label="Điều hướng trang">
            <a href="./#top">Về dòng sông</a>
            <a href="?page=dat-truoc" className="rules-order-link">
              Đặt trước
              <span className="rules-diamond" aria-hidden="true" />
            </a>
          </nav>
        </header>
        <div className="rules-opening">
          <div>
            <p className="rules-eyebrow">Thủy Trận / Hướng dẫn chơi thử</p>
            <h1>
              <span className="rules-title-line">Cùng hiểu luật.</span>
              <span className="rules-title-line">Cùng ra trận.</span>
            </h1>
            <p>
              Cùng thắng, hoặc cùng thua. Cả đội hoàn thành bốn kế sách, trở
              về Đại bản doanh và dùng Cờ Lệnh.
            </p>
            <div className="rules-meta">
              <span>4–6 người</span>
              <span>Từ 10 tuổi</span>
              <span>30–45 phút</span>
            </div>
            <a
              className="rules-button"
              href="#van-minh-hoa"
              onClick={(event) => navigate(event, "van-minh-hoa")}
            >
              Theo một ván chơi
              <span className="rules-diamond" aria-hidden="true" />
            </a>
            <a
              className="rules-opening-reference rules-text-button"
              href="#tra-cuu"
              onClick={(event) => navigate(event, "tra-cuu")}
            >
              Đã biết chơi? Tra cứu ngay
            </a>
          </div>
          <div
            className="rules-opening-fan"
            aria-label="Bốn kế sách cần hoàn thành"
          >
            <span className="rules-opening-sun" aria-hidden="true" />
            {regularCards.map((card, i) => (
              <img
                key={card.id}
                className="rules-opening-card"
                src={card.image}
                alt={card.name}
                style={{ "--card-order": i } as CSSProperties}
              />
            ))}
            <p>Bốn kế sách. Một mục tiêu chung.</p>
          </div>
        </div>
        <Wave fill="#c9e1d5" className="rules-story-entry" />
        <MatchStory unlocked={unlocked} />
        <Wave fill="#ecdcc0" className="rules-story-wave" />
        <div className="rules-reading-intro">
          <p className="rules-eyebrow">Giữ luật ngay bên bàn</p>
          <h2>Đọc lại, khi cần.</h2>
          <p>
            Không cần xem hết ván minh họa để tra cứu. Chọn phần bạn muốn đọc
            dưới đây.
          </p>
        </div>
        <div className="rules-layout">
          <aside className="rules-toc" data-open={menu}>
            <button
              ref={menuButton}
              type="button"
              aria-expanded={menu}
              aria-controls="rules-contents"
              onClick={() => setMenu((value) => !value)}
            >
              Mục lục<span aria-hidden="true">{menu ? "−" : "+"}</span>
            </button>
            <nav
              id="rules-contents"
              aria-label="Mục lục luật chơi"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setMenu(false)
                  menuButton.current?.focus()
                }
              }}
            >
              <p className="rules-eyebrow">Trên trang này</p>
              {toc.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={active === id ? "location" : undefined}
                  onClick={(event) => navigate(event, id)}
                >
                  <span className="rules-toc-marker" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </nav>
          </aside>
          <div className="rules-content">
            <section id="chuan-bi" aria-labelledby="chuan-bi-title">
              <ChapterHeading id="chuan-bi">
                Trải bàn. Chọn đồng đội.
              </ChapterHeading>
              <div className="rules-inventory">
                {inventory.map(([count, label]) => (
                  <div key={label}>
                    <strong>{count}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="rules-note">
                Cùng bốn dấu kế sách, bốn dấu Hiệp lực, một dấu Dự báo, bảng và
                dấu Thủy triều.
              </p>
              <ol className="rules-setup-steps">
                {setupSteps.map((step, i) => (
                  <li key={i}>
                    <span aria-hidden="true">{i + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section id="mot-luot" aria-labelledby="mot-luot-title">
              <ChapterHeading id="mot-luot">
                Ba nhịp trong một lượt.
              </ChapterHeading>
              <ol className="rules-turn-phases">
                <li>
                  <strong>01</strong>
                  <span>0–3 hành động</span>
                </li>
                <li>
                  <strong>02</strong>
                  <span>Rút 2 lá Kế sách</span>
                </li>
                <li>
                  <strong>03</strong>
                  <span>Rút Biến động theo Thủy triều</span>
                </li>
              </ol>
              <div className="rules-action-list">
                {basicActions.map((action) => (
                  <div key={action.name}>
                    <h3>{action.name}</h3>
                    <p>{action.text}</p>
                  </div>
                ))}
                <p className="rules-note">
                  Mỗi việc tốn một hành động. Chỉ người đang có lượt thực hiện.
                </p>
              </div>
              <div className="rules-specials">
                {["co-lenh", "gia-co", "trieu-bien"].map((id) => {
                  const card = strategies.find((item) => item.id === id)!
                  return (
                    <article key={id}>
                      <img src={card.image} alt={`Thẻ ${card.name}`} />
                      <div>
                        <h3>{card.name}</h3>
                        {id === "co-lenh" ? (
                          <>
                            <p>
                              Dùng bất cứ lúc nào, không tốn hành động. Chuyển
                              một hoặc nhiều nhân vật cùng ô tới cùng một ô khác
                              còn tồn tại.
                            </p>
                            <p>
                              Hoặc dùng để thắng khi đủ bốn kế sách và tất cả ở
                              Đại bản doanh. Không được chuyển bài Cờ Lệnh.
                            </p>
                          </>
                        ) : id === "gia-co" ? (
                          <>
                            <p>
                              Gia cố khẩn cấp trong hướng dẫn. Dùng bất cứ lúc
                              nào, không tốn hành động: cứu một ô Nguy cấp bất
                              kỳ về Ổn định.
                            </p>
                            <p>
                              Không thể cứu sau khi lá Biến động gây mất ô đã
                              được công bố.
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              Con nước đổi trong hướng dẫn. Khi rút, tăng Thủy
                              triều một nấc, hủy Dự báo và đặt chồng bỏ Biến
                              động đã xáo lên đầu chồng rút.
                            </p>
                            <p>
                              Không lên tay, không rút lá bù. Tới ô Thất bại thì
                              thua ngay.
                            </p>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="rules-synergy">
                <div aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span className="rules-diamond" key={i} />
                  ))}
                </div>
                <div>
                  <h3>Hiệp lực · kho chung của cả đội</h3>
                  <p>
                    Mỗi kế sách hoàn thành thêm một dấu, tối đa bốn. Trước khi
                    công bố lá Biến động tiếp theo, bỏ một dấu để cứu một ô Nguy
                    cấp bất kỳ; không tốn hành động.
                  </p>
                </div>
              </div>
            </section>
            <section id="nhan-vat" aria-labelledby="nhan-vat-title">
              <ChapterHeading id="nhan-vat">
                Sáu người. Những ngoại lệ.
              </ChapterHeading>
              <p>
                Mọi người dùng cùng luật cơ bản; năng lực trên thẻ bổ sung các
                ngoại lệ dưới đây.
              </p>
              <div className="rules-characters">
                {cards.map((card) => (
                  <article key={card.id}>
                    <img src={card.image} alt={`Thẻ ${roleName(card.id)}`} />
                    <div>
                      <h3>{roleName(card.id)}</h3>
                      <p className="rules-character-skill">{card.skill}</p>
                      <p>{card.text}</p>
                      {card.id === "nha-tuong" && (
                        <p className="rules-note">
                          Đi theo cạnh ngang/dọc; không dùng năng lực của người
                          được di chuyển.
                        </p>
                      )}
                      {["truyen-lenh-lam", "huong-dao-luc"].includes(
                        card.id,
                      ) && (
                        <p className="rules-note">
                          Mỗi lá cho đi vẫn tốn một hành động; chỉ chuyển bài
                          thuộc bốn kế sách.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section id="ket-thuc" aria-labelledby="ket-thuc-title">
              <ChapterHeading id="ket-thuc">
                Cùng trở về Đại bản doanh.
              </ChapterHeading>
              <div className="rules-endings">
                <div>
                  <h3>Cùng thắng khi đủ cả ba</h3>
                  <ol>
                    <li>Hoàn thành bốn kế sách.</li>
                    <li>Tất cả nhân vật cùng ở Đại bản doanh còn tồn tại.</li>
                    <li>Một người sử dụng một Cờ Lệnh.</li>
                  </ol>
                  <p className="rules-note">
                    Đại bản doanh ở Lương Xâm. Mặt Nguy cấp vẫn hợp lệ.
                  </p>
                </div>
                <div>
                  <h3>Cùng thua ngay nếu</h3>
                  <ul>
                    {lossConditions.map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                  <p className="rules-note">
                    Hai ô của kế sách đã hoàn thành cùng mất không làm đội thua.
                  </p>
                </div>
              </div>
              <p className="rules-callout">
                Bảo vệ Đại bản doanh và ít nhất một ô của mỗi kế sách chưa hoàn
                thành. Giữ một Cờ Lệnh cho lúc về đích.
              </p>
            </section>
            <section id="tra-cuu" aria-labelledby="tra-cuu-title">
              <ChapterHeading id="tra-cuu">
                Cần nhớ gì, mở ngay đây.
              </ChapterHeading>
              <div className="rules-reference">
                {quickRules.map((item) => (
                  <details key={item.title}>
                    <summary>
                      {item.title}
                      <span aria-hidden="true" />
                    </summary>
                    <div>
                      {item.paragraphs.map((text) => (
                        <p key={text}>{text}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
              <p className="rules-note rules-history">
                Trò chơi lấy cảm hứng từ Bạch Đằng năm 938. Sơ đồ và cơ chế là
                quy ước của bản mẫu, không tái hiện vị trí địa lý hay trình tự
                lịch sử.
              </p>
              <div className="rules-source-links">
                <a href={rulesSource} target="_blank" rel="noopener noreferrer">
                  Hướng dẫn ngắn<span className="sr-only"> (mở tab mới)</span>
                </a>
                <a
                  href={fullRulesSource}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hướng dẫn đầy đủ<span className="sr-only"> (mở tab mới)</span>
                </a>
              </div>
            </section>
          </div>
        </div>
        <div className="rules-closing">
          <p className="rules-eyebrow">Hiểu luật rồi, cùng ra quân.</p>
          <a href="?page=dat-truoc" className="rules-button">
            Đặt trước boardgame
            <span className="rules-diamond" aria-hidden="true" />
          </a>
        </div>
        <Wave fill="#231511" className="rules-footer-wave" />
        <SiteFooter />
      </div>
    </main>
  )
}
