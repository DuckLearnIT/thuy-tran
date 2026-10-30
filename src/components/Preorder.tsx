import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import cover from '../assets/bia-thuy-tran.webp'
import { cards } from '../data/cards'
import { contactFields, DRAFT_KEY, emptyDraft, fieldError, preorderErrors, priceLabel, readPreorderSession, sales, totals,
  type PreorderField, type PreorderRequest } from '../data/checkout'
import { PreorderSubmissionError, submitPreorder } from '../submitPreorder'
import { preloadAssets } from '../preloadAssets'
import useReducedMotion from '../hooks/useReducedMotion'
import useCurtainClock, { curtainProgress } from '../hooks/useCurtainClock'
import Curtain from './Curtain'
import Cursor from './Cursor'
import SplitChars from './SplitChars'
import Wave from './Wave'
import useCardFeel from '../hooks/useCardFeel'
import SiteFooter from './SiteFooter'
import Header from './Header'

export default function Preorder() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [initial] = useState(readPreorderSession)
  const [draft, setDraft] = useState(initial.draft)
  const [pending, setPending] = useState(initial.pending)
  const [receipt, setReceipt] = useState(initial.receipt)
  const [errors, setErrors] = useState<Partial<Record<PreorderField, string>>>({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(initial.pending ? 'Đăng ký này chưa nhận được xác nhận. Gửi lại để kiểm tra, không tạo trùng.' : '')
  const [saved, setSaved] = useState(true)
  const busy = useRef(false)
  const startedAt = useRef(Date.now())
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const clock = useCurtainClock()
  const curtainOpen = ready || clock.expired
  const [opening, setOpening] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  useCardFeel(root, unlocked)
  const onOpen = useCallback(() => setOpening(true), [])
  const onComplete = useCallback(() => setUnlocked(true), [])
  const amount = totals(draft.quantity)
  const locked = sending || !!pending
  const changeField = (name: PreorderField, value: string) => {
    setDraft(draft => ({ ...draft, [name]: value }))
    setErrors(errors => ({ ...errors, ...(name in errors ? { [name]: fieldError(name, value) } : {}) }))
  }
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy.current || receipt) return
    if (pending && Date.now() - pending.startedAt > 7 * 86400000) {
      setSendError('Đăng ký này đã chờ xác nhận quá lâu. Vui lòng liên hệ nhóm để kiểm tra trước khi gửi mới.')
      return
    }
    if (!pending) {
      const nextErrors = preorderErrors(draft)
      setErrors(nextErrors)
      const first = contactFields.find(field => nextErrors[field.name])?.name
      if (first) { requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()); return }
    }
    const request: PreorderRequest = pending ?? {
      ...draft, name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim(), note: draft.note.trim(),
      requestId: crypto.randomUUID(), startedAt: startedAt.current,
      company: String(new FormData(event.currentTarget).get('company') || ''),
    }
    busy.current = true
    setPending(request)
    setSending(true)
    setSendError('')
    // Persist the retry id before sending, including if the tab reloads before its acknowledgement.
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, draft, pending: request, receipt: null })) } catch { setSaved(false) }
    try {
      const accepted = await submitPreorder(request)
      setReceipt(accepted)
      setDraft({ ...emptyDraft })
      setPending(null)
      try { sessionStorage.removeItem('thuy-tran.checkout.v1') } catch { /* Current in-memory receipt remains usable. */ }
    } catch (error) {
      if (error instanceof PreorderSubmissionError && error.definitive) setPending(null)
      setSendError(error instanceof Error ? error.message : 'Chưa xác nhận được đăng ký. Bạn thử gửi lại nhé.')
    } finally { busy.current = false; setSending(false) }
  }
  const clearDraft = () => {
    if (locked) return
    setDraft({ ...emptyDraft })
    setReceipt(null)
    setErrors({})
    setSendError('')
    startedAt.current = Date.now()
    try { sessionStorage.removeItem('thuy-tran.checkout.v1') } catch { /* Storage can be unavailable. */ }
  }

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.delete('step')
    history.replaceState(null, '', url)
  }, [])

  useEffect(() => {
    try {
      if (pending || receipt || draft.quantity !== 1 || contactFields.some(({ name }) => draft[name])) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, draft, pending, receipt }))
      } else sessionStorage.removeItem(DRAFT_KEY)
      setSaved(true)
    } catch { setSaved(false) }
  }, [draft, pending, receipt])

  useEffect(() => {
    if (!unlocked || !receipt) return
    const heading = root.current?.querySelector<HTMLElement>('#po-receipt-title')
    heading?.focus({ preventScroll: true })
    if (heading && (heading.getBoundingClientRect().top < 24 || window.innerWidth <= 900)) {
      root.current?.querySelector('.po-order')?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.po-receipt', { y: 16, rotation: -1 }, { y: 0, rotation: 0, duration: 0.4, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [receipt, unlocked, reduced])

  useEffect(() => {
    document.title = 'Đặt trước — Thủy Trận'
    let cancelled = false
    // Nothing here blocks the page: errors fall through and the curtain opens by itself at the time limit.
    preloadAssets((value) => { if (!cancelled) setProgress(value) }, 'preorder')
      .then(() => {
        if (cancelled) return
        return Promise.all(Array.from(root.current!.querySelectorAll('img'), (image) => image.decode()))
      })
      .catch(() => undefined)
      .then(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

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
      <Curtain ready={curtainOpen} progress={curtainProgress(progress, clock.fraction, curtainOpen)}
        onOpen={onOpen} onComplete={onComplete} />
      <div className="po-content" inert={!unlocked} aria-hidden={!unlocked}>
        <Cursor />
        <Header />
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
            <h2 id="order-title" className="display">Phiếu ra quân.</h2>
            <p className="po-stamp display">Đặt<br />trước</p>
            {receipt ? <div className="po-receipt">
              <p className="po-received-mark" aria-hidden="true">◆</p>
              <h3 id="po-receipt-title" className="display" tabIndex={-1}>Đã nhận đăng ký.</h3>
              <p className="po-intro">Nhóm Thủy Trận sẽ liên hệ qua số điện thoại bạn đã gửi để xác nhận và hẹn ngày giao.</p>
              <dl className="po-totals"><div><dt>Mã đăng ký</dt><dd className="po-reference">{receipt.reference}</dd></div>
                <div><dt>Số bộ</dt><dd>{receipt.quantity}</dd></div>
                <div><dt>Tạm tính</dt><dd>{priceLabel(receipt.subtotal)}</dd></div>
                <div><dt>Thanh toán</dt><dd>Chưa thu tiền</dd></div></dl>
              <div className="po-actions"><a className="hero-cta po-submit" href="https://www.facebook.com/daugiaothoi" target="_blank" rel="noopener noreferrer"><span>Liên hệ nhóm</span><span className="nav-diamond" aria-hidden="true" /></a>
                <button className="po-reset" type="button" onClick={clearDraft}>Đăng ký thêm</button></div>
            </div> : <form noValidate onSubmit={submit} aria-busy={sending}>
              <p className="po-intro">Nhóm sẽ liên hệ xác nhận đăng ký. Bạn chưa cần thanh toán.</p>
              <div className="po-product"><img src={cover} alt="Hộp board game Thủy Trận" loading="eager" decoding="async" />
                <div><h4 className="display">{sales.product}</h4><p>{priceLabel(sales.unitPrice)} / bộ</p></div></div>
              <fieldset className="po-quantity" disabled={locked}>
                <legend>Số bộ game</legend><div>
                  <button type="button" aria-label="Giảm số bộ game" disabled={locked || draft.quantity === 1} onClick={() => setDraft(draft => ({ ...draft, quantity: draft.quantity - 1 }))}>−</button>
                  <output aria-live="polite" aria-label="Số bộ đã chọn"><strong key={draft.quantity}>{String(draft.quantity).padStart(2, '0')}</strong></output>
                  <button type="button" aria-label="Tăng số bộ game" disabled={locked || draft.quantity === 99} onClick={() => setDraft(draft => ({ ...draft, quantity: draft.quantity + 1 }))}>+</button>
                </div>
              </fieldset>
              {contactFields.filter(field => field.name !== 'note').map((field, i) => <label className="po-field" key={field.name}>
                <span className="po-field-label"><span className="po-field-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{field.label}
                  {!field.optional && <span className="po-required" aria-hidden="true">*</span>}</span>
                {field.optional && <span className="po-optional">Tùy chọn</span>}
                <input name={field.name} type={field.type ?? 'text'} autoComplete={field.autoComplete} maxLength={field.maxLength}
                    value={draft[field.name]} readOnly={locked} required={!field.optional} placeholder={field.placeholder} aria-invalid={!!errors[field.name]} aria-describedby={`po-${field.name}-error`}
                    onChange={event => changeField(field.name, event.target.value)} onBlur={event => setErrors(errors => ({ ...errors, [field.name]: fieldError(field.name, event.target.value) }))} />
                <span id={`po-${field.name}-error`} className="po-error" aria-live="polite">{errors[field.name]}</span>
              </label>)}
              <details className="po-note-toggle"><summary>Thêm lời nhắn <span>(tùy chọn)</span></summary>
                <label className="po-field"><span className="po-field-label">Lời nhắn</span>
                  <textarea name="note" autoComplete="off" maxLength={500} rows={2} value={draft.note} readOnly={locked}
                    aria-invalid={!!errors.note} aria-describedby="po-note-error" placeholder="Bạn muốn nhắn gì cho nhóm?"
                    onChange={event => changeField('note', event.target.value)} />
                  <span id="po-note-error" className="po-error" aria-live="polite">{errors.note}</span>
                </label>
              </details>
              <label className="po-trap" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" maxLength={100} /></label>
              <dl className="po-totals"><div><dt>Tạm tính · {draft.quantity} bộ <small>Chưa gồm phí giao hàng</small></dt><dd>{priceLabel(amount.subtotal)}</dd></div></dl>
              <div className="po-actions"><button className="hero-cta po-submit" type="submit" disabled={sending}>
                <span className="hero-cta-label">{sending ? 'Đang gửi đăng ký…' : pending ? 'Gửi lại đăng ký' : 'Đăng ký đặt trước'}</span><span className="nav-diamond" aria-hidden="true" /></button></div>
              {sendError && <div className="po-send-error" role="alert"><p>{sendError}</p><a href="https://www.facebook.com/daugiaothoi" target="_blank" rel="noopener noreferrer">Liên hệ nhóm qua Facebook</a></div>}
              <p className="po-status" role="status">{sending ? 'Đang gửi, bạn giữ trang này mở nhé.' : 'Chưa thu tiền khi đăng ký.'}</p>
              {!saved && <p className="po-draft-status">Trình duyệt không lưu được nháp. Giữ trang mở đến khi nhận xác nhận.</p>}
              {!locked && (draft.name || draft.phone || draft.email || draft.note || draft.quantity !== 1) && <button className="po-reset" type="button" onClick={clearDraft}>Xóa nháp</button>}
            </form>}
          </section>
        </div>
        <div className="po-wave" aria-hidden="true"><Wave fill="var(--color-ink)" /></div>
        <div className="po-footer-area"><SiteFooter /></div>
      </div>
    </main>
  )
}
