import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import SplitChars from './SplitChars'
import { cards, type CardData } from '../data/cards'
import useReducedMotion from '../hooks/useReducedMotion'
import { strategies } from '../data/strategies'

/* The skill badge is cropped straight out of each card's artwork. */
function Badge({ image }: { image: string }) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0 rounded-full size-[clamp(3.4rem,6vw,5.6rem)] bg-no-repeat"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: '534.8% auto',
        backgroundPosition: '9.8% 87%',
      }}
    />
  )
}

function Info({ card, index }: { card: CardData; index: number }) {
  return (
    <div className="info col-start-1 row-start-1" data-i={index}>
      <p className="info-rest text-[0.76rem] font-medium tracking-[0.25em] uppercase" style={{ color: card.accent }}>
        {card.prefix ? `${card.prefix} · ` : ''}Nhân vật
      </p>
      <h3
        className="display mt-3 text-[clamp(2.4rem,11vw,4.5rem)] lg:text-[clamp(4rem,8vw,9rem)] relative z-0"
        style={{ color: card.accent }}
      >
        <SplitChars text={card.role} />
      </h3>
      <div className="info-rest mt-[clamp(1.2rem,3vh,2.4rem)] flex items-start gap-4 lg:gap-6 max-w-[34rem]">
        <Badge image={card.image} />
        <div>
          <p className="display !font-bold !leading-[1.05] !tracking-[0.005em] text-[clamp(1.2rem,2.2vw,2.1rem)]">
            {card.skill}
          </p>
          <p className="mt-2 text-[clamp(0.96rem,1.15vw,1.08rem)] leading-relaxed text-card/90 font-normal">
            {card.text}
          </p>
        </div>
      </div>
      <p className="info-rest mt-[clamp(1rem,3vh,2.2rem)] font-serif italic font-normal text-[clamp(1.1rem,1.6vw,1.45rem)] leading-relaxed text-card/75">
        “{card.quote}”
      </p>
    </div>
  )
}

const pos = (rel: number) => ({
  y: rel * 3.2 + '%',
  x: rel * (rel % 2 ? 4 : -3) + '%',
  rotate: rel === 0 ? 0 : rel % 2 ? 3.5 * rel : -3 * rel,
  scale: 1 - rel * 0.05,
  opacity: rel > 2 ? 0 : 1,
})

export default function Roles() {
  const root = useRef<HTMLElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const bigNum = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const n = cards.length

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>('.stack-card')
      const infos = gsap.utils.toArray<HTMLElement>('.info')
      const ticks = gsap.utils.toArray<HTMLElement>('.tick')

      cardEls.forEach((el, i) => gsap.set(el, { ...pos(i), zIndex: n - i }))
      // Hide the whole inactive panel as well as its characters: tall Vietnamese
      // accents can still peek through a character mask after translation alone.
      gsap.set(infos, { autoAlpha: 0 })
      gsap.set(infos[0], { autoAlpha: 1 })
      infos.slice(1).forEach((el) => {
        gsap.set(el.querySelectorAll('.ch'), { yPercent: 125, opacity: 0 })
        gsap.set(el.querySelectorAll('.info-rest'), { opacity: 0, y: 36 })
      })
      gsap.set(ticks, { scale: 0.7, opacity: 0.35 })
      gsap.set(ticks[0], { scale: 1.5, opacity: 1 })

      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const rx = gsap.quickTo('.stack-tilt', 'rotationX', { duration: 1, ease: 'power3' })
        const ry = gsap.quickTo('.stack-tilt', 'rotationY', { duration: 1, ease: 'power3' })
        const gx = gsap.quickTo('.glow', 'x', { duration: 1.6, ease: 'power3' })
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5
          const ny = e.clientY / window.innerHeight - 0.5
          ry(nx * 14)
          rx(-ny * 10)
          gx(nx * 80)
        }
        window.addEventListener('pointermove', move)
        return () => window.removeEventListener('pointermove', move)
      })

      let roleDuration = n - 1
      let chapterDuration = roleDuration
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${(n - 1) * window.innerHeight * 0.95 * chapterDuration / roleDuration}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (progress: number) => {
              const roleEnd = roleDuration / chapterDuration
              // Keep the six original stops; do not snap through the chapter handoff.
              return progress > roleEnd ? progress : gsap.utils.snap(roleEnd / (n - 1), progress)
            },
            duration: { min: 0.2, max: 0.6 },
            ease: 'power2.inOut',
          },
          onUpdate: (self) => {
            const roleProgress = Math.min(1, self.progress * chapterDuration / roleDuration)
            const k = String(Math.round(roleProgress * (n - 1)) + 1).padStart(2, '0')
            if (counter.current) counter.current.textContent = k
            if (bigNum.current) bigNum.current.textContent = k
          },
        },
      })

      for (let i = 1; i < n; i++) {
        const t = i - 1
        tl.to(
          cardEls[i - 1],
          { yPercent: -115, xPercent: 35, rotate: 16, opacity: 0, duration: 0.85, ease: 'power2.in' },
          t,
        )
        for (let j = i; j < n; j++) {
          tl.to(cardEls[j], { ...pos(j - i), duration: 1, ease: 'power2.inOut' }, t)
        }
        tl.to(root.current, { backgroundColor: cards[i].bg, duration: 1 }, t)
        tl.to(infos[i - 1].querySelectorAll('.ch'), { yPercent: -125, opacity: 0, duration: 0.35, stagger: 0.015 }, t)
        tl.to(infos[i - 1].querySelectorAll('.info-rest'), { opacity: 0, y: -30, duration: 0.3 }, t)
        tl.set(infos[i - 1], { autoAlpha: 0 }, t + 0.5)
        tl.set(infos[i], { autoAlpha: 1 }, t + 0.5)
        tl.to(infos[i].querySelectorAll('.ch'), { yPercent: 0, opacity: 1, duration: 0.4, stagger: 0.015 }, t + 0.5)
        tl.to(infos[i].querySelectorAll('.info-rest'), { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }, t + 0.6)
        tl.to(root.current, { '--acc': cards[i].accent, duration: 1 }, t)
        tl.to(ticks[i - 1], { scale: 0.7, opacity: 0.35, duration: 0.4 }, t)
        tl.to(ticks[i], { scale: 1.5, opacity: 1, duration: 0.4 }, t + 0.5)
      }

      // Finish reading the sixth role before handing the same blue surface to chapter 02.
      roleDuration = tl.duration()
      const exit = roleDuration + 0.45
      tl.to(cardEls[n - 1], {
        yPercent: -130, xPercent: 12, rotate: 8, opacity: 0,
        duration: 0.85, ease: 'power2.in',
      }, exit)
      tl.to(infos[n - 1], { y: -30, autoAlpha: 0, duration: 0.55 }, exit)
      tl.to('.roles-ui, .glow', { opacity: 0, duration: 0.55 }, exit)
      tl.to(root.current, {
        backgroundColor: strategies[0].bg, duration: 1.15, ease: 'power2.inOut',
      }, exit + 0.4)
      tl.to({}, { duration: 0.15 })
      chapterDuration = tl.duration()
      tl.scrollTrigger?.refresh()
    }, root)
    return () => ctx.revert()
  }, [reduced, n])

  if (reduced) {
    return (
      <div id="roles">
        {cards.map((c, i) => (
          <section
            key={c.id}
            className="px-[clamp(1rem,3vw,2.5rem)] py-20 text-card"
            style={{ background: c.bg }}
          >
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.3fr_1fr] items-center">
              <div className="grid">
                <Info card={c} index={i} />
              </div>
              <img src={c.image} alt={`Lá bài ${c.role}`} className="card-shadow rounded-[3%] w-full max-w-sm justify-self-center" />
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <section
      ref={root}
      id="roles"
      className="relative h-svh overflow-hidden text-card"
      style={{ background: cards[0].bg, ['--acc' as string]: cards[0].accent }}
    >
      <div
        aria-hidden="true"
        className="glow pointer-events-none absolute right-[-10vw] top-1/2 size-[80vmax] -translate-y-1/2 rounded-full opacity-[0.28] max-lg:top-[22%]"
        style={{ background: 'radial-gradient(closest-side, var(--acc), transparent 72%)' }}
      />
      <span
        ref={bigNum}
        aria-hidden="true"
        className="roles-ui display text-outline pointer-events-none absolute bottom-[-0.12em] left-[1vw] text-[clamp(10rem,34vw,34rem)] leading-none opacity-25 max-lg:hidden"
        style={{ WebkitTextStroke: '1.5px var(--acc)' }}
      >
        01
      </span>
      <div className="absolute inset-x-0 top-0 h-full px-[clamp(1rem,3vw,2.5rem)] pt-16 pb-6 lg:pt-20 lg:pb-10 grid grid-rows-[minmax(0,44svh)_1fr] lg:grid-rows-1 lg:grid-cols-12 gap-x-4">
        {/* card stack */}
        <div className="relative lg:col-start-8 lg:col-span-5 lg:row-start-1 row-start-1 flex items-center justify-center z-10">
          <div className="relative h-full lg:h-[min(78svh,100%)] max-w-full [perspective:1400px]" style={{ aspectRatio: '1500 / 2078' }}>
            <div className="stack-tilt absolute inset-0">
            {cards.map((c) => (
              <img
                key={c.id}
                src={c.image}
                alt={`Lá bài ${c.role} — ${c.skill}`}
                className="stack-card card-feel card-shadow absolute inset-0 w-full h-full rounded-[3%] object-cover will-change-transform"
                draggable={false}
                loading="eager"
              />
            ))}
            </div>
          </div>
        </div>

        {/* copy */}
        <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 row-start-2 flex flex-col justify-center lg:pl-10 min-h-0">
          <div className="grid">
            {cards.map((c, i) => (
              <Info key={c.id} card={c} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* chapter rail */}
      <div className="roles-ui absolute left-[clamp(1rem,3vw,2.5rem)] top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
        {cards.map((c) => (
          <span key={c.id} className="tick block size-2 rotate-45" style={{ background: 'var(--acc)' }} />
        ))}
      </div>
      <p className="roles-ui absolute left-[clamp(1rem,3vw,2.5rem)] top-16 lg:top-20 z-20 text-[0.74rem] font-medium tracking-[0.3em] text-card/80 lg:hidden">
        SÁU NHÂN VẬT
      </p>
      <p className="roles-ui absolute right-[clamp(1rem,3vw,2.5rem)] bottom-5 z-20 text-sm font-medium tracking-[0.2em] text-card/80">
        <span ref={counter} className="text-card font-bold">01</span> / {String(n).padStart(2, '0')}
      </p>
      <p className="roles-ui absolute left-[clamp(1rem,3vw,2.5rem)] bottom-5 z-20 hidden text-[0.74rem] font-medium tracking-[0.25em] uppercase text-card/70 lg:block">
        Cuộn để chia bài
      </p>
    </section>
  )
}
