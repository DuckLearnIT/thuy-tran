import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Header from './components/Header'
import Cover from './components/Cover'
import Manifesto from './components/Manifesto'
import Roles from './components/Roles'
import Strategies from './components/Strategies'
import Locations from './components/Locations'
import MatchStory from './components/MatchStory'
import Finale from './components/Finale'
import Curtain from './components/Curtain'
import Cursor from './components/Cursor'
import { preloadAssets, streamRemainingArt } from './preloadAssets'
import useCardFeel from './hooks/useCardFeel'
import useCurtainClock, { curtainProgress } from './hooks/useCurtainClock'

gsap.registerPlugin(ScrollTrigger)
if (typeof window !== 'undefined') {
  ;(window as any).ScrollTrigger = ScrollTrigger
  ;(window as any).gsap = gsap
}

export default function App() {
  const [progress, setProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [ready, setReady] = useState(false)
  const [opening, setOpening] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const clock = useCurtainClock()
  const experience = useRef<HTMLDivElement>(null)
  useCardFeel(experience, unlocked)
  const onSceneReady = useCallback(() => setSceneReady(true), [])
  const onOpen = useCallback(() => setOpening(true), [])
  const onComplete = useCallback(() => setUnlocked(true), [])

  useLayoutEffect(() => {
    if (unlocked) return
    const htmlOverflow = document.documentElement.style.overflow
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const stopScroll = (event: Event) => event.preventDefault()
    const stopKeys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('button')) return
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) event.preventDefault()
    }
    window.addEventListener('wheel', stopScroll, { passive: false })
    window.addEventListener('touchmove', stopScroll, { passive: false })
    window.addEventListener('keydown', stopKeys)
    return () => {
      document.documentElement.style.overflow = htmlOverflow
      document.body.style.overflow = bodyOverflow
      window.removeEventListener('wheel', stopScroll)
      window.removeEventListener('touchmove', stopScroll)
      window.removeEventListener('keydown', stopKeys)
    }
  }, [unlocked])

  useEffect(() => {
    let cancelled = false
    setProgress(0)
    // A failed or slow file never blocks the page: the curtain also opens by itself at the time limit.
    preloadAssets((value) => { if (!cancelled) setProgress(value * 0.9) }, 'landing')
      .catch(() => undefined)
      .then(() => { if (!cancelled) setAssetsReady(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!assetsReady || !sceneReady || clock.expired) return
    let cancelled = false
    let frame = 0
    // Streamed artwork (data-art) swaps its src as files arrive, which would reject a pending decode.
    Promise.all(Array.from(experience.current!.querySelectorAll<HTMLImageElement>('img:not([data-art])'), (image) => image.decode().catch(error => {
      // Optional standee posters must not trap the curtain if a fallback image fails.
      if (!image.closest('.piece-gallery')) throw error
    })))
      .then(() => {
        if (cancelled) return
        ScrollTrigger.refresh()
      })
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return
        frame = requestAnimationFrame(() => { if (!cancelled) setReady(true) })
      })
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [assetsReady, sceneReady, clock.expired])

  // The curtain no longer needs the connection: let the rest of the artwork arrive in scroll order.
  // At the time limit the page mounts first and the curtain opens a couple of frames later, so the heavy
  // scene setup is not competing with the opening animation.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!clock.expired) return
    let inner = 0
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setSettled(true)) })
    const fallback = setTimeout(() => setSettled(true), 600)
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); clearTimeout(fallback) }
  }, [clock.expired])
  const open = ready || settled
  useEffect(() => {
    if (open) streamRemainingArt()
  }, [open])

  useEffect(() => {
    if (!unlocked) return
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      const anchor = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      if (anchor) {
        const trigger = ScrollTrigger.getAll().find((item) => item.pin && (item.trigger === anchor || item.trigger?.contains(anchor)))
        const top = trigger?.start ?? anchor.getBoundingClientRect().top + scrollY
        window.scrollTo(0, top + (trigger && anchor.id === 'van-minh-hoa' ? (trigger.end - trigger.start) * (.96 / 7) : 0))
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [unlocked])

  return (
    <main className="grain relative">
      <Curtain ready={open} progress={curtainProgress(progress, clock.fraction, open)} onOpen={onOpen} onComplete={onComplete} />
      {(assetsReady || clock.expired) && (
        <div ref={experience} className="landing-experience" inert={!unlocked} aria-hidden={!unlocked}>
          <Cursor />
          <Header />
          <Cover playIntro={opening} onReady={onSceneReady} />
          <Manifesto />
          <Roles />
          <Strategies />
          <Locations />
          <section className="landing-match rules-page" aria-labelledby="landing-match-title">
            <header className="landing-match-intro">
              <div>
                <p className="rules-eyebrow">04 — Gameplay cơ bản</p>
                <h2 id="landing-match-title">Hiểu lượt chơi.<br />Cùng ra trận.</h2>
              </div>
              <div className="landing-match-links">
                <a className="match-play match-rules-link" href="?page=cach-choi#chuan-bi">Xem luật đầy đủ <span className="rules-diamond" aria-hidden="true" /></a>
                <a className="rules-text-button" href="#nhan-lenh">Bỏ qua minh họa</a>
              </div>
            </header>
            <MatchStory unlocked={unlocked} landing />
          </section>
          <Finale />
        </div>
      )}
    </main>
  )
}
