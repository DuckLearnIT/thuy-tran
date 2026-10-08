import cover from './assets/bia-thuy-tran.webp'
import heroPaper from './assets/hero/hero-paper.webp'
import { cards } from './data/cards'
import { strategies } from './data/strategies'
import { locations } from './data/locations'
import { heroCast } from './data/heroCast'

// Retain decoded images for both DOM artwork and the WebGL textures.
export const preloadedImages = new Map<string, HTMLImageElement>()

const artwork = [...new Set([cover, heroPaper, ...heroCast.map((person) => person.image), ...cards.map((card) => card.image), ...strategies.map((card) => card.image), ...locations.map((card) => card.image)])]
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
        timer = setTimeout(() => reject(new Error('Asset loading timed out')), 30000)
      }),
    ])
  } finally {
    clearTimeout(timer!)
  }
}

export async function preloadAssets(onProgress: (progress: number) => void) {
  let completed = 0
  const total = artwork.length + fontFaces.length
  const track = async (task: Promise<unknown>) => {
    try {
      await withTimeout(task)
    } finally {
      onProgress(++completed / total)
    }
  }
  const results = await Promise.allSettled([
    ...artwork.map((src) => track((async () => {
      if (preloadedImages.has(src)) return
      const image = new Image()
      image.src = src
      await image.decode()
      preloadedImages.set(src, image)
    })())),
    ...fontFaces.map((font) => track(document.fonts.load(font, 'Thủy Trận Bạch Đằng'))),
  ])
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('Some assets could not be prepared')
  }
  await document.fonts.ready
}
