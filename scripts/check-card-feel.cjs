// Run: node scripts/check-card-feel.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const surface = () => ({ listeners: new Map(), addEventListener(name, fn) { this.listeners.set(name, fn) }, removeEventListener(name) { this.listeners.delete(name) } })
class Element {
  constructor() { this.dataset = {}; this.props = new Map(); this.style = { transform: 'translate3d(64%, 0, -50px)', setProperty: (k, v) => this.props.set(k, v), removeProperty: k => this.props.delete(k) } }
  closest(selector) { return selector === '.card-feel' ? this : this.blocked ? this : null }
  contains(target) { return target === this }
  getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 } }
}
const host = { ...surface(), contains: () => true }, window = surface()
const motion = { ...surface(), matches: false }
let cleanup
const moduleMock = { exports: {} }
const js = ts.transpileModule(fs.readFileSync('src/hooks/useCardFeel.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
vm.runInNewContext(js, { module: moduleMock, exports: moduleMock.exports, require: () => ({ useEffect: fn => { cleanup = fn() } }), window, Element, Node: Element, matchMedia: query => query.includes('reduce') ? motion : { matches: true } })
moduleMock.exports.default({ current: host }, true)
const card = new Element(), event = { target: card, pointerType: 'mouse', clientX: 90, clientY: 10, button: 0 }
const emit = (target, name, value = event) => target.listeners.get(name)(value)
emit(host, 'pointerdown')
emit(host, 'pointermove')
assert.equal(card.dataset.feelPressed, 'true', 'Press feedback survives a first move without a preceding hover')
assert.equal(card.dataset.feelHover, 'true', 'Fine pointer lifts the card')
assert.ok(card.props.get('--feel-rotation'), 'Pointer position tilts the card')
assert.equal(card.style.transform, 'translate3d(64%, 0, -50px)', 'Scroll transform is never overwritten')
emit(window, 'pointerup')
assert.equal(card.dataset.feelPressed, undefined, 'Release rebounds without swallowing clicks')
emit(window, 'scroll')
assert.equal(card.dataset.feelHover, undefined, 'Native scrolling clears stale tilt')
card.blocked = true
emit(host, 'pointermove')
assert.equal(card.dataset.feelHover, undefined, 'Inert or dragging cards do not tilt')
card.blocked = false
motion.matches = true
emit(host, 'pointermove')
assert.equal(card.dataset.feelHover, undefined, 'Reduced motion skips physical movement')
motion.matches = false
emit(host, 'pointermove')
cleanup()
assert.equal(card.dataset.feelHover, undefined)
assert.equal(host.listeners.size + window.listeners.size + motion.listeners.size, 0, 'Unmount removes all listeners')
console.log('Card feedback checks passed')
