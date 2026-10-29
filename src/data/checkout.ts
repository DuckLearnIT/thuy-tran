export type PreorderField = 'name' | 'phone' | 'email' | 'note'
export type CheckoutDraft = Record<PreorderField, string> & { quantity: number }
export type PreorderRequest = CheckoutDraft & { requestId: string; startedAt: number; company: string }
export type PreorderReceipt = { reference: string; createdAt: string; quantity: number; unitPrice: number; subtotal: number }
export type PreorderSession = { draft: CheckoutDraft; pending: PreorderRequest | null; receipt: PreorderReceipt | null }

export const DRAFT_KEY = 'thuy-tran.preorder.v2'
export const emptyDraft: CheckoutDraft = { quantity: 1, name: '', phone: '', email: '', note: '' }
// VND. Shipping, delivery and bank details remain unpublished; registration takes no payment.
export const sales = {
  product: 'Thủy Trận', unitPrice: 599000,
  shippingFee: null as number | null, deliveryDate: null as string | null,
  bank: null as { name: string; account: string; holder: string } | null,
}
export const contactFields: { name: PreorderField; label: string; autoComplete: string; placeholder: string; maxLength: number; optional?: boolean; type?: string }[] = [
  { name: 'name', label: 'Họ và tên', autoComplete: 'name', placeholder: 'Tên để nhóm tiện liên hệ', maxLength: 100 },
  { name: 'phone', label: 'Số điện thoại', autoComplete: 'tel', placeholder: 'Ví dụ 0912 345 678', maxLength: 30, type: 'tel' },
  { name: 'email', label: 'Email', autoComplete: 'email', placeholder: 'Email của bạn', maxLength: 254, type: 'email', optional: true },
  { name: 'note', label: 'Lời nhắn', autoComplete: 'off', placeholder: 'Bạn muốn nhắn gì cho nhóm?', maxLength: 500, optional: true },
]

export function fieldError(name: PreorderField, value: string): string {
  const text = value.trim()
  const field = contactFields.find(field => field.name === name)!
  if (!text && !field.optional) return `Nhập ${field.label.toLowerCase()}.`
  if (text.length > field.maxLength) return `Tối đa ${field.maxLength} ký tự.`
  if (name === 'phone' && !/^(?:0|\+84)(?:[35789]\d{8}|2\d{9})$/.test(text.replace(/[\s-]/g, ''))) {
    return 'Nhập số Việt Nam hợp lệ, bắt đầu bằng 0 hoặc +84.'
  }
  if (name === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Nhập email hợp lệ, ví dụ ban@example.com.'
  return ''
}

export function preorderErrors(draft: CheckoutDraft) {
  return Object.fromEntries(contactFields.map(({ name }) => [name, fieldError(name, draft[name])]).filter(([, error]) => error)) as Partial<Record<PreorderField, string>>
}

const validDraft = (value: unknown): value is CheckoutDraft => {
  if (!value || typeof value !== 'object') return false
  const draft = value as CheckoutDraft
  return Number.isInteger(draft.quantity) && draft.quantity >= 1 && draft.quantity <= 99
    && contactFields.every(({ name, maxLength }) => typeof draft[name] === 'string' && draft[name].length <= maxLength)
}
export function validReceipt(value: unknown): value is PreorderReceipt {
  if (!value || typeof value !== 'object') return false
  const r = value as PreorderReceipt
  return /^TT-\d{8}-[a-f0-9]{12}$/.test(r.reference) && typeof r.createdAt === 'string' && Number.isFinite(Date.parse(r.createdAt))
    && Number.isInteger(r.quantity) && r.quantity >= 1 && r.quantity <= 99 && Number.isInteger(r.unitPrice) && r.unitPrice > 0 && r.subtotal === r.quantity * r.unitPrice
}

export function readPreorderSession(): PreorderSession {
  const empty = (): PreorderSession => ({ draft: { ...emptyDraft }, pending: null, receipt: null })
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) {
      // Keep useful contact/quantity from the previous sample checkout without collecting its address.
      const old = JSON.parse(sessionStorage.getItem('thuy-tran.checkout.v1') || 'null')?.draft
      return validDraft(old) ? { ...empty(), draft: { quantity: old.quantity, name: old.name, phone: old.phone, email: old.email, note: old.note } } : empty()
    }
    const saved = JSON.parse(raw)
    if (saved?.version !== 2 || !validDraft(saved.draft)) return empty()
    const draft = { quantity: saved.draft.quantity, name: saved.draft.name, phone: saved.draft.phone, email: saved.draft.email, note: saved.draft.note }
    const pending = saved.pending as PreorderRequest | null
    const validPending = validDraft(pending) && typeof pending.company === 'string' && pending.company.length <= 100
      && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(pending.requestId)
      && Number.isFinite(pending.startedAt) && !Object.keys(preorderErrors(pending)).length
    return { draft, pending: validPending ? pending : null, receipt: validReceipt(saved.receipt) ? saved.receipt : null }
  } catch { return empty() }
}

export function priceLabel(value: number | null): string {
  return value === null ? 'Chưa công bố' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export function totals(quantity: number) {
  const subtotal = sales.unitPrice * quantity
  return { subtotal, total: sales.shippingFee === null ? null : subtotal + sales.shippingFee }
}
