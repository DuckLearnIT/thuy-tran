// Isolated browser transport simulation. No network requests or Google writes.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'
import ts from 'typescript'
import { validReceipt } from '../src/data/checkout.ts'

const source = ts.transpileModule(fs.readFileSync(new URL('../src/submitPreorder.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
let listener, frame, appended = 0, removed = 0
const timers = {}
const posts = []
let postReply = () => Promise.resolve({ json: async () => ({}) })
const context = vm.createContext({ exports: {}, crypto, URL,
  require: name => name.includes('checkout') ? { validReceipt } : { preorderEndpoint: '' },
  setTimeout: (callback, delay) => { timers[delay] = callback; return delay }, clearTimeout: id => { delete timers[id] },
  fetch: (url, options) => { posts.push({ url, options }); return postReply() },
  window: { addEventListener: (_, callback) => { listener = callback }, removeEventListener: () => { listener = null } },
  document: { createElement: () => { frame = { addEventListener() {}, remove() { removed++ } }; return frame },
    body: { append() { appended++ } } },
})
vm.runInContext(source, context)
const submit = context.exports.submitPreorder
const endpoint = 'https://script.google.com/macros/s/UNIT_TEST_ONLY/exec'
const origin = 'https://n-example-script.googleusercontent.com'
const request = { name: 'QA', phone: '0912345678', email: '', quantity: 2, note: '', company: '', startedAt: Date.now() - 2000, requestId: crypto.randomUUID() }
const receipt = { reference: 'TT-20261028-0123456789ab', createdAt: new Date().toISOString(), quantity: 2, unitPrice: 599000, subtotal: 1198000 }
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++ }
await assert.rejects(submit(request, 'https://example.com/collect')); checks++
check(appended === 0, 'Invalid endpoint never creates an outbound frame')
const promise = submit(request, endpoint)
const nonce = new URL(frame.src).searchParams.get('nonce')
check(!frame.src.includes(request.phone) && !frame.src.includes(request.name), 'URL carries no personal information')
let sends = 0
const bridge = { postMessage(data, target) { sends++; check(target === origin && data.request.requestId === request.requestId, 'Payload reaches only the acknowledged bridge origin') } }
listener({ origin: 'https://attacker.example', source: bridge, data: { type: 'TT_PREORDER_READY', nonce } })
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_READY', nonce: 'wrong' } })
check(sends === 0, 'Foreign origins and nonces cannot receive the payload')
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_READY', nonce } })
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_READY', nonce } })
check(sends === 1, 'Repeated ready messages do not send twice')
listener({ origin, source: {}, data: { type: 'TT_PREORDER_RESULT', nonce, result: { ok: true, receipt } } })
check(!!listener, 'A different window cannot acknowledge the registration')
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_RESULT', nonce, result: { ok: true, receipt } } })
check((await promise).reference === receipt.reference && !listener && !timers[30000] && !timers[6000] && removed === 1, 'Success requires a valid acknowledgement and cleans up the frame')
const timeout = submit(request, endpoint).catch(error => error)
timers[30000]()
check(!(await timeout).definitive && !listener && removed === 2, 'Timeout remains uncertain so the same request can safely retry')
const rejected = submit(request, endpoint).catch(error => error)
const secondNonce = new URL(frame.src).searchParams.get('nonce')
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_READY', nonce: secondNonce } })
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_RESULT', nonce: secondNonce, result: { ok: false, code: 'invalid' } } })
check((await rejected).definitive && !listener, 'A definitive validation rejection allows editing')

// Anonymous POST fallback for browsers signed in to several Google accounts (the bridge page never loads).
posts.length = 0
let fallbackOk = submit(request, endpoint)
check(posts.length === 0 && !!timers[6000], 'The POST waits for the bridge before it is used')
postReply = () => Promise.resolve({ json: async () => ({ ok: true, receipt }) })
timers[6000]()
check((await fallbackOk).reference === receipt.reference && !listener && !timers[30000] && !timers[6000], 'POST success resolves and cleans up')
check(posts.length === 1 && posts[0].url === endpoint && posts[0].options.method === 'POST' && posts[0].options.credentials === 'omit'
  && posts[0].options.headers['Content-Type'].startsWith('text/plain') && JSON.parse(posts[0].options.body).requestId === request.requestId,
'POST is anonymous, preflight-free and carries the same request id')
check(!posts[0].url.includes(request.phone) && !posts[0].url.includes(request.name), 'POST URL carries no personal information')
postReply = () => Promise.resolve({ json: async () => ({ ok: false, code: 'rate_limit' }) })
const limited = submit(request, endpoint).catch(error => error)
timers[6000]()
check((await limited).definitive, 'A definitive POST rejection is reported like a bridge rejection')
postReply = () => Promise.reject(new TypeError('Failed to fetch'))
const offline = submit(request, endpoint).catch(error => error)
timers[6000]()
await new Promise(resolve => setImmediate(resolve))
check(!!listener && !!timers[30000], 'A failed POST leaves the request pending for the bridge or the retryable timeout')
timers[30000]()
check(!(await offline).definitive && !listener, 'Failure after a failed POST stays retryable')
postReply = () => Promise.resolve({ json: async () => ({ ok: true, receipt }) })
const both = submit(request, endpoint)
const bothNonce = new URL(frame.src).searchParams.get('nonce')
timers[6000]()
const bothReceipt = await both
listener?.({ origin, source: bridge, data: { type: 'TT_PREORDER_RESULT', nonce: bothNonce, result: { ok: true, receipt } } })
check(bothReceipt.reference === receipt.reference && !listener, 'A late bridge answer after the POST changes nothing')
console.log(`Preorder transport: ${checks} checks passed; no external writes.`)
