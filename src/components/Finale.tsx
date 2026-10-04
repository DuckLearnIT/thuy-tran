import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Wave from './Wave'
import SplitChars from './SplitChars'
import { cards } from '../data/cards'
import { strategies } from '../data/strategies'
import useReducedMotion from '../hooks/useReducedMotion'

export default function Finale() {
  const root = useRef<HTMLElement>(null)
  const btn = useRef<HTMLAnchorElement>(null)
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

  const mid = (cards.length - 1) / 2

  return (
    <section
      ref={root}
      id="nhan-lenh"
      className="relative overflow-hidden bg-ink text-card min-h-svh flex flex-col"
    >
      <div className="absolute inset-x-0 top-0 -translate-y-[1px]">
        <Wave fill={strategies[strategies.length - 1].bg} flip />
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
          <p className="f-fade font-serif italic font-normal text-[clamp(1.2rem,1.65vw,1.55rem)] leading-relaxed text-card/90">
            Rút một lá. Ban một lệnh. Xem cả dòng sông đổi hướng.
          </p>
          <a
            ref={btn}
            href="#top"
            className="f-fade group relative inline-flex items-center gap-4 rounded-full bg-vermilion px-8 py-5 text-[0.82rem] font-medium tracking-[0.25em] uppercase text-card transition-colors duration-500 hover:bg-ochre hover:text-ink"
          >
            Gia nhập hàng quân
            <span className="inline-block size-2 rotate-45 bg-current transition-transform duration-500 group-hover:rotate-[225deg]" />
          </a>
        </div>
      </div>

      {/* the hand */}
      <div className="hand relative z-0 mt-auto flex justify-center pb-0 -mb-[6vw] pt-10 lg:-mt-[6vw]">
        {cards.map((c, i) => {
          const t = i - mid
          return (
            <div
              key={c.id}
              className="hand-slot -ml-[13vw] first:ml-0 lg:-ml-[5vw] w-[26vw] lg:w-[17vw]"
              style={{ zIndex: i }}
            >
              <img
                src={c.image}
                alt={`Lá bài ${c.role} — ${c.skill}`}
                className="hand-card card-shadow w-full rounded-[3%] cursor-pointer"
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
            </div>
          )
        })}
      </div>

      <footer className="relative z-10 flex justify-between gap-4 px-[clamp(1rem,3vw,2.5rem)] py-5 text-[0.74rem] font-medium tracking-[0.22em] uppercase text-card/60 bg-ink">
        <span>Thủy Trận — board game chiến thuật</span>
        <span>Việt Nam · 2026</span>
      </footer>
    </section>
  )
}
