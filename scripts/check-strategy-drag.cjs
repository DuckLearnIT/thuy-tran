// Run: node scripts/check-strategy-drag.cjs
// Exercise the component's actual input handlers without a browser.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const refs = []
const jsx = (type, props) => ({ type, props })
const st = { start: 100, end: 850, progress: 0, isActive: true }
const window = { scrollY: 100, scrollTo({ top }) { this.scrollY = top } }
const moduleMock = { exports: {} }
const mocks = {
  react: { useRef: value => { const ref = { current: value }; refs.push(ref); return ref }, useState: value => [value, () => {}], useLayoutEffect: () => {} },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  gsap: {}, 'gsap/ScrollTrigger': {},
  '../data/strategies': { strategies: Array.from({ length: 7 }, (_, id) => ({ id, name: `Card ${id}`, bg: '#000', fg: '#fff', lines: [] })) },
  '../hooks/useReducedMotion': { default: () => false, __esModule: true },
  '../hooks/useCompactChapters': { default: () => false, __esModule: true },
}
const source = fs.readFileSync('src/components/Strategies.tsx', 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
vm.runInNewContext(js, { module: moduleMock, exports: moduleMock.exports, require: name => mocks[name], window })
const tree = moduleMock.exports.default()
refs[1].current = st
const find = node => node?.props?.className?.startsWith('ks-browse ') ? node.props
  : [node?.props?.children].flat().filter(Boolean).map(find).find(Boolean)
const stage = find(tree)
assert.ok(stage, 'Interactive card stage exists')
let captured = false
const target = { clientWidth: 1000, setPointerCapture() { captured = true }, hasPointerCapture() { return captured }, releasePointerCapture() { captured = false } }
const event = (x, y) => ({ button: 0, clientX: x, clientY: y, pointerId: 1, currentTarget: target })
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(150, 200))
assert.equal(window.scrollY, 200, 'One card-width drag advances one chapter segment')
assert.equal(captured, true, 'Horizontal drag captures its pointer')
stage.onPointerUp(event(150, 200))
assert.equal(window.scrollY, 200, 'Release snaps to the nearest card')
assert.equal(captured, false, 'Release relinquishes pointer capture')
let prevented = false, stopped = false
stage.onClickCapture({ preventDefault() { prevented = true }, stopPropagation() { stopped = true } })
assert.ok(prevented && stopped, 'Drag cannot accidentally click the old card')
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(502, 220))
stage.onPointerMove(event(100, 220))
assert.equal(window.scrollY, 200, 'Vertical gesture stays with native page scrolling')
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(-4000, 200))
assert.equal(window.scrollY, 700, 'Drag cannot skip through the chapter exit')
stage.onPointerCancel()
stage.onPointerMove(event(4000, 200))
assert.equal(window.scrollY, 700, 'Cancelled gesture stops controlling scroll')
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(4000, 200))
assert.equal(window.scrollY, 100, 'Drag clamps at the first card')
stage.onLostPointerCapture()
stage.onPointerDown(event(500, 200))
stage.onPointerLeave()
stage.onPointerMove(event(100, 200))
assert.equal(window.scrollY, 100, 'Returning hover cannot revive an unfinished gesture')
const key = name => ({ key: name, preventDefault() {} })
stage.onKeyDown(key('ArrowRight'))
assert.equal(window.scrollY, 200, 'Arrow key advances from the active card')
stage.onKeyDown(key('ArrowLeft'))
assert.equal(window.scrollY, 100, 'Arrow key clamps at the first card')
st.isActive = false
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(100, 200))
assert.equal(window.scrollY, 100, 'Offscreen stage cannot control scrolling')
console.log('Strategy input checks passed')
