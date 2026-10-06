import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import SplitChars from './SplitChars'
import { byId } from '../data/cards'
import useReducedMotion from '../hooks/useReducedMotion'

const fan = [
  { id: 'thuyen-nhe', x: '-62%', y: '6%', r: -11, depth: 14 },
  { id: 'tham-quan', x: '62%', y: '12%', r: 10, depth: 22 },
  { id: 'nha-tuong', x: '0%', y: '-6%', r: -1.5, depth: 34 },
]

export default function Hero({ playIntro = true }: { playIntro?: boolean }) {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !playIntro) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.9 })
      tl.from('.sun-texture', { scale: 0.2, opacity: 0, duration: 1.3 })
        .from('.band', { yPercent: 100, duration: 1.2, stagger: 0.08 }, 0.08)
        .from('.hero-title .ch', { yPercent: 115, duration: 1.0, stagger: 0.04 }, 0.1)
        .from(
          '.hero-card',
          { yPercent: 70, opacity: 0, rotate: 0, duration: 1.2, stagger: 0.08 },
          0.25,
        )
        .from('.hero-fade > *', { opacity: 0, y: 16, duration: 0.8, stagger: 0.08 }, 0.65)

      // pointer parallax (fine pointers only)
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('.hero-card')
        const setters = layers.map((el, i) => ({
          x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
          k: fan[i].depth,
        }))
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5
          const ny = e.clientY / window.innerHeight - 0.5
          setters.forEach((s) => {
            s.x(nx * s.k * 1.4)
            s.y(ny * s.k)
          })
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
      })
    }, root)
    return () => ctx.revert()
  }, [reduced, playIntro])

  return (
    <section
      ref={root}
      id="top"
      className="hero-ground relative isolate h-svh overflow-hidden px-[clamp(1rem,3vw,2.5rem)] pt-20 pb-10"
    >
      {/* sun disc */}
      <div
        className="sun absolute -z-10 rounded-full right-[-8vw] top-[14vh] size-[clamp(260px,52vw,780px)] max-lg:right-[-20vw] max-lg:top-[42vh]"
        style={{
          background: '#ffb627',
          boxShadow: '0 0 0 1px rgba(181,54,43,.25), 0 0 0 clamp(14px,2.2vw,34px) rgba(217,154,43,.16)',
        }}
        aria-hidden="true"
      >
        <div className="sun-texture absolute inset-0 rounded-full" style={{
          background: 'radial-gradient(circle at 38% 34%, #f7cf6a 0%, #e8a93a 42%, #c9782a 78%, #b5542a 100%)',
        }} />
      </div>

      {/* river bands */}
      <div className="hero-bands absolute inset-x-0 bottom-0 z-[5] h-[clamp(90px,17vh,190px)] overflow-hidden" aria-hidden="true">
        {[
          { c: '#15345f', d: 'M-80 92C200 36 380 150 640 98S1040 36 1240 88 1440 112 1520 76V200H-80Z', k: 'band-1' },
          { c: '#b5362b', d: 'M-80 132C240 92 420 172 700 132S1100 92 1520 142V200H-80Z', k: 'band-2' },
          { c: '#d99a2b', d: 'M-80 168C300 142 500 192 820 162S1200 152 1520 178V200H-80Z', k: 'band-3' },
        ].map((b) => (
          <svg key={b.k} viewBox="0 0 1440 200" preserveAspectRatio="none" className={`band ${b.k} absolute inset-0 size-full`}>
            <path d={b.d} fill={b.c} />
          </svg>
        ))}
      </div>

      {/* title */}
      <h1 className="hero-title display relative z-0 select-none text-[clamp(4.5rem,21vw,26rem)] max-lg:mt-6">
        <span className="title-a block">
          <SplitChars text="Thủy" />
        </span>
        <span className="title-b block pl-[22vw] text-vermilion max-lg:pl-[16vw]">
          <SplitChars text="Trận" />
        </span>
      </h1>

      {/* fan of cards */}
      <div
        className="fan absolute z-10 right-[3vw] bottom-[-12vh] w-[clamp(190px,24vw,360px)] max-lg:right-1/2 max-lg:translate-x-1/2 max-lg:bottom-[-2vh] max-lg:w-[clamp(150px,42vw,260px)]"
        style={{ aspectRatio: '1500 / 2078' }}
      >
        {fan.map((f) => {
          const c = byId(f.id)
          return (
            <img
              key={f.id}
              src={c.image}
              alt={`Lá bài ${c.role}`}
              className="hero-card card-feel card-shadow absolute inset-0 w-full h-full rounded-[3%] object-cover"
              style={{
                transform: `translate(${f.x}, ${f.y}) rotate(${f.r}deg)`,
                zIndex: f.depth,
              }}
              draggable={false}
              fetchPriority="high"
            />
          )
        })}
      </div>

      {/* copy */}
      <div className="hero-fade absolute left-[clamp(1rem,3vw,2.5rem)] bottom-[clamp(7rem,21vh,13rem)] z-20 max-w-[22rem] max-lg:hidden">
        <p className="font-serif italic text-[1.35rem] leading-relaxed font-normal">
          Sáu lá lệnh, một dòng sông. Mỗi lệnh ban ra, cả đội hình đổi hướng.
        </p>
        <p className="mt-4 text-[0.76rem] tracking-[0.22em] uppercase opacity-75 font-medium">
          Board game chiến thuật hợp tác · Việt Nam
        </p>
      </div>

      <div className="hero-fade relative z-20 mt-8 hidden max-lg:block max-w-[18rem]">
        <p className="font-serif italic text-lg leading-relaxed font-normal">
          Sáu lá lệnh, một dòng sông.
        </p>
        <p className="mt-3 text-[0.72rem] tracking-[0.22em] uppercase opacity-75 font-medium">
          Board game chiến thuật · Việt Nam
        </p>
      </div>

      <div className="hero-fade absolute right-[clamp(1rem,3vw,2.5rem)] top-20 z-20 flex items-center gap-3 text-[0.74rem] tracking-[0.25em] uppercase max-lg:hidden">
        <span>Cuộn để ra quân</span>
        <span className="block h-px w-14 bg-ink origin-left animate-pulse" />
      </div>
    </section>
  )
}
