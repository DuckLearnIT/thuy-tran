import { loadFont } from '@remotion/fonts'
import { continueRender, delayRender, staticFile } from 'remotion'

const handle = delayRender('Loading brand fonts')
Promise.all([
  loadFont({ family: 'Yellost', url: staticFile('fonts/yellost.woff2'), weight: '400' }),
  loadFont({ family: 'Futura', url: staticFile('fonts/futura-book.woff2'), weight: '400' }),
  loadFont({ family: 'Futura', url: staticFile('fonts/futura-bold.woff2'), weight: '700' }),
]).then(() => continueRender(handle))
