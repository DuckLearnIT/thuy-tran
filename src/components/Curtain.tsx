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

// Two identical periods make the horizontal loop seamless.
const waterline = 'M0 18C40 -2 80 -2 120 18S200 38 240 18S320 -2 360 18S440 38 480 18V48H0Z'

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
          <div className="cu-water relative mx-auto mt-7 h-10 w-64 max-w-[calc(100vw-3rem)] overflow-hidden" role="progressbar"
            data-paused={failed || ready}
            aria-label="Nạp tài nguyên" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(progress * 100)}>
            <svg aria-hidden="true" viewBox="0 0 480 48" preserveAspectRatio="none" className="absolute inset-0 size-full text-card/15">
              <path fill="currentColor" d={waterline} />
            </svg>
            <div className="cu-water-current absolute inset-0" style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}>
              <svg aria-hidden="true" viewBox="0 0 480 48" preserveAspectRatio="none" className="cu-water-wave cu-water-wave-back absolute inset-y-0 left-0 h-full w-[200%]">
                <path fill="var(--color-river)" opacity="0.65" transform="translate(0 -4)" d={waterline} />
              </svg>
              <svg aria-hidden="true" viewBox="0 0 480 48" preserveAspectRatio="none" className="cu-water-wave absolute inset-y-0 left-0 h-full w-[200%]">
                <path fill="var(--color-card)" d={waterline} />
              </svg>
            </div>
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
