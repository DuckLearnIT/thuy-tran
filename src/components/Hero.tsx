import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import SplitChars from './SplitChars'
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
        .from('.hero-title .ch', { yPercent: 115, duration: 1.1, stagger: 0.035 }, 0.05)
        .from(arrivals, { yPercent: 115, rotation: -3, duration: 1.5, stagger: 0.12 }, 0.15)
        .from('.hero-tide svg', { xPercent: -8, duration: 2 }, 0.1)
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
      <h1 className="hero-title display select-none" aria-label="Thủy Trận">
        <span className="title-a"><SplitChars text="Thủy" /></span>
        <span className="title-b"><SplitChars text="Trận" /></span>
      </h1>

      <div className="hero-cast" role="group" aria-label="Sáu nhân vật cùng ra trận">
        {heroCast.map((person) => (
          <div key={person.id} className="hero-person" data-character={person.id} data-exit={person.exit}>
            <div className="hero-person-depth"><div className="hero-person-intro">
              <img src={person.image} alt={byId(person.id).role} className="hero-portrait"
                fetchPriority="high" decoding="sync" draggable={false} />
            </div></div>
          </div>
        ))}
      </div>

      <div className="hero-copy hero-fade">
        <p>Sáu nhân vật.<br /> Một dòng sông.</p>
      </div>
      <div className="hero-scroll hero-fade">
        <span>Cuộn để ra quân</span>
        <svg width="18" height="28" viewBox="0 0 18 28" fill="none" aria-hidden="true">
          <path d="M9 1v23m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="hero-tide" aria-hidden="true">
        <svg viewBox="0 0 1440 500" preserveAspectRatio="none">
          <path d="M-80 55C180 10 350 100 540 60S950 5 1220 58S1450 95 1520 55V520H-80Z" fill="#15345f" />
          <path d="M-80 75C180 30 350 120 540 80S950 25 1220 78S1450 115 1520 75V520H-80Z" fill="#b5362b" />
          <path d="M-80 95C180 50 350 140 540 100S950 45 1220 98S1450 135 1520 95V520H-80Z" fill="#d99a2b" />
          <path d="M-80 112C180 67 350 157 540 117S950 62 1220 115S1450 152 1520 112V520H-80Z" fill="#efe1c9" />
        </svg>
      </div>
    </section>
  )
}
