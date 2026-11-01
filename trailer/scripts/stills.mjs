// Bundles once and renders key frames for review: node scripts/stills.mjs 40 120 300
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const frames = process.argv.slice(2).map(Number)
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts') })
const composition = await selectComposition({ serveUrl, id: 'Trailer', chromiumOptions: { gl: 'angle' } })
mkdirSync(join(root, 'out/stills'), { recursive: true })
for (const frame of frames) {
  const output = join(root, `out/stills/f${String(frame).padStart(3, '0')}.jpg`)
  await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, chromiumOptions: { gl: 'angle' } })
  console.log('rendered', output)
}
