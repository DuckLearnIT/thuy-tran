import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useReducedMotion from '../hooks/useReducedMotion'

const cards = Array.from({ length: 24 }, (_, index) => String(index + 1).padStart(2, '0'))
const overviewTime = 2.3

export default function Locations() {
  const root = useRef<HTMLElement>(null)
  const board = useRef<HTMLDivElement>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const closeButton = useRef<HTMLButtonElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [available, setAvailable] = useState(false)
  const [columns, setColumns] = useState(() => window.matchMedia('(max-width: 640px)').matches ? 4 : 6)
  const [shortScreen, setShortScreen] = useState(() => window.matchMedia('(max-height: 560px)').matches)
  const reduced = useReducedMotion()
  const animated = !reduced && !shortScreen

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const heightQuery = window.matchMedia('(max-height: 560px)')
    const resize = () => {
      setColumns(query.matches ? 4 : 6)
      setShortScreen(heightQuery.matches)
      setSelected(null)
    }
    query.addEventListener('change', resize)
    heightQuery.addEventListener('change', resize)
    return () => {
      query.removeEventListener('change', resize)
      heightQuery.removeEventListener('change', resize)
    }
  }, [])

  useLayoutEffect(() => {
    if (!animated) return
    setAvailable(false)
    const ctx = gsap.context(() => {
      const slots = Array.from(board.current!.children) as HTMLElement[]
      // Measure the grid cells, never the transformed card layers.
      const pileX = (i: number) => board.current!.clientWidth * ((Math.floor(i / 8) + 0.5) / 3)
        - slots[i].offsetLeft - slots[i].offsetWidth / 2
      const pileY = (i: number) => board.current!.clientHeight / 2
        - slots[i].offsetTop - slots[i].offsetHeight / 2 + (i % 8 - 3.5) * 2
      let interactive = false
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onUpdate: () => {
          const next = tl.time() >= 1.35 && tl.time() < 2.7
          if (next !== interactive) {
            interactive = next
            setAvailable(next)
            if (!next) setSelected(null)
          }
        },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: () => `+=${window.innerHeight * 2.4}`,
          pin: true, scrub: 0.65, anticipatePin: 1, invalidateOnRefresh: true,
        },
      })
      trigger.current = tl.scrollTrigger!
      tl.fromTo('.places-heading, .places-controls', { y: 20, autoAlpha: 1 }, {
        y: 0, autoAlpha: 1, duration: 0.45,
      }, 0)
        .fromTo('.place-motion', {
          x: pileX, y: pileY, rotation: (i) => (i % 8 - 3.5) * 1.8, scale: 0.95, autoAlpha: 0.75,
        }, { autoAlpha: 1, duration: 0.25 }, 0)
        .to('.place-motion', {
          x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.7,
          stagger: (i) => Math.floor(i / 8) * 0.12 + (i % 8) * 0.02,
        }, 0.25)
        .to('.place-motion', {
          x: pileX, y: pileY, rotation: (i) => (i % 8 - 3.5) * 1.8, scale: 0.95,
          duration: 0.55, stagger: (i) => (2 - Math.floor(i / 8)) * 0.08 + (i % 8) * 0.015,
        }, 2.7)
        .to('.places-heading, .places-controls', { y: -20, autoAlpha: 0, duration: 0.35 }, 3.2)
        .to(board.current, { yPercent: -120, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 3.55)
        .to(root.current, {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
          duration: 0.45,
        }, 3.55)
      slots.forEach((slot, i) => {
        // Each tile completes its own lift before the wave advances diagonally.
        tl.fromTo(slot.querySelector('.place-wave'), { y: 0, scale: 1, rotation: 0 }, {
          y: -18, scale: 1.06, rotation: 0.6, duration: 0.2, repeat: 1, yoyo: true, ease: 'sine.inOut',
        }, 1.45 + (Math.floor(i / columns) + i % columns) * 0.045)
      })
    }, root)
    return () => { trigger.current = null; ctx.revert() }
  }, [columns, animated])

  const dismiss = () => {
    if (selected === null) return
    buttons.current[selected]?.focus({ preventScroll: true })
    setSelected(null)
  }

  useEffect(() => {
    if (selected === null) return
    closeButton.current?.focus({ preventScroll: true })
    const initialScroll = window.scrollY
    const scroll = () => { if (Math.abs(window.scrollY - initialScroll) > 4) setSelected(null) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('keydown', key)
    }
  }, [selected])

  const overview = () => {
    const st = trigger.current
    if (st) window.scrollTo({ top: st.start + overviewTime / st.animation!.duration() * (st.end - st.start), behavior: 'instant' })
  }

  const moveFocus = (event: React.KeyboardEvent, index: number) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }
    if (!(event.key in steps)) return
    event.preventDefault()
    buttons.current[Math.max(0, Math.min(23, index + steps[event.key]))]?.focus({ preventScroll: true })
  }

  return (
    <section ref={root} id="dia-diem" className={`places-section${animated ? '' : ' places-reduced'}`} aria-labelledby="places-title">
      <header className="places-heading">
        <p>03 — Hai mươi bốn địa điểm</p>
        <h2 id="places-title" className="display">Bày thế trận.</h2>
      </header>
      <div ref={board} className="places-board" inert={animated && !available} role="group" aria-label="24 thẻ địa điểm">
        {cards.map((number, index) => {
          const col = index % columns
          const row = Math.floor(index / columns)
          const chosen = selected === index
          const dx = selected === null ? 0 : col - selected % columns
          const dy = selected === null ? 0 : row - Math.floor(selected / columns)
          const neighbor = !chosen && selected !== null && Math.abs(dx) <= 1 && Math.abs(dy) <= 1
          const shiftX = (col === 0 && dx < 0) || (col === columns - 1 && dx > 0) ? 0 : Math.sign(dx) * 55
          const shiftY = (row === 0 && dy < 0) || (row === 24 / columns - 1 && dy > 0) ? 0 : Math.sign(dy) * 55
          return (
            <div key={number} className="place-slot" style={{ zIndex: chosen ? 50 : neighbor ? 1 : 2 }}>
              <div className="place-motion"><div className="place-wave">
                <div className="place-interaction" data-selected={chosen} style={{
                  transformOrigin: `${col === 0 ? 'left' : col === columns - 1 ? 'right' : 'center'} ${row === 0 ? 'top' : row === 24 / columns - 1 ? 'bottom' : 'center'}`,
                  transform: chosen ? 'scale(1.8)' : neighbor ? `translate(${shiftX}%, ${shiftY}%)` : 'none',
                }}>
                  <button ref={(node) => { buttons.current[index] = node }} type="button" className="place-card"
                    aria-label={`Địa điểm ${number}`} aria-expanded={chosen} aria-controls={chosen ? 'place-details' : undefined}
                    tabIndex={chosen ? -1 : 0} onClick={() => setSelected(index)} onKeyDown={(event) => moveFocus(event, index)}>
                    <span className="display place-number">{number}</span>
                    <span className="place-label">Địa điểm</span>
                  </button>
                  {chosen && <div id="place-details" className="place-details" role="region" aria-labelledby="place-name">
                    <button ref={closeButton} type="button" className="place-close" aria-label="Đóng chi tiết địa điểm" onClick={dismiss}>×</button>
                    <h3 id="place-name" className="display">Địa điểm {number}</h3>
                    <p>Thẻ mẫu<br />Hình ảnh và nội dung sẽ được bổ sung.</p>
                  </div>}
                </div>
              </div></div>
            </div>
          )
        })}
      </div>
      <div className="places-controls">
        <p>Cuộn để bày bài · Chọn một thẻ để xem</p>
        {animated && <button type="button" onClick={overview}>Xem toàn bộ <span aria-hidden="true">↗</span></button>}
      </div>
    </section>
  )
}
