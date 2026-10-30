import { useEffect, useRef, useState } from 'react'

/** Longest the loading curtain may stay closed, counted from navigation start so a slow script download uses it up too. */
export const curtainLimit = 10000
/** Time reserved inside the limit for mounting the page and playing the opening animation. */
const openingReserve = 4000
/** Even when the limit has already passed (e.g. a very slow script), keep the curtain long enough to open smoothly. */
const minimumGrace = 1500

/**
 * Shared by every page's curtain: to have the page open by `curtainLimit`, it starts opening with whatever has
 * loaded a little earlier, and `fraction` lets the progress bar keep moving instead of parking at the last real step.
 */
export default function useCurtainClock() {
  const deadline = useRef<number>(Math.max(curtainLimit - openingReserve, performance.now() + minimumGrace))
  const [fraction, setFraction] = useState(() => Math.min(1, performance.now() / deadline.current))
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const remaining = Math.max(0, deadline.current - performance.now())
    const timeout = setTimeout(() => { setFraction(1); setExpired(true) }, remaining)
    const interval = setInterval(() => setFraction(Math.min(1, performance.now() / deadline.current)), 200)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [])

  return { expired, fraction }
}

/** Real progress, but never parked: the clock nudges it forward and only opening reaches 100%. */
export function curtainProgress(real: number, fraction: number, open: boolean) {
  return open ? 1 : Math.min(0.99, Math.max(real, fraction * 0.95))
}
