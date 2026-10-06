import { useEffect, type RefObject } from 'react'

/** Individual CSS transforms leave GSAP's scroll transforms untouched. */
export default function useCardFeel(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const host = root.current
    if (!host || !enabled) return
    const fine = matchMedia('(hover: hover) and (pointer: fine)')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let card: HTMLElement | null = null
    let bounds: DOMRect | null = null
    const reset = () => {
      if (card) {
        delete card.dataset.feelHover
        delete card.dataset.feelPressed
        card.style.removeProperty('--feel-rotation')
      }
      card = null
      bounds = null
    }
    const find = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.card-feel') : null
      return target && host.contains(target) && !target.closest('[inert], [data-dragging="true"]') ? target : null
    }
    const move = (event: PointerEvent) => {
      if (motion.matches || !fine.matches || event.pointerType !== 'mouse') return
      const target = find(event)
      if (!target) { reset(); return }
      if (target !== card) { reset(); card = target; bounds = card.getBoundingClientRect() }
      if (!bounds) bounds = target.getBoundingClientRect()
      const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds!.left) / bounds!.width - 0.5))
      const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds!.top) / bounds!.height - 0.5))
      card!.dataset.feelHover = 'true'
      card!.style.setProperty('--feel-rotation', `${-y || 0.001} ${x} 0 ${Math.hypot(x, y) * 9}deg`)
    }
    const press = (event: PointerEvent) => {
      if (event.button !== 0 || motion.matches) return
      const target = find(event)
      if (!target) return
      if (target !== card) { reset(); card = target }
      card.dataset.feelPressed = 'true'
    }
    const release = () => { if (card) delete card.dataset.feelPressed }
    const leave = (event: PointerEvent) => {
      if (card && !(event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) reset()
    }
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerdown', press)
    host.addEventListener('pointerout', leave)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', reset)
    window.addEventListener('scroll', reset, { passive: true })
    window.addEventListener('resize', reset)
    window.addEventListener('blur', reset)
    motion.addEventListener('change', reset)
    return () => {
      reset()
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerdown', press)
      host.removeEventListener('pointerout', leave)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', reset)
      window.removeEventListener('scroll', reset)
      window.removeEventListener('resize', reset)
      window.removeEventListener('blur', reset)
      motion.removeEventListener('change', reset)
    }
  }, [root, enabled])
}
