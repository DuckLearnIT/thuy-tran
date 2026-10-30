// Local checks only: no Google/network writes or real customer data.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import crypto from 'node:crypto'

const rows = [['Mã đăng ký', 'Thời gian', 'Họ và tên', 'Điện thoại', 'Email', 'Số bộ', 'Đơn giá (₫)', 'Tạm tính (₫)', 'Ghi chú khách', 'Trạng thái', 'Thanh toán', 'Ghi chú nhóm', 'Mã chống trùng']]
const cache = new Map()
let configured = true, writable = true, lockAvailable = true, released = 0
const sheet = {
  getLastRow: () => rows.length, getMaxRows: () => 1000,
  getRange(row, col, height = 1, width = 1) {
    return {
      getValue: () => rows[row - 1]?.[col - 1],
      getValues: () => rows.slice(row - 1, row - 1 + height).map(r => r.slice(col - 1, col - 1 + width)),
      setNumberFormat() { if (width !== 1) throw Error('Table formatting must target a single column'); return this },
      setValues(values) { if (!writable) throw Error('unavailable'); rows[row - 1] = values[0] },
      createTextFinder(value) { return { matchEntireCell() { return this }, findNext() {
        const index = rows.findIndex((r, i) => i >= row - 1 && r[col - 1] === value)
        return index < 0 ? null : { getRow: () => index + 1 }
      } } },
    }
  },
}
const context = vm.createContext({
  Date, Number, String, Object,
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => configured ? 'test-sheet' : null }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
  LockService: { getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock() { released++ } }) },
  CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType(type) { this.type = type; return this } }) },
  JSON,
  Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, text) => [...crypto.createHash('sha256').update(text).digest()],
    formatDate: date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replaceAll('-', '') },
})
vm.runInContext(fs.readFileSync(new URL('../services/preorder/Code.gs', import.meta.url), 'utf8'), context)
const request = () => ({ requestId: crypto.randomUUID(), name: 'QA KHÔNG GỌI', phone: '+84 912 345 678', email: 'qa@example.com', quantity: 2, note: '', company: '', startedAt: Date.now() - 2000 })
const send = value => JSON.parse(JSON.stringify(context.submitPreorder(value)))
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++ }
for (const change of [{ name: '   ' }, { phone: '123' }, { quantity: 0 }, { quantity: 100 }, { quantity: 1.5 }, { email: 'broken' },
  { company: 'bot' }, { note: 'x'.repeat(501) }, { requestId: 'guess' }, { startedAt: Date.now() + 1000 }]) {
  check(send({ ...request(), ...change }).code === 'invalid', 'Malformed requests must not append')
}
check(rows.length === 1, 'Rejected requests leave the sheet empty')
const first = request()
const accepted = send({ ...first, unitPrice: 1, subtotal: 1, status: 'Đã thanh toán' })
check(accepted.ok && rows.length === 2, 'One valid request appends exactly one row')
check(accepted.receipt.unitPrice === 599000 && accepted.receipt.subtotal === 1198000, 'Server owns the price and subtotal')
check(rows[1][3] === '0912345678' && typeof rows[1][3] === 'string', 'Phone remains normalized text with its leading zero')
check(rows[1][9] === 'Chờ liên hệ' && rows[1][10] === 'Chưa thanh toán', 'No payment or fulfillment is implied')
check(rows[1][4] === 'qa@example.com', 'Email is stored for the team without sending mail')
const retry = send(first)
check(retry.ok && retry.receipt.reference === accepted.receipt.reference && rows.length === 2, 'Retry acknowledges the same row without duplicating')
check(!JSON.stringify(retry).includes(first.name) && !JSON.stringify(retry).includes('0912345678'), 'Acknowledgements do not expose customer fields')
check(send(request()).code === 'rate_limit' && rows.length === 2, 'A new id cannot immediately spam the same phone')
cache.clear()
const injection = send({ ...request(), name: '=IMPORTXML("https://example.com","x")', note: '@SUM(1)' })
check(injection.ok && rows[2][2].startsWith("'=") && rows[2][8].startsWith("'@"), 'Untrusted text never becomes a spreadsheet formula')
writable = false; cache.clear()
check(send(request()).code === 'retry', 'Write failures must never report success')
writable = true; configured = false
check(send(request()).code === 'retry', 'Missing sheet configuration must never report success')
configured = true; lockAvailable = false
check(send(request()).code === 'retry', 'Concurrent lock pressure is retryable')
check(released >= 6, 'Acquired locks release on success, rejection and exception')
// Anonymous POST path (browsers signed in to several Google accounts).
lockAvailable = true; cache.clear()
const post = body => { const out = context.doPost({ postData: { contents: body } }); return { type: out.type, json: JSON.parse(out.text) } }
const viaPost = request()
const posted = post(JSON.stringify(viaPost))
check(posted.type === 'json' && posted.json.ok && rows.length === 4, 'POST appends one row and answers with JSON')
const postedAgain = post(JSON.stringify(viaPost))
check(postedAgain.json.ok && postedAgain.json.receipt.reference === posted.json.receipt.reference && rows.length === 4, 'POST retry (also after the bridge) acknowledges the same row')
check(post('not json').json.code === 'invalid' && post('').json.code === 'invalid' && post('x'.repeat(4001)).json.code === 'invalid', 'POST rejects malformed or oversized bodies')
check(JSON.parse(context.doPost({}).text).code === 'invalid', 'POST without a body is rejected')
check(post(JSON.stringify({ ...request(), company: 'bot' })).json.code === 'invalid' && rows.length === 4, 'POST honours the honeypot and validation')
check(!JSON.stringify(posted.json).includes('QA KHÔNG GỌI'), 'POST replies expose no customer fields')
console.log(`Preorder backend: ${checks} checks passed; no external writes.`)
