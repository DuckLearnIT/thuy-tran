import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import cover from '../assets/bia-thuy-tran.webp'
import { cards } from '../data/cards'
import { preloadAssets } from '../preloadAssets'
import useReducedMotion from '../hooks/useReducedMotion'
import Curtain from './Curtain'
import Cursor from './Cursor'
import SplitChars from './SplitChars'
import Wave from './Wave'

export default function Preorder() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const [opening, setOpening] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const onOpen = useCallback(() => setOpening(true), [])
  const onComplete = useCallback(() => setUnlocked(true), [])

  useEffect(() => {
    document.title = 'Đặt trước — Thủy Trận'
    let cancelled = false
    setFailed(false)
    preloadAssets((value) => { if (!cancelled) setProgress(value) })
      .then(() => {
        if (cancelled) return
        return Promise.all(Array.from(root.current!.querySelectorAll('img'), (image) => image.decode()))
      })
      .then(() => { if (!cancelled) setReady(true) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [attempt])

  useLayoutEffect(() => {
    if (unlocked) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = previous }
  }, [unlocked])

  useLayoutEffect(() => {
    if (!opening || reduced) return
    const ctx = gsap.context(() => {
      gsap.timeline()
        .from('.po-title .ch', { yPercent: 120, duration: 0.75, stagger: 0.018, ease: 'expo.out' }, 0.25)
        .from('.po-stage', { y: 110, rotation: -10, duration: 1, ease: 'back.out(1.15)' }, 0.35)
        .from('.po-order', { x: 90, rotation: 4, duration: 0.9, ease: 'expo.out' }, 0.45)
    }, root)
    return () => ctx.revert()
  }, [opening, reduced])

  return (
    <main ref={root} className="po-page grain">
      <Curtain ready={ready} progress={progress} failed={failed} onRetry={() => setAttempt((value) => value + 1)}
        onOpen={onOpen} onComplete={onComplete} />
      <div inert={!unlocked} aria-hidden={!unlocked}>
        <Cursor />
        <header className="po-header">
          <a className="display po-brand" href="./#top">Thủy Trận</a>
          <a className="po-back" href="./#nhan-lenh">↖ Trở lại dòng sông</a>
        </header>
        <div className="po-layout">
          <section className="po-story" aria-labelledby="preorder-title">
            <p className="po-eyebrow">Một hộp game. Cả đội ra quân.</p>
            <h1 id="preorder-title" className="po-title display">
              <span><SplitChars text="Hẹn ngày" /></span>
              <span><SplitChars text="ra trận." /></span>
            </h1>
            <div className="po-stage" data-open={open}>
              <div className="po-sun" aria-hidden="true" />
              <div className="po-box" onPointerMove={(event) => {
                if (reduced || event.pointerType !== 'mouse') return
                const bounds = event.currentTarget.getBoundingClientRect()
                event.currentTarget.style.setProperty('--tilt', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`)
              }} onPointerLeave={(event) => event.currentTarget.style.removeProperty('--tilt')}>
                <div className="po-box-base" aria-hidden="true" />
                <div id="preorder-hand" className="po-hand" aria-hidden={!open}>
                  {cards.map((card, i) => <img key={card.id} src={card.image} alt={`Nhân vật ${card.role}`}
                    style={{ '--i': i, '--r': `${(i - 2.5) * 12}deg`, '--x': `${(i - 2.5) * 37}px` } as React.CSSProperties}
                    loading="eager" decoding="async" draggable={false} />)}
                </div>
                <button className="po-lid" type="button" aria-label={open ? 'Đóng hộp Thủy Trận' : 'Mở hộp Thủy Trận'}
                  aria-expanded={open} aria-controls="preorder-hand" onClick={() => setOpen((value) => !value)}>
                  <img src={cover} alt="Bìa hộp Thủy Trận — Bạch Đằng" loading="eager" decoding="async" draggable={false} />
                </button>
              </div>
              <button className="po-open" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="preorder-hand">
                {open ? 'Gấp lại, hẹn ra quân' : 'Mở hộp, xem đội hình'} <span aria-hidden="true">↗</span>
              </button>
            </div>
            <p className="po-contents"><span>06 nhân vật</span><span>07 kế sách</span><span>24 địa điểm</span></p>
          </section>
          <section className="po-order" aria-labelledby="order-title">
            <p className="po-eyebrow">Đặt trước Thủy Trận</p>
            <h2 id="order-title" className="display">Phiếu<br />ra quân.</h2>
            <p className="po-stamp display">Sắp<br />mở</p>
            <p className="po-intro">Một lời hẹn. Một ván Thủy Trận.</p>
            <form onSubmit={(event) => event.preventDefault()}>
              <fieldset className="po-quantity">
                <legend>Số bộ game</legend>
                <div>
                  <button type="button" aria-label="Giảm số bộ game" disabled={quantity === 1} onClick={() => setQuantity((value) => value - 1)}>−</button>
                  <output aria-live="polite" aria-label="Số bộ đã chọn"><strong key={quantity}>{String(quantity).padStart(2, '0')}</strong></output>
                  <button type="button" aria-label="Tăng số bộ game" disabled={quantity === 99} onClick={() => setQuantity((value) => value + 1)}>+</button>
                </div>
              </fieldset>
              <label className="po-field"><span className="po-field-label"><span className="po-field-number" aria-hidden="true">01</span>Tên của bạn</span><input name="name" autoComplete="name" required maxLength={100} placeholder="Tên người ra quân" /></label>
              <label className="po-field"><span className="po-field-label"><span className="po-field-number" aria-hidden="true">02</span>Email</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="ban@example.com" /></label>
              <label className="po-field"><span className="po-field-label"><span className="po-field-number" aria-hidden="true">03</span>Số điện thoại</span><span className="po-optional">Không bắt buộc</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="Số điện thoại của bạn" /></label>
              <div className="po-price"><span>Giá đặt trước</span><strong>Sắp công bố</strong></div>
              <button className="po-submit" type="submit" disabled>Đặt trước — sắp mở <span aria-hidden="true">◆</span></button>
              <p className="po-status">Đây là bản xem trước. Chưa gửi đơn hay thanh toán. Giá và lịch giao sẽ được công bố khi mở đặt trước.</p>
            </form>
          </section>
        </div>
        <div className="po-wave" aria-hidden="true"><Wave fill="var(--color-ink)" /></div>
        <footer className="po-footer"><span>Thủy Trận — board game chiến thuật</span><a href="./#ke-sach">Khám phá cách chơi ↗</a></footer>
      </div>
    </main>
  )
}
