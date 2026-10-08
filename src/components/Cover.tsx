import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Hero from './Hero'
import cover from '../assets/bia-thuy-tran.webp'
import { cards } from '../data/cards'
import { strategies } from '../data/strategies'
import { createBoxScene } from './boxScene'
import useReducedMotion from '../hooks/useReducedMotion'

const alt = 'Bìa board game Thủy trận Bạch Đằng: thuyền nhẹ cầm cờ len giữa bãi cọc nhọn, chiến thuyền buồm đỏ phía xa'

export default function Cover({ playIntro, onReady }: { playIntro: boolean; onReady: () => void }) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [fallback, setFallback] = useState(false)

  useLayoutEffect(() => {
    if (reduced || fallback) { onReady(); return }
    if (!canvas.current) return
    let box: ReturnType<typeof createBoxScene>
    try {
      box = createBoxScene({
        canvas: canvas.current,
        cover,
        cards: cards.map((c) => c.image),
        extra: strategies.map((k) => k.image),
      })
    } catch {
      setFallback(true)
      return
    }
    let cancelled = false
    box.ready.then(() => { if (!cancelled) onReady() })
      .catch(() => { if (!cancelled) setFallback(true) })
    const st = box.state
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=1000%',
          invalidateOnRefresh: true,
          pin: true,
          scrub: 0.6,
        },
      })
      // Keep the sun and box in one pinned viewport: no section boundary to cross.
      const sun = root.current!.querySelector<HTMLElement>('.sun')!
      const stage = root.current!
      const brand = document.querySelector<HTMLElement>('.site-brand')!
      const header = document.querySelector<HTMLElement>('.site-header')!
      const navigation = document.querySelectorAll('.site-cta, .chapter-nav')
      const titleScale = () => Math.min(stage.clientWidth * (stage.clientWidth > stage.clientHeight ? 0.78 : 0.9), stage.clientHeight * 0.78, 900) / brand.offsetWidth
      const titleX = () => (stage.clientWidth - brand.offsetWidth * titleScale()) / 2 - brand.offsetLeft
      const titleY = () => stage.querySelector<HTMLElement>('.hero-copy')!.offsetTop - brand.offsetHeight * titleScale() - 16 - brand.offsetTop
      // Explicit starts also restore the scene after resizing mid-transition.
      tl.set('.hero-layer', { autoAlpha: 1 }, 0)
        .set(navigation, { autoAlpha: 0 }, 0)
        .set(header, { mixBlendMode: 'normal' }, 0)
        .set(brand, { x: titleX, y: titleY, scale: titleScale, force3D: false, autoAlpha: 1, color: '#9c2923', '--brand-outline': '0.6px' }, 0)
        .fromTo(brand, { x: titleX, y: titleY, scale: titleScale }, { x: 0, y: 0, scale: 1, duration: 0.75, ease: 'power2.inOut', immediateRender: false }, 0.65)
        .to(navigation, { autoAlpha: 1, duration: 0.25 }, 1.4)
        .set(header, { mixBlendMode: 'difference' }, 1.4)
        .set(brand, { color: '#f6e9d7', '--brand-outline': '0px' }, 1.4)
        .fromTo('.hero-fade', { y: 0, opacity: 1 }, { y: -60, opacity: 0, duration: 0.65 }, 0.65)
        .fromTo('.hero-person', { x: 0, y: 0, rotation: 0, scale: 1 }, {
          x: (_index, element) => -Number(getComputedStyle(element).getPropertyValue('--hand-x')) * sun.offsetWidth * 0.08,
          y: (_index, element) => -Number(getComputedStyle(element).getPropertyValue('--hand-y')) * sun.offsetWidth * 0.08,
          rotation: (_index, element) => Number(element.dataset.exit) * -3,
          duration: 0.3, ease: 'power2.out',
        }, 0.65)
        .to('.hero-person', {
          x: (_index, element) => Number(element.dataset.exit) * stage.clientWidth * (element.dataset.side === 'top' ? 0.18 : 1.1),
          y: (_index, element) => -stage.clientHeight * (element.dataset.side === 'top' ? 1.1 : 0.16),
          rotation: (_index, element) => Number(element.dataset.exit) * 24,
          scale: 1.12, duration: 1.1, stagger: { amount: 0.2, from: 'center' }, ease: 'power3.inOut',
        }, 0.95)
        .fromTo(sun, { x: 0, y: 0, scale: 1 }, {
          x: () => stage.clientWidth / 2 - sun.offsetLeft - sun.offsetWidth / 2,
          y: () => stage.clientHeight / 2 - sun.offsetTop - sun.offsetHeight / 2,
          scale: () => Math.hypot(stage.clientWidth, stage.clientHeight) / sun.offsetWidth * 1.08,
          duration: 1.6,
          ease: 'power2.inOut',
        }, 0.65)
        .fromTo('.sun-texture', { opacity: 1 }, { opacity: 0, duration: 0.6 }, 1.65)
        .set('.hero-layer', { autoAlpha: 0 }, 2.25)
        .fromTo(canvas.current, { yPercent: 110 }, {
          yPercent: 0, duration: 1.4, ease: 'power2.out',
        }, 2.25)
        .fromTo(st, { elev: 1.3, yaw: -0.5, zoom: 0.9 }, {
          elev: 1.0, yaw: -0.25, zoom: 1, ease: 'power2.out', duration: 1.4,
        }, 2.25)
      const reveal = 3.85
      tl.to(st, { lift: 7, lidTilt: -0.1, ease: 'power2.inOut', duration: 1.4 }, reveal)
      tl.to(st, { rise: 1, elev: 0.3, yaw: 0, zoom: 1.25, shift: 0.9, ease: 'power2.inOut', duration: 1.4 }, reveal + 1.2)
      tl.to(st, { drop: 8, ease: 'power2.in', duration: 1 }, reveal + 2.4)
      st.fan.forEach((_, i) => tl.to(st.fan, { [i]: 1, ease: 'power2.out', duration: 0.9 }, reveal + 3.2 + i * 0.1))
      tl.fromTo('.bx-side', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6 }, reveal + 4.2)
      tl.to({}, { duration: 0.6 })
      tl.to('.bx-side', { opacity: 0, x: -30, duration: 0.5 }, '>')
      const t0 = tl.duration() - 0.5
      tl.to(st, { swap: 1, zoom: 1.1, elev: 0.26, shift: 0, ease: 'power2.inOut', duration: 1.3 }, t0)
      st.fan2.forEach((_, i) => tl.to(st.fan2, { [i]: 1, ease: 'power2.out', duration: 0.9 }, t0 + 0.7 + i * 0.1))
      tl.to(root.current, { backgroundColor: '#e6cfa6', duration: 1.2, ease: 'none' }, '>-0.5')
      tl.to({}, { duration: 0.4 })
    }, root)

    return () => {
      cancelled = true
      ctx.revert()
      box.dispose()
    }
  }, [reduced, fallback, onReady])

  if (reduced || fallback) {
    return (
      <section ref={root} className="relative bg-[#ffb627] text-ink" aria-label="Hộp Thủy trận Bạch Đằng">
        <Hero playIntro={playIntro} />
        <section className="bg-[#ffb627] px-4 py-16 text-ink" aria-label="Bìa hộp">
          <img src={cover} alt={alt} className="mx-auto w-full max-w-xl" />
        </section>
      </section>
    )
  }

  return (
    <section
      ref={root}
      className="relative h-svh overflow-hidden bg-[#ffb627] text-ink"
      aria-label="Hộp Thủy trận Bạch Đằng"
    >
      <div className="hero-layer absolute inset-0 z-10">
        <Hero playIntro={playIntro} />
      </div>
      <div className="bx-side absolute top-1/2 left-[clamp(1rem,3vw,2.5rem)] z-20 hidden max-w-[19rem] -translate-y-1/2 lg:block">
        <p className="text-[0.76rem] font-medium tracking-[0.25em] uppercase">
          <span className="text-vermilion">00</span> — Trong hộp
        </p>
        <p className="display mt-4 text-[clamp(2.4rem,4.4vw,4.6rem)] !font-bold leading-[0.92]">
          Sáu lệnh bài,
          <br />
          <span className="text-vermilion">bảy kế sách.</span>
        </p>
      </div>

      <canvas ref={canvas} className="absolute inset-0 size-full touch-pan-y" role="img" aria-label={alt} />
      <p className="sr-only">
        {cards.map((cd) => `${cd.role}: ${cd.skill}`).join('. ')}
      </p>
    </section>
  )
}
