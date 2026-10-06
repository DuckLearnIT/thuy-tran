// Run: node scripts/check-location-gestures.cjs
// Execute the real component handlers: vertical/diagonal input must never seek the page.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const refs = [], jsx = (type, props) => ({ type, props })
const window = { scrollY: 100, scrollTo({ top }) { this.scrollY = top } }
const moduleMock = { exports: {} }
const mocks = {
  react: {
    useRef: value => { const ref = { current: value }; refs.push(ref); return ref },
    useState: value => [typeof value === 'function' ? value() : value, () => {}],
    useEffect: () => {}, useLayoutEffect: () => {},
  },
  'react/jsx-runtime': { jsx, jsxs: jsx },
  gsap: {}, 'gsap/ScrollTrigger': {},
  '../data/locations': { locations: Array.from({ length: 24 }, (_, number) => ({ number, name: 'Location', image: '' })) },
  '../hooks/useReducedMotion': { default: () => false, __esModule: true },
}
const source = fs.readFileSync('src/components/Locations.tsx', 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
vm.runInNewContext(js, { module: moduleMock, exports: moduleMock.exports, require: name => mocks[name], window, matchMedia: () => ({ matches: false }) })
const tree = moduleMock.exports.default()
let cancelled = 0
refs[2].current = { start: 100, end: 850, animation: { duration: () => 5.3 }, getTween: () => ({ kill() { cancelled++ } }) }
const find = node => node?.props?.className === 'spiral-scene' ? node.props
  : [node?.props?.children].flat().filter(Boolean).map(find).find(Boolean)
const stage = find(tree)
let captured = false
const target = { clientWidth: 1000, dataset: {}, setPointerCapture() { captured = true }, hasPointerCapture() { return captured }, releasePointerCapture() { captured = false } }
const event = (x, y) => ({ button: 0, clientX: x, clientY: y, pointerId: 1, currentTarget: target })
stage.onPointerDown(event(500, 200))
assert.equal(cancelled, 1, 'A new press immediately cancels an existing automatic snap')
stage.onPointerMove(event(502, 220))
stage.onPointerMove(event(100, 220))
assert.equal(window.scrollY, 100, 'Vertical touch is left to native scrolling')
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(450, 250))
assert.equal(window.scrollY, 100, 'Diagonal movement cannot prematurely capture horizontal drag')
stage.onPointerCancel(event(450, 250))
stage.onPointerDown(event(500, 200))
stage.onPointerLeave()
stage.onPointerMove(event(100, 200))
assert.equal(window.scrollY, 100, 'Re-entering without an active press cannot move the page')
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(150, 200))
assert.ok(captured && window.scrollY > 100, 'Intentional horizontal drag follows the pointer')
stage.onPointerUp(event(150, 200))
assert.equal(captured, false, 'Release relinquishes capture')
stage.onPointerDown(event(500, 200))
stage.onPointerMove(event(150, 200))
const stopped = window.scrollY
stage.onLostPointerCapture(event(150, 200))
stage.onPointerMove(event(100, 200))
assert.equal(window.scrollY, stopped, 'Lost capture cannot leave a stale drag controlling scroll')
assert.equal(target.dataset.dragging, 'false', 'Lost capture clears the dragging feedback')
console.log('Location gesture checks passed')
