// Bundles once and renders key frames for review: node scripts/stills.mjs [Museum] 40 120 300
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const id = Number.isNaN(Number(args[0])) ? args.shift() : 'Trailer'
const frames = args.map(Number)
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts') })
const composition = await selectComposition({ serveUrl, id, chromiumOptions: { gl: 'angle' } })
const dir = join(root, 'out/stills', id.toLowerCase())
mkdirSync(dir, { recursive: true })
for (const frame of frames) {
  const output = join(dir, `f${String(frame).padStart(3, '0')}.jpg`)
  await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, chromiumOptions: { gl: 'angle' } })
  console.log('rendered', output)
}
