// Isolated browser transport simulation. No network requests or Google writes.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'
import ts from 'typescript'
import { validReceipt } from '../src/data/checkout.ts'

const source = ts.transpileModule(fs.readFileSync(new URL('../src/submitPreorder.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
let listener, timer, frame, appended = 0, removed = 0
const context = vm.createContext({ exports: {}, crypto, URL,
  require: name => name.includes('checkout') ? { validReceipt } : { preorderEndpoint: '' },
  setTimeout: callback => { timer = callback; return 1 }, clearTimeout: () => { timer = null },
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
check((await promise).reference === receipt.reference && !listener && !timer && removed === 1, 'Success requires a valid acknowledgement and cleans up the frame')
const timeout = submit(request, endpoint).catch(error => error)
timer()
check(!(await timeout).definitive && !listener && removed === 2, 'Timeout remains uncertain so the same request can safely retry')
const rejected = submit(request, endpoint).catch(error => error)
const secondNonce = new URL(frame.src).searchParams.get('nonce')
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_READY', nonce: secondNonce } })
listener({ origin, source: bridge, data: { type: 'TT_PREORDER_RESULT', nonce: secondNonce, result: { ok: false, code: 'invalid' } } })
check((await rejected).definitive && !listener, 'A definitive validation rejection allows editing')
console.log(`Preorder transport: ${checks} checks passed; no external writes.`)
