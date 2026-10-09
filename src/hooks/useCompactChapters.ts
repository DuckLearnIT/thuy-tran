import { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Short viewports need room to read, rather than a pinned screen of clipped copy.
const query = '(max-height: 560px), (max-width: 1023px) and (max-height: 700px)'

export default function useCompactChapters() {
  const [compact, setCompact] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const media = matchMedia(query)
    const change = () => setCompact(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [compact])
  return compact
}
