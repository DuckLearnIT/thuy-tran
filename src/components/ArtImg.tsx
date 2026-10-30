import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ImgHTMLAttributes } from 'react'
import { isSettled, prioritize, subscribe } from '../assetQueue'

// A 1×1 transparent GIF keeps the box (from width/height) while the real file is still loading.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** Image width/height for card art; the attributes only reserve the aspect ratio. */
export const cardSize = { width: 1500, height: 2078 }
export const squareSize = { width: 896, height: 896 }
export const spiralSize = { width: 896, height: 1242 }

export function useImageReady(src: string) {
  return useSyncExternalStore((listener) => subscribe(src, listener), () => isSettled(src), () => false)
}

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  src: string
  width: number
  height: number
}

/**
 * Artwork that streams in after the curtain opens. The box is reserved from the start,
 * the file jumps the queue once it is near the viewport, and late arrivals fade in.
 */
export default function ArtImg({ src, width, height, ...rest }: Props) {
  const ready = useImageReady(src)
  const ref = useRef<HTMLImageElement>(null)
  const waitedFor = useRef<string | null>(null)
  if (!ready) waitedFor.current = src

  useEffect(() => {
    const node = ref.current
    if (ready || !node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        prioritize(src)
        observer.disconnect()
      }
    }, { rootMargin: '200% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [src, ready])

  return (
    <img ref={ref} {...rest} src={ready ? src : BLANK} width={width} height={height}
      style={{ ...rest.style, '--art-ratio': `${width} / ${height}` } as CSSProperties}
      data-art={ready ? (waitedFor.current === src ? 'late' : 'ready') : 'pending'} />
  )
}
