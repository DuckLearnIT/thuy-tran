import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { locations } from '../data/locations'
import { byId } from '../data/cards'
import { strategies } from '../data/strategies'
import useReducedMotion from '../hooks/useReducedMotion'

const entrance = 0.65
const journey = 4
const duration = entrance + journey + 0.65
const last = locations.length - 1
const clamp = (index: number) => Math.max(0, Math.min(last, index))
const slices = Array.from({ length: 7 }, (_, i) => {
  const angle = ((i + 0.5) / 7 - 0.5) * 0.42
  return {
    left: `${(0.5 + Math.sin(angle) / 0.42) * 100}%`,
    backgroundPosition: `${i / 6 * 100}% 0`,
    transform: `translateX(-50%) translateZ(calc(var(--tile) * ${(1 - Math.cos(angle)) / 0.42})) rotateY(${-angle * 180 / Math.PI}deg)`,
  }
})

export default function Locations() {
  const root = useRef<HTMLElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const detail = useRef<HTMLDialogElement>(null)
  const detailMotion = useRef<gsap.core.Timeline | null>(null)
  const launch = useRef<{ rect: DOMRect; focus: HTMLElement | null } | null>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const render = useRef<(index: number) => void>(() => {})
  const position = useRef(0)
  const drag = useRef<{ id: number; x: number; y: number; index: number; target: number; moved: boolean } | null>(null)
  const pendingFocus = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const [available, setAvailable] = useState(false)
  const [short, setShort] = useState(() => matchMedia('(max-height: 600px), (max-width: 360px)').matches)
  const reduced = useReducedMotion()
  const animated = !reduced && !short
  const current = locations[active]
  const character = current.characterId ? byId(current.characterId) : null
  const strategy = current.strategyId ? strategies.find((item) => item.id === current.strategyId) : null

  useLayoutEffect(() => {
    if (!expanded) return
    const modal = detail.current!
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    modal.showModal()
    const body = modal.querySelector<HTMLElement>('.location-detail-body')!
    body.scrollTop = 0
    const flight = modal.querySelector<HTMLElement>('.location-flight')!
    const artwork = modal.querySelector<HTMLElement>('.location-flip')!
    const actions = modal.querySelector<HTMLElement>('.location-face-actions')!
    const copy = modal.querySelector<HTMLElement>('.location-copy')!
    const close = modal.querySelector<HTMLElement>('.location-close')!
    const layers = [body, flight, artwork, actions, copy, close]
    modal.dataset.phase = 'open'
    if (!reduced && launch.current) {
      body.inert = true
      const origin = launch.current.rect
      const bounds = modal.getBoundingClientRect()
      const target = artwork.getBoundingClientRect()
      const height = target.width * 2078 / 1500
      const top = target.top + (target.height - height) / 2
      const stacked = matchMedia('(max-width: 700px)').matches
      gsap.set(flight, {
        left: target.left - bounds.left, top: top - bounds.top,
        width: target.width, height, autoAlpha: 1,
        x: origin.left + origin.width / 2 - target.left - target.width / 2,
        y: origin.top + origin.height / 2 - top - height / 2,
        scaleX: origin.width / target.width, scaleY: origin.height / height,
        transformOrigin: '50% 50%',
      })
      gsap.set(modal, { '--detail-dim': 0 })
      gsap.set([artwork, actions], { visibility: 'hidden' })
      gsap.set(copy, {
        rotationY: stacked ? 0 : -90, rotationX: stacked ? 90 : 0,
        transformOrigin: stacked ? 'center top' : 'left center', transformPerspective: 1200,
      })
      gsap.set(close, { opacity: 0 })
      modal.dataset.phase = 'opening'
      detailMotion.current = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => { modal.dataset.phase = 'open'; body.inert = false },
        onReverseComplete: () => setExpanded(false),
      })
        .to(modal, { '--detail-dim': 0.66, duration: 0.45 }, 0)
        .to(flight, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.62, ease: 'power3.inOut' }, 0)
        // Both faces belong to one solid card; swap to the live F1 only at the identical final pose.
        .to(flight, { rotationY: 180, duration: 0.72, ease: 'power2.inOut' }, 0.12)
        .to(flight, { height: target.height, top: target.top - bounds.top, duration: 0.26 }, 0.35)
        .to(copy, { rotationY: 0, rotationX: 0, duration: 0.66, ease: 'power2.out' }, 0.42)
        .set([artwork, actions], { visibility: 'visible' }, 0.84)
        .set(flight, { visibility: 'hidden' }, 0.84)
        .to(close, { opacity: 1, duration: 0.18 }, 0.84)
    }
    // Once resized, keep the readable layout instead of reversing stale pixel bounds.
    const resize = () => {
      detailMotion.current?.progress(1).kill()
      detailMotion.current = null
      gsap.set(layers, { clearProps: 'all' })
      gsap.set(modal, { clearProps: '--detail-dim' })
      body.inert = false
      modal.dataset.phase = 'open'
    }
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      detailMotion.current?.kill()
      detailMotion.current = null
      modal.close()
      document.documentElement.style.overflow = previous
      gsap.set(layers, { clearProps: 'all' })
      gsap.set(modal, { clearProps: '--detail-dim' })
      body.inert = false
      delete modal.dataset.phase
      const previousFocus = launch.current?.focus
      requestAnimationFrame(() => {
        if (!modal.open && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
      })
    }
  }, [expanded, reduced])

  useEffect(() => {
    const media = matchMedia('(max-height: 600px), (max-width: 360px)')
    const change = () => setShort(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])

  useLayoutEffect(() => {
    const planes = Array.from(scene.current!.querySelectorAll<HTMLElement>('.spiral-plane'))
    const proxy = { index: position.current }
    let previous = -1
    let interactive = !animated
    setAvailable(interactive)
    const paint = (index: number) => {
      position.current = index
      const selected = Math.round(clamp(index))
      const tile = planes[0].offsetWidth
      const wide = scene.current!.clientWidth >= 640
      const radius = wide
        ? (scene.current!.clientWidth - tile * 0.7) * 0.64
        : Math.min(scene.current!.clientWidth * 0.32, tile * 1.32)
      const reach = wide ? 8.5 : 4.5
      planes.forEach((plane, i) => {
        const d = i - index
        const angle = d * (wide ? 0.5 : 0.88)
        const depth = Math.cos(angle)
        const visible = animated ? Math.abs(d) < reach : i === selected
        const x = Math.sin(angle) * radius - d * tile * (wide ? 0.025 : 0.045)
        const y = d * tile * (wide ? 0.14 : 0.27) + Math.sin(angle) * tile * 0.09
        const z = (depth - 1) * radius * (wide ? 0.8 : 1)
        plane.style.transform = animated
          ? `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${-Math.sin(angle) * (wide ? 44 : 32)}deg) rotateZ(${Math.sin(angle) * (wide ? 5 : 8)}deg)`
          : 'translate(-50%, -50%)'
        plane.style.opacity = visible ? String(animated
          ? Math.min(1, (reach - Math.abs(d)) / 1.5) * (wide ? 0.46 + Math.max(0, depth) * 0.54 : 1)
          : 1) : '0'
        plane.style.visibility = visible ? 'visible' : 'hidden'
        plane.style.setProperty('--card-order', String(Math.round(wide ? 100 + depth * 50 - Math.abs(d) : 100 - Math.abs(d) * 10)))
        plane.style.pointerEvents = visible && Math.abs(d) < 3 ? 'auto' : 'none'
        plane.style.setProperty('--card-light', String(0.65 + (depth + 1) * 0.175))
      })
      if (selected !== previous) {
        previous = selected
        setActive(selected)
        setExpanded(false)
      }
    }
    render.current = paint
    paint(position.current)
    const resize = () => paint(position.current)
    window.addEventListener('resize', resize)
    const ctx = gsap.context(() => {
      if (!animated) return
      proxy.index = 0
      const tl = gsap.timeline({
        onUpdate: () => {
          // Browser scroll positions round to pixels at the two end cards.
          const tolerance = duration / (innerHeight * 4.2)
          const next = tl.time() >= entrance - tolerance && tl.time() <= entrance + journey + tolerance
          if (next !== interactive) {
            interactive = next
            setAvailable(next)
            setExpanded(false)
          }
        },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: () => `+=${innerHeight * 4.2}`,
          pin: true, scrub: 0.55, anticipatePin: 1, invalidateOnRefresh: true,
          snap: {
            snapTo: (progress) => {
              const time = progress * duration
              if (time < entrance || time > entrance + journey) return progress
              return (entrance + Math.round((time - entrance) / journey * last) / last * journey) / duration
            },
            inertia: false, delay: 0.15, duration: { min: 0.15, max: 0.35 }, ease: 'power2.out',
          },
        },
      })
      trigger.current = tl.scrollTrigger!
      tl.fromTo('.spiral-world', { yPercent: 160, rotation: -18, scale: 0.72, autoAlpha: 1 }, {
        yPercent: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: entrance, ease: 'power2.out',
      }, 0)
        .fromTo('.spiral-heading, .spiral-caption', { y: 60, autoAlpha: 1 }, {
          y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out',
        }, 0.2)
        .to(proxy, { index: last, duration: journey, ease: 'none', onUpdate: () => paint(proxy.index) }, entrance)
        .to('.spiral-world', { yPercent: -75, rotation: 12, scale: 0.75, autoAlpha: 0, duration: 0.65, ease: 'power2.in' }, entrance + journey)
        .to('.spiral-heading, .spiral-caption', { y: -20, autoAlpha: 0, duration: 0.4 }, entrance + journey + 0.25)
    }, root)
    return () => {
      trigger.current = null
      window.removeEventListener('resize', resize)
      ctx.revert()
    }
  }, [animated])

  useEffect(() => {
    if (pendingFocus.current !== active || (animated && !available)) return
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        scene.current?.querySelectorAll<HTMLButtonElement>('.spiral-face')[active]?.focus({ preventScroll: true })
        pendingFocus.current = null
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [active, available, animated])

  const openDetail = () => {
    if (expanded) return
    const source = scene.current!.querySelector<HTMLElement>('.spiral-face[aria-current="true"]')!
    launch.current = { rect: source.getBoundingClientRect(), focus: document.activeElement as HTMLElement | null }
    setShowBack(false)
    setExpanded(true)
  }

  const closeDetail = () => {
    if (detail.current?.dataset.phase === 'closing') return
    const motion = detailMotion.current
    const body = detail.current?.querySelector<HTMLElement>('.location-detail-body')
    if (motion && motion.progress() > 0 && !body?.scrollTop) {
      detail.current!.dataset.phase = 'closing'
      body!.inert = true
      motion.timeScale(1.15).reverse()
    } else setExpanded(false)
  }

  const choose = (index: number, focus = false) => {
    const next = clamp(index)
    if (focus) pendingFocus.current = Math.round(next)
    setExpanded(false)
    const st = trigger.current
    if (st) {
      const snap = st.getTween(true)
      if (snap) snap.kill()
      const progress = (entrance + next / last * journey) / st.animation!.duration()
      window.scrollTo({ top: st.start + progress * (st.end - st.start), behavior: 'instant' })
    } else render.current(next)
    if (focus) {
      if (Math.round(next) === active && (!animated || available)) {
        scene.current?.querySelectorAll<HTMLButtonElement>('.spiral-face')[active]?.focus({ preventScroll: true })
        pendingFocus.current = null
      }
    }
  }

  const key = (event: React.KeyboardEvent) => {
    if (detail.current?.open) {
      if (event.key === 'Escape') { event.preventDefault(); closeDetail() }
      return
    }
    const target = event.target as HTMLElement
    const next = event.key === 'ArrowRight' ? active + 1 : event.key === 'ArrowLeft' ? active - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
    if (next === null) {
      if (event.key === 'Escape') closeDetail()
      return
    }
    event.preventDefault()
    choose(next, target.matches('.spiral-face'))
  }

  return (
    <section ref={root} id="dia-diem" className={`spiral-section${animated ? '' : ' spiral-static'}`}
      aria-labelledby="places-title" onKeyDown={key} data-expanded={expanded}>
      <header className="spiral-heading">
        <p>03 — Hai mươi bốn địa điểm</p>
        <h2 id="places-title" className="display">Dọc miền thủy trận.</h2>
      </header>
      <div ref={scene} className="spiral-scene" role="group" aria-label="24 thẻ địa điểm — kéo ngang để chọn"
        inert={animated && !available} onPointerDown={(event) => {
          if (event.button !== 0) return
          suppressClick.current = false
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, index: position.current, target: position.current, moved: false }
        }} onPointerMove={(event) => {
          const start = drag.current
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (!start.moved) {
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag.current = null; return }
            if (Math.abs(dx) < 8) return
            start.moved = true
            suppressClick.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            event.currentTarget.dataset.dragging = 'true'
          }
          start.target = clamp(start.index - dx / Math.max(45, event.currentTarget.clientWidth * 0.12))
          choose(start.target)
        }} onPointerUp={(event) => {
          const start = drag.current
          drag.current = null
          event.currentTarget.dataset.dragging = 'false'
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          if (start?.moved) choose(Math.round(start.target))
        }} onPointerCancel={(event) => { drag.current = null; suppressClick.current = false; event.currentTarget.dataset.dragging = 'false' }}
        onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}>
        <div className="spiral-world">
          {locations.map((card, index) => <div className="spiral-plane" key={card.id} data-active={index === active}>
            <button type="button" className="spiral-face card-feel" tabIndex={index === active ? 0 : -1}
              aria-label={`${index === active && expanded ? 'Thu nhỏ' : 'Xem'} tranh F3 của địa danh ${card.name}`}
              aria-current={index === active ? 'true' : undefined}
              aria-haspopup="dialog" aria-controls="location-detail"
              onClick={() => index === active ? openDetail() : choose(index)}>
              <img className="spiral-source" src={card.spiralImage} alt={`${card.name} — tranh toàn cảnh F3`} loading="eager" decoding="async" draggable={false} />
              <span className="spiral-art" aria-hidden="true">
                {slices.map((style, i) => <span className="spiral-slice" key={i} style={{ ...style, backgroundImage: `url(${card.spiralImage})` }} />)}
              </span>
            </button>
          </div>)}
        </div>
      </div>
      <div className="spiral-caption" aria-live="polite" aria-atomic="true">
        <div><p><strong>{String(active + 1).padStart(2, '0')}</strong> <span>/ 24</span></p><span>{current.name}</span></div>
        <button type="button" className="spiral-detail-link" disabled={animated && !available} aria-haspopup="dialog"
          aria-controls="location-detail" onClick={openDetail}>Xem hai mặt <span aria-hidden="true">↗</span></button>
      </div>
      <dialog ref={detail} id="location-detail" className="location-detail" aria-labelledby="location-detail-title" aria-describedby="location-detail-meaning"
        onCancel={(event) => { event.preventDefault(); closeDetail() }}
        onClick={(event) => { if (event.target === event.currentTarget) closeDetail() }}>
        <button type="button" className="location-close" aria-label="Đóng địa danh" onClick={closeDetail}>
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M6 18 18 6" /></svg>
        </button>
        <div className="location-detail-body">
          <div className="location-detail-layout">
            <div>
              <div className="location-flip" data-back={showBack}>
                <div className="location-flip-sheet" id="location-card-faces">
                  <img src={current.image} alt={`${current.name} — mặt trước`} aria-hidden={showBack} loading="eager" decoding="async" draggable={false} />
                  <img src={current.back} alt={`${current.name} — mặt sau`} aria-hidden={!showBack} loading="eager" decoding="async" draggable={false} />
                </div>
              </div>
              <div className="location-face-actions">
                <span aria-live="polite">{showBack ? 'Mặt sau' : 'Mặt trước'}</span>
                <button type="button" aria-controls="location-card-faces" onClick={() => setShowBack((value) => !value)}>
                  {showBack ? 'Xem mặt trước' : 'Lật sang mặt sau'} <span aria-hidden="true">↻</span>
                </button>
              </div>
            </div>
            <div className="location-copy">
              <p className="location-eyebrow">Địa danh Thủy Trận</p>
              <h3 id="location-detail-title" className="display">{current.name}</h3>
              {(character || strategy) && <p className="location-game-use">{character
                ? <>Nơi xuất phát · <strong>{character.prefix ? `${character.prefix} ` : ''}{character.role}</strong></>
                : <>Kế sách · <strong>{strategy!.name}</strong></>}</p>}
              <p id="location-detail-meaning" className="location-meaning">{current.meaning}</p>
              <p className="location-story">{current.story}</p>
              <details className="location-context"><summary>Bối cảnh tham khảo</summary><p>{current.source}</p></details>
            </div>
          </div>
        </div>
        <div className="location-flight" aria-hidden="true">
          <img src={current.spiralImage} alt="" draggable={false} />
          <img src={showBack ? current.back : current.image} alt="" draggable={false} />
        </div>
      </dialog>
    </section>
  )
}
