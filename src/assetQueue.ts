// Shared artwork loader: one request per file, bounded background concurrency, and a way
// for art that is about to be seen to jump the queue.

// Retain decoded images for both DOM artwork and the WebGL textures.
export const preloadedImages = new Map<string, HTMLImageElement>()

const BACKGROUND_SLOTS = 4
const inflight = new Map<string, Promise<HTMLImageElement>>()
const waiting: string[] = []
const failed = new Set<string>()
const listeners = new Map<string, Set<() => void>>()
const idleWaiters: (() => void)[] = []
let active = 0

const settle = (src: string) => {
  listeners.get(src)?.forEach((listener) => listener())
  if (waiting.length === 0 && inflight.size === 0) idleWaiters.splice(0).forEach((resolve) => resolve())
}

function fetchImage(src: string) {
  const request = (async () => {
    const image = new Image()
    image.src = src
    await image.decode()
    preloadedImages.set(src, image)
    return image
  })()
  request.catch(() => failed.add(src)).finally(() => {
    inflight.delete(src)
    settle(src)
  })
  return request
}

function pump() {
  while (active < BACKGROUND_SLOTS && waiting.length) {
    const src = waiting.shift()!
    if (preloadedImages.has(src) || inflight.has(src)) continue
    active++
    const request = fetchImage(src)
    inflight.set(src, request)
    const done = () => { active--; pump() }
    request.then(done, done)
  }
}

/** Loads and decodes now, outside the background limit. Safe to call repeatedly. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const loaded = preloadedImages.get(src)
  if (loaded) return Promise.resolve(loaded)
  const queuedIndex = waiting.indexOf(src)
  if (queuedIndex >= 0) waiting.splice(queuedIndex, 1)
  failed.delete(src)
  let request = inflight.get(src)
  if (!request) {
    request = fetchImage(src)
    inflight.set(src, request)
  }
  return request
}

/** Waits for a file without requesting it; whoever owns the queue decides when it loads. */
export function whenLoaded(src: string): Promise<HTMLImageElement> {
  const loaded = preloadedImages.get(src)
  if (loaded) return Promise.resolve(loaded)
  return new Promise((resolve, reject) => {
    const stop = subscribe(src, () => {
      const image = preloadedImages.get(src)
      if (!image && !failed.has(src)) return
      stop()
      if (image) resolve(image)
      else reject(new Error(`Artwork failed to load: ${src}`))
    })
  })
}

/** Queues files in the given order after the critical set; already-known files are skipped. */
export function queueBackground(sources: string[]) {
  for (const src of sources) {
    if (!preloadedImages.has(src) && !inflight.has(src) && !waiting.includes(src)) waiting.push(src)
  }
  pump()
}

/** Moves art the visitor is about to reach to the front of the background queue. */
export function prioritize(src: string) {
  if (preloadedImages.has(src) || inflight.has(src)) return
  const queuedIndex = waiting.indexOf(src)
  if (queuedIndex > 0) waiting.splice(queuedIndex, 1)
  if (queuedIndex !== 0) waiting.unshift(src)
  pump()
}

/** True once the file is decoded, or has failed and the browser should try for itself. */
export const isSettled = (src: string) => preloadedImages.has(src) || failed.has(src)

export function subscribe(src: string, listener: () => void) {
  let set = listeners.get(src)
  if (!set) listeners.set(src, (set = new Set()))
  set.add(listener)
  return () => { set!.delete(listener) }
}

/** Resolves when nothing is queued or loading; used by QA scripts and tests. */
export function whenBackgroundIdle() {
  if (waiting.length === 0 && inflight.size === 0) return Promise.resolve()
  return new Promise<void>((resolve) => idleWaiters.push(resolve))
}
