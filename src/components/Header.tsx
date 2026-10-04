import { useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import useReducedMotion from '../hooks/useReducedMotion'

const chapters = [
  { id: 'top', label: 'Khởi trận', number: '00' },
  { id: 'loi-lenh', label: 'Lời lệnh', number: '01' },
  { id: 'roles', label: 'Sáu lá lệnh', number: '02' },
  { id: 'ke-sach', label: 'Bảy kế sách', number: '03' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()

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
    toggle.current?.focus({ preventScroll: true })
    setOpen(false)
  }

  return (
    <header className="chapter-nav fixed inset-x-0 top-0 z-50 h-5"
      data-open={open} onPointerEnter={(event) => {
        if (event.pointerType !== 'touch' && !toggle.current?.contains(event.target as Node)) setOpen(true)
      }}
      onPointerLeave={(event) => {
        const keyboardFocus = event.currentTarget.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')
        if (event.pointerType !== 'touch' && !keyboardFocus) setOpen(false)
      }}
      onFocus={(event) => {
        if (event.target !== toggle.current) setOpen(true)
      }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { toggle.current?.focus(); setOpen(false) }
      }}>
      <button ref={toggle} type="button" className="nav-toggle" aria-controls="chapter-menu"
        aria-expanded={open} aria-label={open ? 'Đóng điều hướng' : 'Mở điều hướng'}
        onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">◆</span><span>Menu</span>
      </button>
      <div id="chapter-menu" className="nav-panel" inert={!open} aria-hidden={!open}>
        <div className="nav-inner">
          <a href="#top" onClick={(event) => navigate(event, 'top')}
            className="nav-brand display !font-bold">Thủy Trận</a>
          <nav aria-label="Điều hướng chính" className="nav-chapters">
            {chapters.map((chapter, index) => (
              <a key={chapter.id} href={`#${chapter.id}`} onClick={(event) => navigate(event, chapter.id)}
                className="nav-link" style={{ '--nav-order': index } as React.CSSProperties}>
                <span className="nav-number">{chapter.number}</span>
                <span className="nav-label">{chapter.label}</span>
              </a>
            ))}
          </nav>
          <a href="#nhan-lenh" onClick={(event) => navigate(event, 'nhan-lenh')} className="nav-cta">
            Nhận lệnh <span aria-hidden="true" className="nav-diamond" />
          </a>
        </div>
        <div className="nav-stripe" aria-hidden="true" />
      </div>
    </header>
  )
}
