import assert from 'node:assert/strict'
import { DRAFT_KEY, emptyDraft, fieldError, preorderErrors, readPreorderSession, totals, validReceipt } from '../src/data/checkout.ts'
const storage = new Map()
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null }
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++ }
check(!!fieldError('name', '   ') && !!fieldError('phone', '123'), 'Required contacts reject blank/invalid inputs')
for (const phone of ['0912 345 678', '+84 912-345-678', '024 1234 5678']) check(!fieldError('phone', phone), `Accept Vietnamese contact ${phone}`)
check(!fieldError('note', '') && !!fieldError('note', 'x'.repeat(501)), 'Note is optional and bounded')
check(!fieldError('email', '') && !fieldError('email', 'qa@example.com') && !!fieldError('email', 'broken'), 'Email is optional but validated when present')
check(Object.keys(preorderErrors({ ...emptyDraft, name: 'QA', phone: '0912345678' })).length === 0, 'No delivery address is required')
check(totals(2).subtotal === 1198000 && totals(2).total === null, 'Price is real; unpublished shipping never becomes zero')
storage.set(DRAFT_KEY, '{broken')
check(readPreorderSession().draft.quantity === 1, 'Corrupt storage falls back safely')
storage.clear()
storage.set('thuy-tran.checkout.v1', JSON.stringify({ version: 1, draft: { ...emptyDraft, name: 'Old draft', phone: '0912345678', quantity: 3, address: 'private legacy address' } }))
const restored = readPreorderSession()
check(restored.draft.quantity === 3 && restored.draft.name === 'Old draft' && !('address' in restored.draft), 'Legacy contacts migrate without importing shipping data')
const receipt = { reference: 'TT-20261028-0123456789ab', createdAt: new Date().toISOString(), quantity: 2, unitPrice: 599000, subtotal: 1198000 }
check(validReceipt(receipt) && !validReceipt({ ...receipt, subtotal: 0 }), 'Receipt totals must match the server price')
storage.set(DRAFT_KEY, JSON.stringify({ version: 2, draft: emptyDraft, receipt, pending: null }))
check(readPreorderSession().receipt?.reference === receipt.reference, 'Reload retains the acknowledged registration')
globalThis.sessionStorage = { getItem() { throw Error('blocked') } }
check(readPreorderSession().draft.quantity === 1, 'Blocked storage keeps the form usable')
console.log(`Preorder data: ${checks} checks passed.`)
