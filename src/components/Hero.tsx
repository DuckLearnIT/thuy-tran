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
        .from(arrivals, { xPercent: (_i, element) => element.closest('.hero-person').dataset.side === 'left' ? -20 : 20, duration: 1.5, stagger: 0.08 }, 0.15)
        .from('.hero-water-enter', { yPercent: 18, duration: 2 }, 0.1)
        .from('.hero-fade > *', { y: 20, opacity: 0, duration: 0.65, stagger: 0.1 }, 0.6)

      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('.hero-person-depth')
        const setters = layers.map((el, i) => ({
          x: gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' }),
          k: heroCast[i].depth,
        }))
        const move = (event: PointerEvent) => {
          const nx = event.clientX / innerWidth - 0.5
          const ny = event.clientY / innerHeight - 0.5
          setters.forEach((s) => { s.x(nx * s.k); s.y(ny * s.k * 0.6) })
        }
        const leave = () => setters.forEach((s) => { s.x(0); s.y(0) })
        const host = root.current!
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
            style={{ '--left': person.hand[0], '--top': person.hand[1], '--tip-x': person.tip[0], '--tip-y': person.tip[1], '--angle': person.angle } as React.CSSProperties}>
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
      </div>
      <div className="hero-scroll hero-fade">
        <span>Cuộn để ra quân</span>
        <svg width="18" height="28" viewBox="0 0 18 28" fill="none" aria-hidden="true">
          <path d="M9 1v23m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="hero-tide" aria-hidden="true">
        <div className="hero-water-enter">
          <svg className="hero-water hero-water-back" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <path fill="#719b9e" d="M-160 68C-20 110 78 32 200 62S404 128 548 70 766 38 878 66 1094 114 1360 48V840H-160Z" />
          </svg>
          <svg className="hero-water hero-water-front" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <path className="hero-water-surface" fill="#173b51" d="M-160 112C-20 158 64 151 176 104 278 61 288 32 370 56 330 55 306 80 318 105 372 165 540 159 656 108 780 55 805 30 884 54 842 51 820 80 830 103 892 170 1060 147 1180 96L1360 84V840H-160Z" />
            <path fill="#d6dfce" d="M194 112C252 82 303 48 346 54 296 70 286 96 316 118 354 142 385 148 430 144 337 149 300 142 284 116 272 97 284 79 308 68 273 72 229 97 194 112Z" />
            <path fill="#a9c6c3" d="M696 109C751 81 792 47 859 52 805 65 801 98 829 117 857 137 909 148 963 142 877 158 801 138 790 110 784 96 787 81 803 70 766 79 731 97 696 109Z" />
          </svg>
        </div>
      </div>
    </section>
  )
}
