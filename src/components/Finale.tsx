import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import SplitChars from './SplitChars'
import Wave from './Wave'
import { cards } from '../data/cards'
import useReducedMotion from '../hooks/useReducedMotion'

export default function Finale() {
  const root = useRef<HTMLElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.from('.f-title .ch', {
        yPercent: 115,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.04,
        scrollTrigger: { trigger: root.current, start: 'top 55%' },
      })
      gsap.from('.f-fade', {
        opacity: 0,
        y: 20,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 45%' },
      })
      gsap.from('.hand-slot', {
        yPercent: 70,
        opacity: 0,
        rotate: 0,
        xPercent: (i) => (2.5 - i) * 60,
        duration: 1.5,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: '.hand', start: 'top 92%' },
      })

      // magnetic CTA
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const el = btn.current!
        const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
        const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          qx((e.clientX - (r.left + r.width / 2)) * 0.3)
          qy((e.clientY - (r.top + r.height / 2)) * 0.3)
        }
        const leave = () => {
          qx(0)
          qy(0)
        }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        return () => {
          el.removeEventListener('pointermove', move)
          el.removeEventListener('pointerleave', leave)
        }
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  useLayoutEffect(() => {
    if (selected === null || reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.f-result > *', { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out',
      })
    }, root)
    return () => ctx.revert()
  }, [selected, reduced])

  const draw = () => setSelected((previous) => previous === null
    ? Math.floor(Math.random() * cards.length)
    : (previous + 1 + Math.floor(Math.random() * (cards.length - 1))) % cards.length)
  const chosen = selected === null ? null : cards[selected]
  const mid = (cards.length - 1) / 2

  return (
    <section
      ref={root}
      id="nhan-lenh"
      className="relative overflow-hidden bg-ink text-card min-h-svh flex flex-col"
    >
      <div className="relative z-10 shrink-0 -mb-px bg-river pointer-events-none">
        <Wave fill="var(--color-ink)" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 bottom-[-20vw] size-[90vw] -translate-x-1/2 rounded-full opacity-40"
        style={{ background: 'radial-gradient(closest-side, #d99a2b, rgba(181,54,43,.5) 50%, transparent 75%)' }}
      />
      <div className="relative z-10 px-[clamp(1rem,3vw,2.5rem)] pt-[clamp(6rem,12vw,11rem)]">
        <h2 className="f-title display text-[clamp(5rem,20vw,23rem)]">
          <span className="block">
            <SplitChars text="Nhận" />
          </span>
          <span className="block pl-[14vw] text-ochre">
            <SplitChars text="Lệnh." />
          </span>
        </h2>

        <div className="mt-10 lg:mt-0 lg:absolute lg:right-[clamp(1rem,3vw,2.5rem)] lg:top-[clamp(7rem,14vw,13rem)] lg:w-[21rem] flex flex-col gap-7 items-start">
          <div className="f-fade f-reading" role="status" aria-live="polite" aria-atomic="true">
            {chosen ? <div className="f-result" key={chosen.id}>
              <p className="text-xs uppercase tracking-[0.2em] text-card/70">Lệnh của bạn</p>
              <h3 className="display text-[clamp(2.5rem,4vw,3.5rem)] leading-none mt-3" style={{ color: chosen.accent }}>{chosen.prefix} {chosen.role}</h3>
              <p className="display text-xl mt-4">{chosen.skill}</p>
              <p className="text-base leading-relaxed mt-2 text-card/90">{chosen.text}</p>
            </div> : <p className="font-serif italic font-normal text-[clamp(1.2rem,1.65vw,1.55rem)] leading-relaxed text-card/90">
              Rút một lá. Ban một lệnh. Xem cả dòng sông đổi hướng.
            </p>}
          </div>
          <button
            ref={btn}
            type="button"
            onClick={draw}
            className="f-fade group relative inline-flex items-center gap-4 rounded-full bg-vermilion px-8 py-5 text-[0.82rem] font-medium tracking-[0.25em] uppercase text-card transition-colors duration-500 hover:bg-ochre hover:text-ink"
          >
            {chosen ? 'Rút lệnh khác' : 'Rút một lá'}
            <span className="inline-block size-2 rotate-45 bg-current transition-transform duration-500 group-hover:rotate-[225deg]" />
          </button>
        </div>
      </div>

      {/* the hand */}
      <div className="hand relative z-20 mt-auto flex justify-center pb-0 -mb-[6vw] pt-16 lg:-mt-[6vw]" data-chosen={chosen !== null} role="group" aria-label="Chọn một lá lệnh">
        {cards.map((c, i) => {
          const t = i - mid
          return (
            <div
              key={c.id}
              className="hand-slot -ml-[13vw] first:ml-0 lg:-ml-[5vw] w-[26vw] lg:w-[17vw]"
              style={{ zIndex: selected === i ? 20 : i }}
            >
              <button type="button" className="hand-pick block w-full cursor-pointer rounded-[3%]" aria-label={`Nhận lệnh ${c.prefix ? `${c.prefix} ` : ''}${c.role}`} aria-pressed={selected === i}
                onClick={() => setSelected(i)} onKeyDown={(event) => {
                  const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
                  if (!direction) return
                  event.preventDefault()
                  const next = (i + direction + cards.length) % cards.length
                  root.current?.querySelectorAll<HTMLButtonElement>('.hand-pick')[next]?.focus({ preventScroll: true })
                  setSelected(next)
                }}>
              <img
                src={c.image}
                alt={`Lá bài ${c.role} — ${c.skill}`}
                className="hand-card card-shadow w-full rounded-[3%]"
                style={
                  {
                    '--r': `${t * 5.5}deg`,
                    '--y': `${t * t * 1.1}vw`,
                  } as React.CSSProperties
                }
                draggable={false}
                loading="eager"
                decoding="async"
              />
              </button>
            </div>
          )
        })}
      </div>

      <footer className="relative z-30 flex justify-between gap-4 px-[clamp(1rem,3vw,2.5rem)] py-5 text-[0.74rem] font-medium tracking-[0.22em] uppercase text-card/60 bg-ink">
        <a href="#top">Thủy Trận — board game chiến thuật</a>
        <span>Việt Nam · 2026</span>
      </footer>
    </section>
  )
}
