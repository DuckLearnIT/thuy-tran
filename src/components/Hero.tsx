import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { byId } from '../data/cards'
import { heroCast } from '../data/heroCast'
import useReducedMotion from '../hooks/useReducedMotion'

export default function Hero({ playIntro = true }: { playIntro?: boolean }) {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !playIntro) return
    const ctx = gsap.context(() => {
      const arrivals = gsap.utils.toArray<HTMLElement>('.hero-person')
        .sort((a, b) => a.offsetLeft - b.offsetLeft)
        .map(person => person.querySelector('.hero-person-intro'))
      // Intro, pointer depth and scroll exit each animate a separate element.
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.8 })
        .from('.sun-texture', { scale: 0.75, duration: 1.5 })
        .from(arrivals, {
          xPercent: (_i, element) => ({ left: -20, right: 20, top: 0 })[element.closest('.hero-person').dataset.side as 'left' | 'right' | 'top'],
          yPercent: (_i, element) => element.closest('.hero-person').dataset.side === 'top' ? -30 : 0,
          duration: 1.5, stagger: 0.08,
        }, 0.15)
        .from('.hero-fade > *:not(.hero-cta)', { y: 20, opacity: 0, duration: 0.65, stagger: 0.1 }, 0.6)

      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('.hero-person-depth')
        const setters = layers.map((el, i) => ({
          x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' }),
          k: heroCast[i].depth,
        }))
        const sunX = gsap.quickTo('.sun-texture', 'x', { duration: 0.8, ease: 'power3.out' })
        const sunY = gsap.quickTo('.sun-texture', 'y', { duration: 0.8, ease: 'power3.out' })
        const host = root.current!
        const move = (event: PointerEvent) => {
          const bounds = host.getBoundingClientRect()
          const nx = gsap.utils.clamp(-0.5, 0.5, (event.clientX - bounds.left) / bounds.width - 0.5)
          const ny = gsap.utils.clamp(-0.5, 0.5, (event.clientY - bounds.top) / bounds.height - 0.5)
          const strength = Math.min(1, bounds.width / 1000)
          setters.forEach((s) => { s.x(nx * s.k * strength); s.y(ny * s.k * strength * 0.65) })
          sunX(-nx * 6); sunY(-ny * 4)
        }
        const leave = () => { setters.forEach((s) => { s.x(0); s.y(0) }); sunX(0); sunY(0) }
        host.addEventListener('pointermove', move)
        host.addEventListener('pointerleave', leave)
        return () => {
          host.removeEventListener('pointermove', move)
          host.removeEventListener('pointerleave', leave)
        }
      })
    }, root)
    return () => ctx.revert()
  }, [reduced, playIntro])

  return (
    <section ref={root} id="top" className="hero-ground hero-scene relative isolate h-svh overflow-hidden">
      <div className="sun" aria-hidden="true"><div className="sun-texture" /></div>
      <p className="hero-kicker hero-fade"><span>Boardgame chiến thuật hợp tác · Việt Nam</span></p>
      <h1 className="sr-only">Thủy Trận</h1>

      <div className="hero-cast" role="group" aria-label="Sáu nhân vật cùng ra trận">
        {heroCast.map((person) => (
          <div key={person.id} className="hero-person" data-character={person.id} data-exit={person.exit} data-side={person.side}
            style={{ '--hand-x': person.hand[0], '--hand-y': person.hand[1], '--tip-x': person.tip[0], '--tip-y': person.tip[1], '--angle': person.angle } as React.CSSProperties}>
            <div className="hero-person-placement">
              <div className="hero-person-depth"><div className="hero-person-intro">
                <img src={person.image} alt={byId(person.id).role} className="hero-portrait"
                  fetchPriority="high" decoding="sync" draggable={false} />
              </div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-copy hero-fade">
        <p>Sáu nhân vật. Một ý chí.<br />Cùng xoay chuyển thế trận.</p>
        <a className="hero-cta" href="?page=dat-truoc">
          <span>Đặt trước boardgame</span><span className="nav-diamond" aria-hidden="true" />
        </a>
      </div>
      <div className="hero-scroll hero-fade">
        <span>Cuộn để ra quân</span>
        <svg width="18" height="28" viewBox="0 0 18 28" fill="none" aria-hidden="true">
          <path d="M9 1v23m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

    </section>
  )
}
