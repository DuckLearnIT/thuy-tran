import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import cover from '../assets/bia-thuy-tran.webp'
import { cards } from '../data/cards'
import { allowedStep, deliveryErrors, deliveryFields, DRAFT_KEY, emptyDraft, fieldError, priceLabel, provinces, readDraft, sales, totals, wardsFor,
  type CheckoutStep, type DeliveryField } from '../data/checkout'
import { preloadAssets } from '../preloadAssets'
import useReducedMotion from '../hooks/useReducedMotion'
import Curtain from './Curtain'
import Cursor from './Cursor'
import SplitChars from './SplitChars'
import Wave from './Wave'
import useCardFeel from '../hooks/useCardFeel'
import SiteFooter from './SiteFooter'

export default function Preorder() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [initial] = useState(() => {
    const draft = readDraft()
    return { draft, step: allowedStep(new URLSearchParams(location.search).get('step'), draft) }
  })
  const [draft, setDraft] = useState(initial.draft)
  const [step, setStep] = useState<CheckoutStep>(initial.step)
  const [errors, setErrors] = useState<Partial<Record<DeliveryField, string>>>({})
  const [saved, setSaved] = useState(true)
  const direction = useRef(1)
  const previousStep = useRef(step)
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const [opening, setOpening] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  useCardFeel(root, unlocked)
  const onOpen = useCallback(() => setOpening(true), [])
  const onComplete = useCallback(() => setUnlocked(true), [])
  const amount = totals(draft.quantity)
  const stepIndex = step === 'preview' ? 3 : Number(step)
  const updateUrl = (next: CheckoutStep, replace = false) => {
    const url = new URL(location.href)
    url.searchParams.set('page', 'dat-truoc')
    url.searchParams.set('step', next)
    url.hash = ''
    history[replace ? 'replaceState' : 'pushState'](null, '', url)
  }
  const goToStep = (next: CheckoutStep, nextDraft = draft) => {
    const target = allowedStep(next, nextDraft)
    if (target === step) return
    direction.current = (target === 'preview' ? 4 : Number(target)) > (step === 'preview' ? 4 : Number(step)) ? 1 : -1
    updateUrl(target)
    setStep(target)
  }
  const changeField = (name: DeliveryField, value: string) => {
    setDraft((draft) => ({ ...draft, [name]: value, ...(name === 'province' ? { ward: '' } : {}) }))
    setErrors((errors) => ({ ...errors, ...(name in errors ? { [name]: fieldError(name, value, draft.province) } : {}), ...(name === 'province' ? { ward: '' } : {}) }))
  }
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === '1') {
      const next = { ...draft, selected: true }
      setDraft(next)
      goToStep('2', next)
    } else if (step === '2') {
      const nextErrors = deliveryErrors(draft)
      setErrors(nextErrors)
      const first = deliveryFields.find(({ name }) => nextErrors[name])
      if (first) requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[name="${first.name}"]`)?.focus())
      else goToStep('3')
    } else if (step === '3') goToStep('preview')
  }
  const clearDraft = () => {
    setDraft({ ...emptyDraft })
    setErrors({})
    direction.current = -1
    updateUrl('1', true)
    setStep('1')
  }

  useEffect(() => {
    updateUrl(initial.step, true)
  }, [initial])

  useEffect(() => {
    try {
      if (draft.selected || draft.quantity !== 1 || deliveryFields.some(({ name }) => draft[name])) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, draft }))
      } else sessionStorage.removeItem(DRAFT_KEY)
      setSaved(true)
    } catch { setSaved(false) }
  }, [draft])

  useEffect(() => {
    const onPop = () => {
      const requested = new URLSearchParams(location.search).get('step')
      const next = allowedStep(requested, draft)
      direction.current = (next === 'preview' ? 4 : Number(next)) > stepIndex ? 1 : -1
      if (next !== requested) updateUrl(next, true)
      setStep(next)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [draft, stepIndex])

  useLayoutEffect(() => {
    if (!unlocked || previousStep.current === step) return
    previousStep.current = step
    const heading = root.current?.querySelector<HTMLElement>('#po-step-title')
    heading?.focus({ preventScroll: true })
    if (heading && (heading.getBoundingClientRect().top < 24 || window.innerWidth <= 900)) {
      root.current?.querySelector('.po-order')?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.po-step-panel', { x: direction.current * 20 }, { x: 0, duration: 0.3, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [step, unlocked, reduced])

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
    <main ref={root} id="dat-truoc" className="po-page grain" tabIndex={-1}>
      <Curtain ready={ready} progress={progress} failed={failed} onRetry={() => setAttempt((value) => value + 1)}
        onOpen={onOpen} onComplete={onComplete} />
      <div inert={!unlocked} aria-hidden={!unlocked}>
        <Cursor />
        <header className="po-header">
          <a className="display po-brand" href="./#top">Thủy Trận</a>
          <a className="po-back" href="./#nhan-lenh">↖ Trở lại dòng sông</a>
        </header>
        <div className="po-layout">
          <section className="po-story" data-open={open} aria-labelledby="preorder-title">
            <p className="po-eyebrow">Một hộp game. Cả đội ra quân.</p>
            <h1 id="preorder-title" className="po-title display">
              <span><SplitChars text="Hẹn ngày" /></span>
              <span><SplitChars text="ra trận." /></span>
            </h1>
            <button className="po-preview-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="po-product-preview">
              {open ? 'Thu gọn hộp game' : 'Xem hộp game & đội hình'} <span aria-hidden="true">{open ? '−' : '+'}</span>
            </button>
            <div id="po-product-preview" className="po-stage" data-open={open}>
              <div className="po-sun" aria-hidden="true" />
              <div className="po-box" onPointerMove={(event) => {
                if (reduced || event.pointerType !== 'mouse') return
                const bounds = event.currentTarget.getBoundingClientRect()
                event.currentTarget.style.setProperty('--tilt', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`)
              }} onPointerLeave={(event) => event.currentTarget.style.removeProperty('--tilt')}>
                <div className="po-box-base" aria-hidden="true" />
                <div id="preorder-hand" className="po-hand" aria-hidden={!open}>
                  {cards.map((card, i) => <img key={card.id} className="card-feel" src={card.image} alt={`Nhân vật ${card.role}`}
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
            <p className="po-stamp display">Phiếu<br />mẫu</p>
            <nav className="po-steps" aria-label="Các bước đặt trước">
              <ol>{(['1', '2', '3'] as const).map((item, i) => <li key={item} data-current={stepIndex === i + 1} data-done={stepIndex > i + 1}>
                <button type="button" aria-current={stepIndex === i + 1 ? 'step' : undefined} disabled={Number(item) > stepIndex}
                  onClick={() => goToStep(item)}><span aria-hidden="true">{stepIndex > i + 1 ? '◆' : `0${item}`}</span>{['Bộ game', 'Giao hàng', 'Kiểm tra'][i]}</button>
              </li>)}</ol>
            </nav>
            <form noValidate onSubmit={submit}>
              <div key={step} className="po-step-panel" data-step={step}>
                <p className="po-step-count">{step === 'preview' ? 'Bản tổng hợp' : `Bước 0${step} / 03`}</p>
                <h3 id="po-step-title" className="display" tabIndex={-1}>{({ '1': 'Chọn bộ game.', '2': 'Hẹn nơi gặp.', '3': 'Kiểm tra phiếu.', preview: 'Phiếu mẫu.' })[step]}</h3>
                {step === '1' && <>
                  <div className="po-product"><img src={cover} alt="Hộp board game Thủy Trận" loading="eager" decoding="async" />
                    <div><h4 className="display">{sales.product}</h4><p>Board game chiến thuật hợp tác</p><p className="po-product-contents">06 nhân vật · 07 kế sách · 24 địa điểm</p></div>
                  </div>
                  <fieldset className="po-quantity">
                    <legend>Số bộ game <small>Từ 1 đến 99 bộ</small></legend>
                    <div>
                      <button type="button" aria-label="Giảm số bộ game" disabled={draft.quantity === 1} onClick={() => setDraft((draft) => ({ ...draft, quantity: draft.quantity - 1 }))}>−</button>
                      <output aria-live="polite" aria-label="Số bộ đã chọn"><strong key={draft.quantity}>{String(draft.quantity).padStart(2, '0')}</strong></output>
                      <button type="button" aria-label="Tăng số bộ game" disabled={draft.quantity === 99} onClick={() => setDraft((draft) => ({ ...draft, quantity: draft.quantity + 1 }))}>+</button>
                    </div>
                  </fieldset>
                  <dl className="po-totals"><div><dt>Giá một bộ</dt><dd>{priceLabel(sales.unitPrice)}</dd></div><div><dt>Tạm tính · {draft.quantity} bộ</dt><dd>{priceLabel(amount.subtotal)}</dd></div><div><dt>Lịch giao dự kiến</dt><dd>{sales.deliveryDate ?? 'Chưa công bố'}</dd></div></dl>
                  <p className="po-note">Bạn có thể điền thử phiếu. Đặt trước sẽ mở khi có giá và lịch giao.</p>
                </>}
                {step === '2' && <>
                  <p className="po-intro">Giao trong Việt Nam. Các ô có dấu * là bắt buộc.</p>
                  {deliveryFields.map((field, i) => <label className="po-field" key={field.name}>
                    <span className="po-field-label"><span className="po-field-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{field.label}
                      {!field.optional && <span className="po-required" aria-hidden="true">*</span>}</span>
                    {field.optional && <span className="po-optional">Tùy chọn</span>}
                    {field.name === 'province' || field.name === 'ward' ? <select name={field.name} autoComplete={field.autoComplete} required
                      value={draft[field.name]} disabled={field.name === 'ward' && !draft.province}
                      aria-invalid={!!errors[field.name]} aria-describedby={`po-${field.name}-error`}
                      onChange={(event) => changeField(field.name, event.target.value)}
                      onBlur={(event) => setErrors((errors) => ({ ...errors, [field.name]: fieldError(field.name, event.target.value, draft.province) }))}>
                      <option value="">{field.name === 'ward' && !draft.province ? 'Chọn tỉnh / thành phố trước' : field.placeholder}</option>
                      {(field.name === 'province' ? provinces.map((province) => province.name) : wardsFor(draft.province)).map((name) => <option value={name} key={name}>{name}</option>)}
                    </select> : field.name === 'note' ? <textarea name={field.name} autoComplete={field.autoComplete} maxLength={field.maxLength} rows={2}
                      value={draft[field.name]} placeholder={field.placeholder} onChange={(event) => changeField(field.name, event.target.value)} /> :
                      <input name={field.name} type={field.type ?? 'text'} autoComplete={field.autoComplete} required={!field.optional} maxLength={field.maxLength}
                        value={draft[field.name]} placeholder={field.placeholder} aria-invalid={!!errors[field.name]} aria-describedby={`po-${field.name}-error`}
                        onChange={(event) => changeField(field.name, event.target.value)} onBlur={(event) => setErrors((errors) => ({ ...errors, [field.name]: fieldError(field.name, event.target.value, draft.province) }))} />}
                    {field.name !== 'note' && <span id={`po-${field.name}-error`} className="po-error" aria-live="polite">{errors[field.name]}</span>}
                  </label>)}
                </>}
                {(step === '3' || step === 'preview') && <>
                  {step === 'preview' && <p className="po-sample-status" role="status">Phiếu mẫu — thông tin chưa được gửi.</p>}
                  <section className="po-summary" aria-labelledby="po-game-summary">
                    <div className="po-summary-heading"><h4 id="po-game-summary">Bộ game</h4><button type="button" className="po-edit" onClick={() => goToStep('1')}>Sửa số lượng ↗</button></div>
                    <div className="po-product po-product-small"><img src={cover} alt="Hộp Thủy Trận" loading="eager" decoding="async" /><div><h4 className="display">{sales.product}</h4><p>{draft.quantity} bộ game</p></div></div>
                  </section>
                  <section className="po-summary" aria-labelledby="po-delivery-summary">
                    <div className="po-summary-heading"><h4 id="po-delivery-summary">Giao hàng</h4><button type="button" className="po-edit" onClick={() => goToStep('2')}>Sửa địa chỉ ↗</button></div>
                    <address><strong>{draft.name.trim()}</strong><span>{draft.phone.trim()}</span><span>{[draft.address, draft.ward, draft.province, 'Việt Nam'].map((value) => value.trim()).join(', ')}</span>
                      {draft.email.trim() && <span>{draft.email.trim()}</span>}{draft.note.trim() && <span className="po-delivery-note">Ghi chú: {draft.note.trim()}</span>}</address>
                  </section>
                  <dl className="po-totals"><div><dt>Tạm tính · {draft.quantity} bộ</dt><dd>{priceLabel(amount.subtotal)}</dd></div><div><dt>Phí vận chuyển</dt><dd>{priceLabel(sales.shippingFee)}</dd></div><div className="po-total"><dt>Tổng cộng</dt><dd>{priceLabel(amount.total)}</dd></div><div><dt>Lịch giao dự kiến</dt><dd>{sales.deliveryDate ?? 'Chưa công bố'}</dd></div></dl>
                  <section className="po-payment" aria-labelledby="po-payment-title"><span className="po-payment-mark" aria-hidden="true">◆</span><div><h4 id="po-payment-title">Chuyển khoản QR</h4>
                    <p>{sales.bank ? `${sales.bank.name} · ${sales.bank.account} · ${sales.bank.holder}` : 'Thông tin ngân hàng và mã QR sẽ được bổ sung khi mở đặt trước.'}</p>
                    <span>Chưa mở thanh toán</span></div></section>
                </>}
                <div className="po-actions">
                  {step !== '1' && step !== 'preview' && <button type="button" className="po-return" onClick={() => goToStep(step === '2' ? '1' : '2')}>← Quay lại</button>}
                  {step !== 'preview' ? <button className="hero-cta po-submit" type="submit"><span className="hero-cta-label">{step === '1' ? 'Tiếp tục — giao hàng' : step === '2' ? 'Tiếp tục — kiểm tra' : 'Xem phiếu mẫu'}</span><span className="nav-diamond" aria-hidden="true" /></button> :
                    <><button className="hero-cta po-submit" type="button" onClick={() => goToStep('3')}><span className="hero-cta-label">Chỉnh sửa phiếu</span><span className="nav-diamond" aria-hidden="true" /></button><button className="po-reset" type="button" onClick={clearDraft}>Xóa nháp, bắt đầu lại</button></>}
                </div>
              </div>
              <p className="po-status">{step === 'preview' ? 'Chưa có đơn đặt trước hay thanh toán nào được tạo.' : 'Phiếu thử — chưa gửi đơn hay thanh toán.'}</p>
              <p className="po-draft-status">{saved ? 'Nháp được giữ trong tab này.' : 'Nháp chỉ được giữ khi trang đang mở; tải lại sẽ mất thông tin.'}</p>
            </form>
          </section>
        </div>
        <div className="po-wave" aria-hidden="true"><Wave fill="var(--color-ink)" /></div>
        <div className="po-footer-area"><SiteFooter /></div>
      </div>
    </main>
  )
}
