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
      // Intro, pointer depth and scroll exit each animate a separate element.
      gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.8 })
        .from('.sun-texture', { scale: 0.75, duration: 1.5 })
        .from('.hero-title .ch', { yPercent: 115, duration: 1.1, stagger: 0.035 }, 0.05)
        .from('.hero-person-intro', { yPercent: 115, rotation: -5, duration: 1.5, stagger: 0.08 }, 0.15)
        .from('.band', { yPercent: 100, duration: 1.0, stagger: 0.08 }, 0.1)
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

      <div className="hero-bands" aria-hidden="true">
        {[
          { color: '#15345f', path: 'M-80 60C210 8 420 118 710 66S1190 20 1520 54V200H-80Z' },
          { color: '#b5362b', path: 'M-80 98C210 46 420 156 710 104S1190 58 1520 92V200H-80Z' },
          { color: '#d99a2b', path: 'M-80 138C210 86 420 196 710 144S1190 98 1520 132V200H-80Z' },
        ].map((band) => (
          <svg key={band.color} viewBox="0 0 1440 200" preserveAspectRatio="none" className="band absolute inset-0 size-full">
            <path d={band.path} fill={band.color} />
          </svg>
        ))}
      </div>
    </section>
  )
}
