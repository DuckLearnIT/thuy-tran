import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Hero from './Hero'
import cover from '../assets/bia-thuy-tran.webp'
import { cards } from '../data/cards'
import { strategies } from '../data/strategies'
import { locations } from '../data/locations'
import { createBoxScene } from './boxScene'
import useReducedMotion from '../hooks/useReducedMotion'
import { pieces } from '../data/pieces'
import PieceGallery from './PieceGallery'
import type { PieceSelection } from './pieceScene'

const alt = 'Bìa board game Thủy trận Bạch Đằng: thuyền nhẹ cầm cờ len giữa bãi cọc nhọn, chiến thuyền buồm đỏ phía xa'
const locationColumns = [2, 4, 6, 6, 4, 2].flatMap(count => Array.from({ length: count }, (_, i) => (6 - count) / 2 + i + 1))

export default function Cover({ playIntro, onReady }: { playIntro: boolean; onReady: () => void }) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const markerLabels = useRef<(HTMLButtonElement | null)[]>([])
  const reduced = useReducedMotion()
  const [fallback, setFallback] = useState(false)
  const [piecesFailed, setPiecesFailed] = useState(false)
  const [selection, setSelection] = useState<PieceSelection>({ index: 0, held: false })
  const controller = useRef<ReturnType<typeof createBoxScene> | null>(null)
  const selected = pieces[selection.index]
  const group = pieces.map((piece, index) => ({ ...piece, index })).filter(piece => piece.kind === selected.kind)
  const selectPiece = (index: number, pick = true) => {
    if (pick || selection.held) controller.current?.pieces.pick(index)
    else controller.current?.pieces.setActive(index)
  }

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
        locations,
        onPieceChange: setSelection,
        onPieceLayout: positions => positions.forEach(({ index, x, y, visible }) => {
          const label = markerLabels.current[index - 6]
          if (!label) return
          label.style.transform = `translate3d(${x}px, ${y}px, 0)`
          label.style.visibility = visible ? 'visible' : 'hidden'
        }),
      })
      controller.current = box
    } catch {
      setFallback(true)
      return
    }
    let cancelled = false
    box.piecesReady.then(ok => { if (!cancelled) setPiecesFailed(!ok) })
    box.ready.then(() => { if (!cancelled) onReady() })
      .catch(() => { if (!cancelled) setFallback(true) })
    const st = box.state
    let previousWidth = innerWidth, previousHeight = innerHeight
    let resizeProgress: number | null = null
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=1600%',
          invalidateOnRefresh: true,
          pin: true,
          scrub: 0.6,
          onRefreshInit(self) {
            const resized = previousWidth !== innerWidth || previousHeight !== innerHeight
            if (resized && self.isActive && st.piecesReveal > 0 && st.boxDismiss < 1) resizeProgress = self.progress
            previousWidth = innerWidth; previousHeight = innerHeight
          },
          onRefresh(self) {
            if (resizeProgress === null) return
            const progress = resizeProgress
            resizeProgress = null
            self.scroll(self.start + (self.end - self.start) * progress)
            self.animation?.progress(progress)
          },
        },
      })
      // Keep the sun and box in one pinned viewport: no section boundary to cross.
      const sun = root.current!.querySelector<HTMLElement>('.sun')!
      const stage = root.current!
      const brand = document.querySelector<HTMLElement>('.site-brand')!
      const header = document.querySelector<HTMLElement>('.site-header')!
      const navigation = document.querySelectorAll('.site-cta, .chapter-nav')
      const controls = root.current!.querySelector<HTMLElement>('.bx-pieces-stage')!
      tl.eventCallback('onUpdate', () => {
        const inert = tl.time() < 1.4
        if (brand.inert !== inert) brand.inert = inert
        const piecesInert = st.piecesReveal < 0.999 || st.piecesExit > 0.0001
        if (controls.inert !== piecesInert) controls.inert = piecesInert
      })
      const titleScale = () => Math.min(stage.clientWidth * (stage.clientWidth > stage.clientHeight ? 0.78 : 0.9), stage.clientHeight * 0.77, 900) / brand.offsetWidth
      const titleX = () => (stage.clientWidth - brand.offsetWidth * titleScale()) / 2 - brand.offsetLeft
      const titleY = () => stage.querySelector<HTMLElement>('.hero-copy')!.offsetTop - brand.offsetHeight * titleScale() - 16 - brand.offsetTop
      // Explicit starts also restore the scene after resizing mid-transition.
      tl.set('.hero-layer', { autoAlpha: 1 }, 0)
        .set(canvas.current, { autoAlpha: 1 }, 0)
        .set(navigation, { autoAlpha: 0 }, 0)
        .set(header, { mixBlendMode: 'normal' }, 0)
        .set(brand, { x: titleX, y: titleY, scale: titleScale, force3D: false, autoAlpha: 1, color: '#9c2923', '--brand-outline': '0.6px' }, 0)
        .fromTo(brand, { x: titleX, y: titleY, scale: titleScale, '--brand-outline': '0.6px' }, { x: 0, y: 0, scale: 1, '--brand-outline': '0px', duration: 0.75, ease: 'power2.inOut', immediateRender: false }, 0.65)
        .to(navigation, { autoAlpha: 1, duration: 0.25 }, 1.4)
        .set(header, { mixBlendMode: 'difference' }, 1.4)
        .set(brand, { color: '#f6e9d7', '--brand-outline': '0px' }, 1.4)
        .fromTo('.hero-fade', { y: 0, opacity: 1 }, { y: -60, opacity: 0, duration: 0.65 }, 0.65)
        .fromTo('.hero-person', { x: 0, y: 0, rotation: 0, scale: 1 }, {
          x: (_index, element) => -Number(getComputedStyle(element).getPropertyValue('--hand-x')) * sun.offsetWidth * 0.08,
          y: (_index, element) => -Number(getComputedStyle(element).getPropertyValue('--hand-y')) * sun.offsetWidth * 0.08,
          rotation: (_index, element) => Number(element.dataset.exit) * -3,
          duration: 0.9, ease: 'power2.out',
        }, 0)
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
      const locationsStart = tl.duration()
      // Two additional screens, with the preceding beats retaining their scroll density.
      const locationsDuration = (locationsStart + 1.1) * 0.2
      tl.addLabel('locations-in', locationsStart)
      tl.fromTo(st, { locationsReveal: 0 }, { locationsReveal: 1, duration: locationsDuration * 0.55, ease: 'none' }, locationsStart)
      tl.fromTo('.bx-locations-copy', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: locationsDuration * 0.18 }, locationsStart + locationsDuration * 0.2)
      tl.addLabel('locations-showcase', locationsStart + locationsDuration * 0.65)
      // Four new screens; preserve the old hero/cards/locations scroll density.
      const piecesStart = locationsStart + locationsDuration * 0.8
      const piecesDuration = (locationsStart + locationsDuration + 1.1) / 3
      tl.addLabel('pieces-in', piecesStart)
      tl.fromTo(st, { piecesReveal: 0 }, { piecesReveal: 1, duration: piecesDuration * 0.3, ease: 'none' }, piecesStart)
      tl.to('.bx-locations-copy', { autoAlpha: 0, y: -18, duration: piecesDuration * 0.08 }, piecesStart)
      tl.fromTo('.bx-pieces-stage', { autoAlpha: 0 }, { autoAlpha: 1, duration: piecesDuration * 0.08 }, piecesStart + piecesDuration * 0.3)
      tl.addLabel('pieces-showcase', piecesStart + piecesDuration * 0.5)
      tl.addLabel('pieces-out', piecesStart + piecesDuration * 0.8)
      tl.fromTo(st, { piecesExit: 0 }, { piecesExit: 1, duration: piecesDuration * 0.2, ease: 'none' }, 'pieces-out')
      tl.to('.bx-pieces-stage', { autoAlpha: 0, duration: piecesDuration * 0.05 }, 'pieces-out')
      tl.addLabel('locations-out', piecesStart + piecesDuration)
      tl.fromTo(st, { locationsExit: 0 }, { locationsExit: 1, duration: locationsDuration * 0.2, ease: 'none' }, 'locations-out')
      tl.addLabel('box-close', '>')
      tl.fromTo(st, { boxClose: 0 }, { boxClose: 1, duration: 0.45, ease: 'none' }, 'box-close')
      tl.addLabel('box-away', '>')
      tl.fromTo(st, { boxDismiss: 0 }, { boxDismiss: 1, duration: 0.65, ease: 'none' }, 'box-away')
      tl.to(root.current, { backgroundColor: '#e6cfa6', duration: 0.65, ease: 'none' }, 'box-away')
      tl.addLabel('box-gone', '>')
      // Everything has already travelled below the frustum; retain no stale canvas at the next chapter.
      tl.set(canvas.current, { autoAlpha: 0 }, 'box-gone')
    }, root)
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') box.pieces.putDown() }
    window.addEventListener('keydown', escape)

    return () => {
      cancelled = true
      ctx.revert()
      box.dispose()
      controller.current = null
      window.removeEventListener('keydown', escape)
    }
  }, [reduced, fallback, onReady])

  if (reduced || fallback) {
    return (
      <section ref={root} className="relative bg-[#ffb627] text-ink" aria-label="Hộp Thủy trận Bạch Đằng">
        <Hero playIntro={playIntro} />
        <section className="bg-[#ffb627] px-4 py-16 text-ink" aria-label="Bìa hộp">
          <img src={cover} alt={alt} className="mx-auto w-full max-w-xl" />
        </section>
        <section className="box-locations-static" aria-label="24 địa danh trong hộp">
          <p className="box-inventory">6 nhân vật · 7 kế sách · 24 địa danh</p>
          <h2 className="display">24 địa danh. Một chiến trường.</h2>
          <div className="box-locations-grid">
            {locations.map((card, i) => <img key={card.id} src={card.image} alt={card.name} draggable={false}
              style={{ gridColumn: locationColumns[i] }} />)}
          </div>
        </section>
        <PieceGallery />
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
          Sáu nhân vật,
          <br />
          <span className="text-vermilion">bảy kế sách.</span>
        </p>
        <p className="box-inventory mt-5">6 nhân vật · 7 kế sách · 24 địa danh<br />6 quân nhân vật · 4 dấu kế sách</p>
      </div>

      <div className="bx-pieces-stage" data-held={selection.held} inert>
        {piecesFailed ? <PieceGallery compact /> : <>
          <div className="bx-pieces-heading">
            <p className="box-inventory">{selection.held ? (selected.kind === 'character' ? 'Quân nhân vật' : 'Dấu kế sách') : '6 quân nhân vật · 4 dấu kế sách'}</p>
            <h2 id="pieces-showcase-title" className="display" aria-live="polite">{selection.held ? selected.name : <>Dựng quân.<br />Bày kế.</>}</h2>
            <p className="piece-intro">{selection.held ? 'Kéo vật để nhìn từ mọi phía.' : 'Chọn một vật. Cầm lên để nhìn gần.'}</p>
          </div>
          {pieces.slice(6).map((piece, index) => <button key={piece.id} type="button"
            ref={node => { markerLabels.current[index] = node }} className="piece-marker-label"
            aria-label={`Cầm xem ${piece.name}`} onClick={() => selectPiece(index + 6)}
            onPointerEnter={() => controller.current?.pieces.highlight(index + 6)}
            onPointerLeave={() => controller.current?.pieces.highlight(-1)}
            onFocus={() => controller.current?.pieces.setActive(index + 6)}>
            <span>{piece.name}</span><span aria-hidden="true" className="piece-marker-line" />
          </button>)}
          <div className="bx-piece-controls" role="group" aria-label="Chọn và xem vật 3D">
            <div className="piece-groups" role="group" aria-label="Loại vật trưng bày">
              <button type="button" aria-pressed={selected.kind === 'character'} onClick={() => selectPiece(0, false)}>
                Quân nhân vật <span>06</span>
              </button>
              <button type="button" aria-pressed={selected.kind === 'strategy'} onClick={() => selectPiece(6, false)}>
                Dấu kế sách <span>04</span>
              </button>
            </div>
            <div className="piece-picker" role="group" aria-label={selected.kind === 'character' ? 'Sáu quân nhân vật' : 'Bốn dấu kế sách'}>
              {group.map(piece => <button key={piece.id} type="button" aria-label={`Cầm xem ${piece.name}`}
                aria-pressed={piece.index === selection.index} onClick={() => selectPiece(piece.index)}
                onPointerEnter={() => controller.current?.pieces.highlight(piece.index)}
                onPointerLeave={() => controller.current?.pieces.highlight(-1)}>
                <span>{piece.name.replace(/^Quân /, '')}</span>
              </button>)}
            </div>
          </div>
          {selection.held && <>
            <div className="piece-inspector">
              <div className="piece-rotation" role="group" aria-label="Xoay vật đang cầm">
                <button type="button" aria-label="Xoay trái" title="Xoay trái" onClick={() => controller.current?.pieces.rotate(-Math.PI / 4)}>↶</button>
                <button className="piece-front" type="button" onClick={() => controller.current?.pieces.resetRotation()}>Chính diện</button>
                <button type="button" aria-label="Xoay phải" title="Xoay phải" onClick={() => controller.current?.pieces.rotate(Math.PI / 4)}>↷</button>
              </div>
              <button className="piece-pick" type="button" onClick={() => controller.current?.pieces.putDown()}>Đặt xuống</button>
            </div>
          </>}
          <p className="piece-scene-note">Bố trí trưng bày minh họa.</p>
        </>}
      </div>

      <div className="bx-locations-copy">
        <p className="box-inventory"><span className="text-vermilion">00</span> — Trong hộp</p>
        <h2 className="display">24 địa danh.<br /><span className="text-vermilion">Một chiến trường.</span></h2>
        <p className="box-inventory">6 nhân vật · 7 kế sách · 24 địa danh</p>
      </div>

      <canvas ref={canvas} className="absolute inset-0 size-full touch-pan-y" role="img"
        aria-label="Mở hộp Thủy Trận: 6 nhân vật, 7 kế sách, 24 địa danh, 6 quân nhân vật và 4 dấu kế sách. Có thể chọn cầm và xoay bằng các nút điều khiển." />
      <p className="sr-only">
        {cards.map((cd) => `${cd.role}: ${cd.skill}`).join('. ')}
        {'. '}
        {locations.map(card => card.name).join('. ')}
      </p>
    </section>
  )
}
