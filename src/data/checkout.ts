import addressData from './vietnam-addresses.json'

export const provinces = addressData
export const wardsFor = (province: string) => provinces.find((item) => item.name === province)?.wards ?? []

export type CheckoutStep = '1' | '2' | '3' | 'preview'
export type DeliveryField = 'name' | 'phone' | 'province' | 'ward' | 'address' | 'email' | 'note'
export type CheckoutDraft = Record<DeliveryField, string> & {
  quantity: number
  selected: boolean
}

export const DRAFT_KEY = 'thuy-tran.checkout.v1'
export const emptyDraft: CheckoutDraft = {
  quantity: 1, selected: false, name: '', phone: '', province: '', ward: '', address: '', email: '', note: '',
}

// Amounts are VND. Null means unpublished, including shipping (never implicitly free).
export const sales: {
  product: string
  unitPrice: number | null
  shippingFee: number | null
  deliveryDate: string | null
  bank: { name: string; account: string; holder: string } | null
} = {
  product: 'Thủy Trận', unitPrice: null, shippingFee: null, deliveryDate: null, bank: null,
}

export const deliveryFields: { name: DeliveryField; label: string; autoComplete: string; placeholder: string; maxLength: number; optional?: boolean; type?: string }[] = [
  { name: 'name', label: 'Tên người nhận', autoComplete: 'shipping name', placeholder: 'Họ và tên người nhận', maxLength: 100 },
  { name: 'phone', label: 'Số điện thoại', autoComplete: 'shipping tel', placeholder: 'Số điện thoại nhận hàng', maxLength: 30, type: 'tel' },
  { name: 'province', label: 'Tỉnh / thành phố', autoComplete: 'shipping address-level1', placeholder: 'Chọn tỉnh / thành phố', maxLength: 100 },
  { name: 'ward', label: 'Phường / xã', autoComplete: 'shipping address-level2', placeholder: 'Chọn phường / xã', maxLength: 100 },
  { name: 'address', label: 'Địa chỉ cụ thể', autoComplete: 'shipping street-address', placeholder: 'Số nhà, đường, thôn / tổ…', maxLength: 200 },
  { name: 'email', label: 'Email', autoComplete: 'shipping email', placeholder: 'Email của bạn', maxLength: 254, optional: true, type: 'email' },
  { name: 'note', label: 'Ghi chú giao hàng', autoComplete: 'off', placeholder: 'Điều cần lưu ý khi giao hàng', maxLength: 500, optional: true },
]

export function fieldError(name: DeliveryField, value: string, province = ''): string {
  const text = value.trim()
  const field = deliveryFields.find((field) => field.name === name)!
  if (name === 'province' && !provinces.some((item) => item.name === text)) return 'Chọn tỉnh / thành phố nhận hàng.'
  if (name === 'ward' && !wardsFor(province).includes(text)) return 'Chọn phường / xã thuộc tỉnh / thành phố đã chọn.'
  if (!text && !field.optional) return `Nhập ${field.label.toLowerCase()}.`
  if (text.length > field.maxLength) return `Tối đa ${field.maxLength} ký tự.`
  if (name === 'phone' && !/^(?:0|\+84)[1-9]\d{8}$/.test(text.replace(/[\s-]/g, ''))) {
    return 'Nhập số Việt Nam hợp lệ, ví dụ 0912 345 678 hoặc +84 912 345 678.'
  }
  if (name === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Nhập email hợp lệ, ví dụ ban@example.com.'
  return ''
}

export function deliveryErrors(draft: CheckoutDraft): Partial<Record<DeliveryField, string>> {
  return Object.fromEntries(deliveryFields.map(({ name }) => [name, fieldError(name, draft[name], draft.province)]).filter(([, error]) => error))
}

export function allowedStep(step: string | null, draft: CheckoutDraft): CheckoutStep {
  if (step !== '2' && step !== '3' && step !== 'preview') return '1'
  if (!draft.selected) return '1'
  if (step !== '2' && Object.keys(deliveryErrors(draft)).length) return '2'
  return step
}

export function readDraft(): CheckoutDraft {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')
    if (!saved || saved.version !== 1 || !saved.draft || typeof saved.draft !== 'object') return { ...emptyDraft }
    const draft = saved.draft
    if (!Number.isInteger(draft.quantity) || draft.quantity < 1 || draft.quantity > 99 || typeof draft.selected !== 'boolean') return { ...emptyDraft }
    if (deliveryFields.some(({ name, maxLength }) => typeof draft[name] !== 'string' || draft[name].length > maxLength)) return { ...emptyDraft }
    const restored = { quantity: draft.quantity, selected: draft.selected, ...Object.fromEntries(deliveryFields.map(({ name }) => [name, draft[name]])) } as CheckoutDraft
    if (!provinces.some((province) => province.name === restored.province)) restored.province = ''
    if (!wardsFor(restored.province).includes(restored.ward)) restored.ward = ''
    return restored
  } catch { return { ...emptyDraft } }
}

export function priceLabel(value: number | null): string {
  return value === null ? 'Chưa công bố' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export function totals(quantity: number) {
  const subtotal = sales.unitPrice === null ? null : sales.unitPrice * quantity
  return { subtotal, total: subtotal === null || sales.shippingFee === null ? null : subtotal + sales.shippingFee }
}
