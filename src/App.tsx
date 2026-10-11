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
import { preloadAssets } from './preloadAssets'
import useCardFeel from './hooks/useCardFeel'

gsap.registerPlugin(ScrollTrigger)
if (typeof window !== 'undefined') {
  ;(window as any).ScrollTrigger = ScrollTrigger
  ;(window as any).gsap = gsap
}

export default function App() {
  const [attempt, setAttempt] = useState(0)
  const [progress, setProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [ready, setReady] = useState(false)
  const [opening, setOpening] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [failed, setFailed] = useState(false)
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
    setFailed(false)
    setProgress(0)
    preloadAssets((value) => { if (!cancelled) setProgress(value * 0.9) })
      .then(() => { if (!cancelled) setAssetsReady(true) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [attempt])

  useEffect(() => {
    if (!assetsReady || !sceneReady) return
    let cancelled = false
    let frame = 0
    Promise.all(Array.from(experience.current!.querySelectorAll('img'), (image) => image.decode()))
      .then(() => {
        if (cancelled) return
        ScrollTrigger.refresh()
        frame = requestAnimationFrame(() => {
          if (cancelled) return
          setProgress(1)
          setReady(true)
        })
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [assetsReady, sceneReady, attempt])

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
      <Curtain ready={ready} progress={progress} failed={failed}
        onRetry={() => setAttempt((value) => value + 1)} onOpen={onOpen} onComplete={onComplete} />
      {assetsReady && (
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
