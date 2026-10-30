import cover from './assets/bia-thuy-tran.webp'
import heroPaper from './assets/hero/hero-paper.webp'
import { cards } from './data/cards'
import { strategies } from './data/strategies'
import { locations } from './data/locations'
import { heroCast } from './data/heroCast'
import { loadImage, preloadedImages, queueBackground } from './assetQueue'
import { curtainLimit } from './hooks/useCurtainClock'

export { preloadedImages }

// What the first screen needs before the curtain can open.
const critical = [cover, heroPaper, ...heroCast.map((person) => person.image)]
// Everything else, in the order the page reaches it: box cards, strategy cards, the 24 tiles, then spiral art.
const background = [
  ...cards.map((card) => card.image),
  ...strategies.map((card) => card.image),
  ...locations.map((card) => card.image),
  ...locations.map((card) => card.back),
  ...locations.map((card) => card.spiralImage),
]
const everything = [...new Set([...critical, ...background])]
const fontFaces = [
  '700 16px "NVN Yellost"',
  '300 16px "Futura"',
  '400 16px "Futura"',
  '500 16px "Futura"',
  '700 16px "Futura"',
  'italic 400 16px "Futura"',
]

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Asset loading timed out')), curtainLimit)
      }),
    ])
  } finally {
    clearTimeout(timer!)
  }
}

/** Streams the remaining art in scroll order; call once the curtain no longer needs the connection. */
export function streamRemainingArt() {
  queueBackground(background)
}

/**
 * `full` decodes every artwork file before resolving (rules and pre-order pages).
 * `landing` waits only for the first screen; the rest is left to `streamRemainingArt`.
 * `preorder` needs just the box cover and the six character cards.
 */
export async function preloadAssets(onProgress: (progress: number) => void, scope: 'full' | 'landing' | 'preorder' = 'full') {
  let completed = 0
  const artwork = scope === 'landing' ? [...new Set(critical)] : scope === 'preorder' ? [cover, ...cards.map((card) => card.image)] : everything
  const total = artwork.length + fontFaces.length
  const track = async (task: Promise<unknown>) => {
    try {
      await withTimeout(task)
    } finally {
      onProgress(++completed / total)
    }
  }
  const results = await Promise.allSettled([
    ...artwork.map((src) => track(loadImage(src))),
    ...fontFaces.map((font) => track(document.fonts.load(font, 'Thủy Trận Bạch Đằng'))),
  ])
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('Some assets could not be prepared')
  }
  await document.fonts.ready
}
