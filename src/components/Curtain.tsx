import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import SplitChars from './SplitChars'
import Wave from './Wave'
import useReducedMotion from '../hooks/useReducedMotion'

type Props = {
  ready: boolean
  progress: number
  failed: boolean
  onRetry: () => void
  onOpen: () => void
  onComplete: () => void
}

/** The curtain opens only after artwork, fonts and the box scene are prepared. */
export default function Curtain({ ready, progress, failed, onRetry, onOpen, onComplete }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [done, setDone] = useState(false)
  const titleFontReady = document.fonts.check('700 16px "NVN Yellost"', 'Thủy Trận')

  useLayoutEffect(() => {
    if (!ready || !root.current) return
    onOpen()
    if (reduced) {
      setDone(true)
      onComplete()
      return
    }
    const ctx = gsap.context(() => {
      gsap.timeline({ onComplete: () => { setDone(true); onComplete() } })
        .from('.cu .ch', { yPercent: 120, duration: 0.45, ease: 'expo.out', stagger: 0.025 })
        .from('.cu-sub', { opacity: 0, y: 6, duration: 0.3 }, 0.2)
        .to('.cu-inner', { yPercent: -30, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.5)
        .to(root.current, { yPercent: -105, duration: 0.6, ease: 'expo.inOut' }, 0.55)
    }, root)
    return () => ctx.revert()
  }, [ready, reduced, onOpen, onComplete])

  if (done) return null

  return (
    <div ref={root} aria-busy={!ready} className="fixed inset-0 z-[80] bg-vermilion text-card">
      <div className="cu-inner absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="cu display text-[clamp(4rem,14vw,12rem)]"
            style={{ visibility: titleFontReady ? 'visible' : 'hidden' }}>
            <SplitChars text="Thủy Trận" />
          </p>
          <p className="cu-sub mt-4 text-[0.68rem] tracking-[0.4em] uppercase text-card/80" role="status">
            {failed ? 'Chưa tải được tài nguyên' : ready ? 'Ra quân' : 'Đang chuẩn bị thế trận'}
          </p>
          <div className="mx-auto mt-7 h-px w-40 overflow-hidden bg-card/20" role="progressbar"
            aria-label="Nạp tài nguyên" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress * 100)}>
            <div className="h-full origin-left bg-card" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <p className="mt-3 text-xs tabular-nums text-card/70">{Math.floor(progress * 100)}%</p>
          {failed && <button type="button" onClick={onRetry}
            className="mt-5 min-h-11 cursor-pointer border border-card/60 px-6 text-sm hover:bg-card/10">Thử lại</button>}
        </div>
      </div>
      <div className="absolute inset-x-0 top-full -mt-px">
        <Wave fill="#b5362b" flip />
      </div>
    </div>
  )
}
