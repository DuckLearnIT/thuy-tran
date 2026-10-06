import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { locations } from '../data/locations'
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
  const trigger = useRef<ScrollTrigger | null>(null)
  const render = useRef<(index: number) => void>(() => {})
  const position = useRef(0)
  const drag = useRef<{ id: number; x: number; y: number; index: number; target: number; moved: boolean } | null>(null)
  const pendingFocus = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [available, setAvailable] = useState(false)
  const [short, setShort] = useState(() => matchMedia('(max-height: 560px)').matches)
  const reduced = useReducedMotion()
  const animated = !reduced && !short

  useEffect(() => {
    const media = matchMedia('(max-height: 560px)')
    const change = () => setShort(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])

  useLayoutEffect(() => {
    const planes = Array.from(scene.current!.querySelectorAll<HTMLElement>('.spiral-plane'))
    const proxy = { index: position.current }
    let previous = -1
    let tile = planes[0].offsetWidth
    let radius = Math.min(scene.current!.clientWidth * 0.32, tile * 1.32)
    let interactive = !animated
    setAvailable(interactive)
    const paint = (index: number) => {
      position.current = index
      const selected = Math.round(clamp(index))
      planes.forEach((plane, i) => {
        const d = i - index
        const angle = d * 0.88
        const depth = Math.cos(angle)
        const visible = animated ? Math.abs(d) < 6 : i === selected
        plane.style.visibility = visible ? 'visible' : 'hidden'
        if (!visible) { plane.style.pointerEvents = 'none'; return }
        const x = Math.sin(angle) * radius - d * tile * 0.045
        const y = d * tile * 0.27 + Math.sin(angle) * tile * 0.09
        const z = (depth - 1) * radius
        plane.style.transform = animated
          ? `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${-Math.sin(angle) * 32}deg) rotateZ(${Math.sin(angle) * 8}deg)`
          : 'translate(-50%, -50%)'
        plane.style.opacity = visible ? String(animated ? Math.min(1, (6 - Math.abs(d)) / 2) : 1) : '0'
        plane.style.setProperty('--card-order', String(Math.round(100 - Math.abs(d) * 10)))
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
    const resize = () => {
      tile = planes[0].offsetWidth
      radius = Math.min(scene.current!.clientWidth * 0.32, tile * 1.32)
      paint(position.current)
    }
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
          pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
          snap: {
            snapTo: (progress) => {
              const time = progress * duration
              if (time < entrance || time > entrance + journey) return progress
              return (entrance + Math.round((time - entrance) / journey * last) / last * journey) / duration
            },
            inertia: false, delay: 0.2, duration: { min: 0.16, max: 0.3 }, ease: 'power2.out',
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

  const choose = (index: number, focus = false) => {
    const next = clamp(index)
    if (focus) pendingFocus.current = Math.round(next)
    setExpanded(false)
    const st = trigger.current
    if (st) {
      st.getTween(true)?.kill()
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
    const target = event.target as HTMLElement
    const next = event.key === 'ArrowRight' ? active + 1 : event.key === 'ArrowLeft' ? active - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
    if (next === null) {
      if (event.key === 'Escape') setExpanded(false)
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
          trigger.current?.getTween(true)?.kill()
          suppressClick.current = false
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, index: position.current, target: position.current, moved: false }
        }} onPointerMove={(event) => {
          const start = drag.current
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (!start.moved) {
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag.current = null; return }
            if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return
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
        onPointerLeave={() => { if (!drag.current?.moved) drag.current = null }}
        onLostPointerCapture={(event) => { drag.current = null; event.currentTarget.dataset.dragging = 'false' }}
        onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}>
        <div className="spiral-world">
          {locations.map((card, index) => <div className="spiral-plane" key={card.number} data-active={index === active}>
            <button type="button" className="spiral-face" tabIndex={index === active ? 0 : -1}
              aria-label={`Địa điểm ${card.number}: ${card.name}`} aria-current={index === active ? 'true' : undefined}
              aria-expanded={index === active && expanded} onClick={() => index === active ? setExpanded((value) => !value) : choose(index)}>
              <img className="spiral-source" src={card.image} alt={card.name} loading="eager" decoding="async" draggable={false} />
              <span className="spiral-art" aria-hidden="true">
                {slices.map((style, i) => <span className="spiral-slice" key={i} style={{ ...style, backgroundImage: `url(${card.image})` }} />)}
              </span>
              <span className="spiral-folio" aria-hidden="true">{card.number}</span>
            </button>
          </div>)}
        </div>
      </div>
      <div className="spiral-caption" aria-live="polite" aria-atomic="true">
        <p><strong>{locations[active].number}</strong> <span>/ 24</span></p>
        <span>{locations[active].name}</span>
      </div>
    </section>
  )
}
