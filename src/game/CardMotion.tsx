import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export type FlightRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>

export type CardMotion = {
  id: number
  kind: 'strategy' | 'flood' | 'deal' | 'share' | 'discard' | 'stack'
  front: string
  back: string
  from: FlightRect
  to: FlightRect
  delay?: number
}

type CardMotionProps = {
  motion: CardMotion | null
  onComplete?: () => void
}

const finishRotation = (kind: CardMotion['kind']) => (kind === 'stack' ? 180 : kind === 'discard' || kind === 'share' ? 0 : 360)

export default function CardMotion({ motion, onComplete }: CardMotionProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onComplete)
  const completedId = useRef<number | null>(null)

  callbackRef.current = onComplete

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    const current = motion
    if (!outer || !inner || !current) return

    let finished = false
    const complete = () => {
      if (finished || completedId.current === current.id) return
      finished = true
      completedId.current = current.id
      callbackRef.current?.()
    }

    const { from, to } = current
    const endRotation = finishRotation(current.kind)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const initialRotation = current.kind === 'discard' || current.kind === 'share' ? 0 : 180
    const rotation = current.kind === 'discard' ? -2 : 2

    gsap.set(outer, {
      left: from.left,
      top: from.top,
      width: from.width,
      height: from.height,
      x: 0,
      y: 0,
      rotation: 0,
    })
    gsap.set(inner, { rotationY: initialRotation })

    if (reduced) {
      gsap.set(outer, {
        x: to.left - from.left,
        y: to.top - from.top,
        width: to.width,
        height: to.height,
        rotation: 0,
      })
      gsap.set(inner, { rotationY: endRotation })
      complete()
      return
    }

    const timeline = gsap.timeline({ delay: current.delay ?? 0, onComplete: complete })
    timeline.to(outer, {
      x: to.left - from.left,
      y: to.top - from.top,
      width: to.width,
      height: to.height,
      rotation,
      duration: current.kind === 'stack' ? 0.25 : 0.62,
      ease: 'power2.inOut',
    }, 0)
    timeline.to(inner, {
      rotationY: endRotation,
      duration: current.kind === 'stack' ? 0.2 : 0.6,
      ease: 'power1.inOut',
    }, 0.04)

    return () => {
      timeline.kill()
    }
  }, [motion?.id])

  if (!motion) return null

  return (
    <div
      ref={outerRef}
      className="wg-flight"
      data-kind={motion.kind}
      data-flight={motion.id}
      aria-hidden="true"
      style={{
        left: motion.from.left,
        top: motion.from.top,
        width: motion.from.width,
        height: motion.from.height,
      }}
    >
      <div ref={innerRef} className="wg-flight-paper">
        <img className="wg-flight-face wg-flight-front" src={motion.front} alt="" draggable={false} />
        <img className="wg-flight-face wg-flight-back" src={motion.back} alt="" draggable={false} />
      </div>
    </div>
  )
}
