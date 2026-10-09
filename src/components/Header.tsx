import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import useReducedMotion from '../hooks/useReducedMotion'

const chapters = [
  { id: 'top', label: 'Khởi trận' },
  { id: 'loi-lenh', label: 'Lời lệnh' },
  { id: 'roles', label: 'Sáu nhân vật' },
  { id: 'ke-sach', label: 'Bảy kế sách' },
  { id: 'dia-diem', label: '24 địa điểm' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('top')
  const root = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const scrollProgress = useRef<HTMLDivElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduced = useReducedMotion()

  const clearHover = () => { if (hoverTimer.current !== null) clearTimeout(hoverTimer.current) }
  useEffect(() => () => clearHover(), [])

  useEffect(() => {
    let frame = 0
    let stops: { id: string; top: number }[] = []
    const update = () => {
      frame = 0
      const distance = document.documentElement.scrollHeight - innerHeight
      const progress = distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 0
      if (scrollProgress.current) {
        scrollProgress.current.style.transform = `scaleX(${progress})`
        scrollProgress.current.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
      }
      const position = window.scrollY + innerHeight * 0.28
      setActive(stops.filter((stop) => stop.top <= position).at(-1)?.id ?? 'top')
      if (window.scrollY < 24) setOpen(false)
      // The pinned cover owns the morph; static/reduced-motion pages dock instantly.
      const cover = ScrollTrigger.getAll().find(st => st.pin && st.trigger?.querySelector('#top'))
      const brand = document.querySelector<HTMLElement>('.site-brand')!
      const docked = cover ? (cover.animation?.time() ?? 0) >= 1.4 : window.scrollY > 24
      brand.inert = !docked
      document.querySelector<HTMLElement>('.site-header')!.dataset.docked = String(docked)
      if (!cover) {
        const scale = Math.min(innerWidth * (innerWidth > innerHeight ? 0.78 : 0.9), innerHeight * 0.77, 900) / brand.offsetWidth
        gsap.set('.site-cta, .chapter-nav', { autoAlpha: docked ? 1 : 0 })
        gsap.set(brand, { autoAlpha: 1, scale: docked ? 1 : scale, force3D: false, color: docked ? '#231511' : '#9c2923', '--brand-outline': docked ? '0px' : '0.6px',
          x: docked ? 0 : (innerWidth - brand.offsetWidth * scale) / 2 - brand.offsetLeft,
          y: docked ? 0 : document.querySelector<HTMLElement>('.hero-copy')!.offsetTop - brand.offsetHeight * scale - 16 - brand.offsetTop })
        gsap.set('.site-header', { mixBlendMode: 'normal' })
      }
    }
    const measure = () => {
      stops = [...chapters, { id: 'nhan-lenh' }].flatMap(({ id }) => {
        const target = document.getElementById(id)
        if (!target) return []
        const pin = ScrollTrigger.getAll().find((st) => st.pin && (st.trigger === target || st.trigger?.contains(target)))
        return [{ id, top: pin?.start ?? target.getBoundingClientRect().top + window.scrollY }]
      })
      scroll()
    }
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    measure()
    ScrollTrigger.addEventListener('refresh', measure)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      ScrollTrigger.removeEventListener('refresh', measure)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('resize', measure)
    }
  }, [reduced])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) { clearHover(); setOpen(false) }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const trigger = ScrollTrigger.getAll().find((item) => item.pin && item.trigger === target)
      ?? ScrollTrigger.getAll().find((item) => item.pin && item.trigger?.contains(target))
    const top = trigger?.start ?? target.getBoundingClientRect().top + window.scrollY
    window.history.pushState(null, '', `#${id}`)
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'instant' : 'smooth' })
    clearHover()
    toggle.current?.focus({ preventScroll: true })
    setOpen(false)
  }

  return (
    <>
      <div ref={scrollProgress} className="page-progress" role="progressbar" aria-label="Tiến trình khám phá trang"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} />
      <div inert={open} aria-hidden={open}
        className="site-header fixed inset-x-0 top-0 z-40 flex items-center justify-between px-[clamp(1rem,3vw,2.5rem)] py-4 text-white pointer-events-none">
        <a href="#top" inert onClick={(event) => navigate(event, 'top')}
          className="site-brand pointer-events-auto display !text-2xl !font-bold tracking-[0.04em]">Thủy Trận</a>
        <a href="#nhan-lenh" onClick={(event) => navigate(event, 'nhan-lenh')}
          className="site-cta pointer-events-auto group flex min-h-11 items-center gap-2 text-[0.8rem] font-medium tracking-[0.22em] uppercase">
          <span>Nhận lệnh</span>
          <span aria-hidden="true" className="inline-block size-2 rotate-45 bg-current transition-transform duration-500 group-hover:rotate-[225deg] group-hover:scale-150" />
        </a>
      </div>
    <header ref={root} className="chapter-nav fixed inset-x-0 top-0 z-50 h-9"
      data-open={open} onPointerEnter={(event) => {
        clearHover()
        if (event.pointerType !== 'touch' && !toggle.current?.contains(event.target as Node)) hoverTimer.current = setTimeout(() => setOpen(true), 100)
      }}
      onPointerLeave={(event) => {
        const keyboardFocus = event.currentTarget.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')
        clearHover()
        if (event.pointerType !== 'touch' && !keyboardFocus) hoverTimer.current = setTimeout(() => setOpen(false), 200)
      }}
      onFocus={(event) => {
        clearHover()
        if (event.currentTarget.querySelector('.nav-panel')?.contains(event.target)) setOpen(true)
      }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { clearHover(); setOpen(false) } }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { clearHover(); toggle.current?.focus(); setOpen(false) }
      }}>
      <button ref={toggle} type="button" className="nav-toggle" aria-controls="chapter-menu"
        aria-expanded={open} aria-label={open ? 'Đóng điều hướng' : 'Mở điều hướng'}
        onClick={() => { clearHover(); setOpen((value) => !value) }}>
        <span aria-hidden="true">{open ? '×' : '◆'}</span><span>{open ? 'Đóng' : 'Menu'}</span>
      </button>
      <div id="chapter-menu" className="nav-panel" inert={!open} aria-hidden={!open}>
        <div className="nav-inner">
          <a href="#top" onClick={(event) => navigate(event, 'top')}
            className="nav-brand display !font-bold">Thủy Trận</a>
          <nav aria-label="Điều hướng chính" className="nav-chapters">
            {chapters.map((chapter, index) => (
              <a key={chapter.id} href={`#${chapter.id}`} onClick={(event) => navigate(event, chapter.id)}
                aria-current={active === chapter.id ? 'location' : undefined}
                className="nav-link" style={{ '--nav-order': index } as React.CSSProperties}>
                <span className="nav-marker" aria-hidden="true">◆</span>
                <span className="nav-label">{chapter.label}</span>
              </a>
            ))}
          </nav>
          <a href="#nhan-lenh" onClick={(event) => navigate(event, 'nhan-lenh')} className="nav-cta" aria-current={active === 'nhan-lenh' ? 'location' : undefined}>
            Nhận lệnh <span aria-hidden="true" className="nav-diamond" />
          </a>
        </div>
        <div className="nav-stripe" aria-hidden="true" />
      </div>
    </header>
    </>
  )
}
