// Copies the site's artwork, fonts and standee models into trailer/public so the
// trailer reads the same files as the website without duplicating them in Git.
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, '..')
const out = join(root, 'public')

const copy = (from, to) => {
  mkdirSync(dirname(join(out, to)), { recursive: true })
  cpSync(join(site, from), join(out, to), { recursive: true })
}

copy('src/assets/bia-thuy-tran.webp', 'art/cover.webp')
copy('src/assets/hero/hero-paper.webp', 'art/paper.webp')
copy('src/assets/hero/full-body', 'art/cast')
copy('src/assets/locations', 'art/locations')
copy('src/assets/pieces', 'pieces')
copy('public/fonts/NVN-Yellost-Regular-VH.woff2', 'fonts/yellost.woff2')
copy('src/assets/fonts/SFUFuturaBook.woff2', 'fonts/futura-book.woff2')
copy('src/assets/fonts/SFUFuturaBold.woff2', 'fonts/futura-bold.woff2')
console.log('Synced assets into', out)
