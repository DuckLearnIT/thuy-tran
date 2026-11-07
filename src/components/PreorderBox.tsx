import { useEffect, useRef, useState } from 'react'
import { boxArt, boxPrint } from '../data/box'
import { cards } from '../data/cards'
import type { createPreorderBoxScene } from './preorderBoxScene'

export default function PreorderBox({ open, enabled, reduced, onToggle }: {
  open: boolean; enabled: boolean; reduced: boolean; onToggle: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const controller = useRef<Awaited<ReturnType<typeof createPreorderBoxScene>> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const latest = useRef({ open, reduced }); latest.current = { open, reduced }
  useEffect(() => {
    if (!enabled) return
    const abort = new AbortController()
    let active = true
    let failed = false
    const lost = () => {
      failed = true; controller.current?.dispose(); controller.current = null
      if (active) setStatus('fallback')
    }
    canvas.current!.addEventListener('webglcontextlost', lost, { once: true })
    let starting = false
    const start = () => {
      if (starting || !canvas.current?.clientWidth) return
      starting = true
      import('./preorderBoxScene').then(m => m.createPreorderBoxScene(canvas.current!, abort.signal)).then(scene => {
        if (!active || failed) { scene.dispose(); return }
        controller.current = scene; scene.setOpen(latest.current.open, true); setStatus('ready')
      }).catch(() => { if (active) setStatus('fallback') })
    }
    const observer = new ResizeObserver(start); observer.observe(canvas.current!); start()
    const element = canvas.current!
    return () => {
      active = false; observer.disconnect(); abort.abort(); element.removeEventListener('webglcontextlost', lost)
      controller.current?.dispose(); controller.current = null
    }
  }, [enabled])
  useEffect(() => { controller.current?.setOpen(open, reduced) }, [open, reduced])
  return <div className="po-tableau" data-renderer={status} onPointerMove={event => {
    if (!reduced && event.pointerType === 'mouse') {
      const r = event.currentTarget.getBoundingClientRect()
      controller.current?.tilt((event.clientX - r.left) / r.width - .5)
    }
  }} onPointerLeave={() => { if (!reduced) controller.current?.tilt(0) }}>
    <div className="po-sun" aria-hidden="true" />
    <canvas ref={canvas} className="po-box-canvas" role="img" aria-label={open ? `Hộp mở với sáu nhân vật: ${cards.map(card => card.role).join(', ')}` : 'Hộp Thủy Trận theo thiết kế in mới'} aria-hidden={status !== 'ready'} />
    {status !== 'ready' && <div className="po-box-fallback">
      <img src={boxArt.front} width={boxPrint.frontPixels[0]} height={boxPrint.frontPixels[1]} alt="Bìa hộp Thủy Trận — Bạch Đằng" />
      {open && <div className="po-fallback-hand">{cards.map(card => <img key={card.id} src={card.image} alt={`Nhân vật ${card.role}`} />)}</div>}
    </div>}
    <button className="po-box-toggle" type="button" onClick={onToggle} aria-label={open ? 'Đóng hộp Thủy Trận' : 'Mở hộp Thủy Trận'} aria-expanded={open}>
      <span className="sr-only">{open ? 'Đóng hộp' : 'Mở hộp và xem sáu nhân vật'}</span>
    </button>
  </div>
}
