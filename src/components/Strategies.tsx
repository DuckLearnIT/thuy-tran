import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { strategies as list } from '../data/strategies'
import useReducedMotion from '../hooks/useReducedMotion'

const n = list.length
const carouselDuration = n - 1
const chapterDuration = carouselDuration + 1.5

function Lines({ s }: { s: (typeof list)[number] }) {
  return (
    <div className="space-y-3">
      {s.lines.map((l, i) => (
        <p key={i} className="text-[clamp(0.96rem,1.15vw,1.1rem)] leading-relaxed max-w-[34rem] font-normal">
          {l.label && (
            <span className="display mr-2 !font-bold !tracking-[0.04em] text-[1.15em] align-baseline">
              {l.label}.
            </span>
          )}
          <span className="opacity-95">{l.text}</span>
        </p>
      ))}
    </div>
  )
}

export default function Strategies() {
  const root = useRef<HTMLElement>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return

    const ctx = gsap.context(() => {
      // Lift each wrapper in a left-to-right wave; the carousel owns the images.
      gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'top top', scrub: 0.6 },
      })
        .fromTo('.ks-content', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
        .fromTo('.ks-wave', { yPercent: 100, autoAlpha: 0 }, {
          yPercent: 0, autoAlpha: 1, duration: 1,
          // Spread the three visible cards across the entire entrance. Offstage
          // cards must not extend the timeline and rush the visible wave.
          stagger: (index) => Math.min(index, 2) * 0.3,
          ease: 'power1.inOut',
        }, 0)
        .fromTo('.ks-entry-label', { y: 32, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.65, ease: 'power2.out',
        }, 0)
        .fromTo('.ks-footer', { y: 40, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.65, ease: 'power2.out',
        }, 0.5)
      const cards = gsap.utils.toArray<HTMLElement>('.ks-card')
      const proxy = { k: 0 }
      let lastActive = -1

      // Render cards in panoramic stage without horizontal compression
      const renderStage = (k: number) => {
        cards.forEach((el, i) => {
          const d = i - k
          const absD = Math.abs(d)

          // Smooth horizontal translation without squishing
          const xPercent = d * 64
          // Mild 3D rotation (max 18deg) to preserve full width without foreshortening
          const rotY = Math.sign(d) * -Math.min(18, absD * 16)
          const rotZ = Math.sign(d) * Math.min(2.5, absD * 2)
          const zPx = -absD * 50
          const scale = Math.max(0.82, 1.05 - absD * 0.09)
          const opacity = absD > 2.8 ? 0 : Math.max(0.4, 1 - absD * 0.22)
          const brightness = Math.max(0.65, 1 - absD * 0.15)
          const zIndex = Math.round(50 - absD * 10)

          el.style.transform = `translate3d(${xPercent}%, 0, ${zPx}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`
          el.style.opacity = `${opacity}`
          el.style.zIndex = `${zIndex}`
          el.parentElement!.style.zIndex = `${zIndex}`
          el.style.filter = `brightness(${brightness})`
          el.style.pointerEvents = absD < 1.5 ? 'auto' : 'none'
        })

        const activeIdx = Math.round(Math.min(Math.max(k, 0), n - 1))
        if (activeIdx !== lastActive) {
          lastActive = activeIdx
          setActive(activeIdx)
        }
      }

      // Pointer parallax for subtle depth
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const stageTilt = gsap.quickTo('.ks-stage', 'rotationY', { duration: 1.2, ease: 'power3' })
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5
          stageTilt(nx * 8)
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
      })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${chapterDuration * window.innerHeight * 0.95}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (progress) => progress * chapterDuration > carouselDuration + 0.02
              ? progress : Math.round(progress * chapterDuration) / chapterDuration,
            duration: { min: 0.25, max: 0.6 },
            ease: 'power2.inOut',
          },
        },
      })
      trigger.current = tl.scrollTrigger as ScrollTrigger

      // Animate progress smoothly through the cards and interpolate background themes
      for (let i = 1; i < n; i++) {
        const segStart = i - 1
        tl.to(
          proxy,
          {
            k: i,
            duration: 1,
            ease: 'power1.inOut',
            onUpdate: () => renderStage(proxy.k),
          },
          segStart,
        )
        tl.to(
          root.current,
          {
            backgroundColor: list[i].bg,
            duration: 1,
            ease: 'power1.inOut',
          },
          segStart,
        )
      }

      // Match the next chapter's backdrop after the strategy cards leave.
      tl.to('.ks-content', {
        yPercent: -25, autoAlpha: 0, duration: 0.8, ease: 'power2.in',
      }, carouselDuration + 0.25)
        .to(root.current, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-indigo').trim(), duration: 0.65 }, carouselDuration + 0.85)

      // Initial render at position 0
      renderStage(0)
    }, root)

    return () => ctx.revert()
  }, [reduced])

  const jump = (j: number) => {
    const st = trigger.current
    if (!st) return
    const p = j / chapterDuration
    window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: 'smooth' })
  }

  if (reduced) {
    return (
      <section id="ke-sach" className="bg-paper px-[clamp(1rem,3vw,2.5rem)] py-20 text-ink">
        <h2 className="display text-[clamp(3rem,10vw,8rem)]">Bảy kế sách</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <article key={s.id} className="rounded-2xl p-6" style={{ background: s.bg, color: s.fg }}>
              <img
                src={s.image}
                alt={`Lá bài ${s.name}`}
                loading="eager"
                decoding="async"
                className="card-shadow w-full rounded-[3%]"
              />
              <h3 className="display mt-5 text-3xl">{s.name}</h3>
              <div className="mt-3">
                <Lines s={s} />
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  const cur = list[active]

  return (
    <section
      ref={root}
      id="ke-sach"
      className="relative h-svh overflow-hidden transition-[color] duration-700 select-none"
      style={{ background: list[0].bg, color: cur.fg }}
    >
      <div className="ks-content absolute inset-0">
      {/* Giant outlined title behind the cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[22%] lg:top-[18%] z-0 flex justify-center overflow-hidden"
      >
        <span
          key={cur.id}
          className="ks-name display whitespace-nowrap text-[clamp(4.5rem,18vw,22rem)] leading-none transition-all duration-500"
          style={{
            color: 'transparent',
            WebkitTextStroke: '1.5px currentColor',
            opacity: 0.35,
          }}
        >
          {cur.name}
        </span>
      </div>

      <p className="ks-entry-label absolute left-[clamp(1rem,3vw,2.5rem)] top-16 lg:top-20 z-20 text-[0.76rem] font-medium tracking-[0.25em] uppercase opacity-90">
        02 — Bảy kế sách
      </p>

      {/* Spacious 3D Panoramic Stage */}
      <div className="absolute inset-x-0 top-[12%] bottom-[28%] lg:bottom-[20%] z-10 flex items-center justify-center [perspective:1400px]">
        <div className="ks-stage relative flex items-center justify-center [transform-style:preserve-3d]">
          <div
            className="relative w-[min(54vw,34svh)] sm:w-[min(44vw,38svh)] lg:w-[min(23vw,46svh)] max-w-[340px]"
            style={{ aspectRatio: '1500 / 2078' }}
          >
            {list.map((s, i) => (
              <div key={s.id} className="ks-wave absolute inset-0 [transform-style:preserve-3d]">
              <img
                src={s.image}
                alt={`Lá kế sách ${s.name}`}
                draggable={false}
                loading="eager"
                decoding="async"
                onClick={() => jump(i)}
                className="ks-card card-shadow absolute inset-0 size-full rounded-[4%] object-cover cursor-pointer transition-[filter,box-shadow] duration-300 will-change-transform"
                style={{
                  aspectRatio: '1500 / 2078',
                  transform: 'translate3d(0, 0, 0)',
                }}
              />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Information & Tab Switcher */}
      <div className="ks-footer absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 px-[clamp(1rem,3vw,2.5rem)] pb-6 lg:flex-row lg:items-end lg:justify-between lg:pb-10">
        <div key={cur.id} className="ks-info max-w-xl">
          <p className="text-[0.76rem] font-medium tracking-[0.25em] uppercase opacity-85">{cur.tag}</p>
          <h3 className="display mt-1 mb-3 text-[clamp(1.8rem,3.6vw,3.4rem)] !font-bold">{cur.name}</h3>
          <Lines s={cur} />
        </div>
        <div className="flex items-center gap-1.5 self-start lg:self-end" role="tablist" aria-label="Chọn lá kế sách">
          {list.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.name}
              onClick={() => jump(i)}
              className="display grid size-9 place-items-center rounded-full border text-sm !font-bold transition-all duration-300 cursor-pointer"
              style={{
                borderColor: 'currentColor',
                background: i === active ? 'currentColor' : 'transparent',
                color: i === active ? cur.bg : 'currentColor',
                transform: i === active ? 'scale(1.18)' : 'scale(1)',
                opacity: i === active ? 1 : 0.65,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
