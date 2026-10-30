import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import useReducedMotion from '../hooks/useReducedMotion'

const HOVER = 'a, button, .hand-card, .stack-card'

/** A small diamond that trails the pointer and swells over interactive things. */
export default function Cursor() {
  const el = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !el.current) return
    const mm = gsap.matchMedia()
    mm.add('(hover: hover) and (pointer: fine)', () => {
      const node = el.current!
      gsap.set(node, { opacity: 0 })
      const x = gsap.quickTo(node, 'x', { duration: 0.35, ease: 'power3' })
      const y = gsap.quickTo(node, 'y', { duration: 0.35, ease: 'power3' })
      const move = (e: PointerEvent) => {
        const inspecting = (e.target as HTMLElement).closest('.bx-piece-controls, .piece-inspector, .piece-marker-label, canvas[data-pieces-interactive="true"]')
        gsap.to(node, { opacity: inspecting ? 0 : 1, duration: 0.3, overwrite: 'auto' })
        x(e.clientX)
        y(e.clientY)
      }
      const over = (e: PointerEvent) => {
        const hot = (e.target as HTMLElement).closest(HOVER)
        gsap.to(node, { scale: hot ? 3.4 : 1, rotate: hot ? 225 : 45, duration: 0.5, ease: 'expo.out' })
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerover', over)
      return () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerover', over)
      }
    })
    return () => mm.revert()
  }, [reduced])

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] -ml-1.5 -mt-1.5 size-3 rotate-45 bg-white mix-blend-difference max-lg:hidden"
      style={{ opacity: 0 }}
    />
  )
}
