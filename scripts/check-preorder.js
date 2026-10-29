// Run only in a fresh localhost preorder QA tab, after its curtain opens.
// Exercises invalid submits and stores a draft for one reload check. NEVER sends a valid registration.
(async () => {
  if (!['127.0.0.1', 'localhost'].includes(location.hostname)) throw Error('Use a fresh localhost QA tab only')
  const root = document.querySelector('.po-page')
  const frame = () => new Promise(requestAnimationFrame)
  const settle = async () => { await frame(); await frame() }
  let passed = 0
  const check = (condition, message) => { if (!condition) throw Error(message); passed++ }
  const fill = async (name, value) => {
    const field = root.querySelector(`[name="${name}"]`)
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await settle()
  }
  const click = async selector => { root.querySelector(selector).click(); await settle() }
  check(root.querySelector('.po-content:not([inert])'), 'Curtain unlocks after assets prepare')
  check(root.querySelectorAll('form').length === 1 && !root.querySelector('.po-steps'), 'One form replaces the three-step checkout')
  check(!root.querySelector('select,[name="address"],[name="province"],[name="ward"],input[type="checkbox"]'), 'No shipping fields or consent checkbox')
  check(!root.querySelector('.po-payment,.po-note'), 'No payment/QR or explanatory callout box')
  check(root.querySelector('[name="email"]').type === 'email' && !root.querySelector('[name="email"]').required, 'Optional email is collected without promising an email delivery')
  check(!new URLSearchParams(location.search).has('step'), 'Legacy step link resolves to the single form')
  check(root.querySelectorAll('.chapter-nav').length === 1 && root.querySelectorAll('.page-progress').length === 1, 'Original shared navigation remains')
  check([...root.querySelectorAll('img')].every(image => image.complete && image.naturalWidth), 'Artwork loads without replacement')
  check(document.fonts.check('16px "NVN Yellost"'), 'Brand heading font is ready')
  const reset = root.querySelector('.po-reset')
  if (reset) { reset.click(); await settle() }
  const less = root.querySelector('[aria-label="Giảm số bộ game"]')
  const more = root.querySelector('[aria-label="Tăng số bộ game"]')
  check(less.disabled, 'Quantity starts at one')
  for (let i = 0; i < 98; i++) more.click()
  await settle()
  check(root.querySelector('output').textContent === '99' && more.disabled, 'Quantity is bounded at 99')
  for (let i = 0; i < 98; i++) less.click()
  await settle()
  check(root.querySelector('output').textContent === '01' && less.disabled, 'Quantity is bounded at one')
  await click('.po-submit')
  check(document.activeElement.name === 'name' && root.querySelector('[name="name"]').getAttribute('aria-invalid') === 'true', 'Empty submit focuses the first invalid contact')
  check(!document.querySelector('iframe[title="Kênh gửi đăng ký Thủy Trận"]'), 'Invalid form makes no outbound connection')
  await fill('name', 'QA LOCAL KHÔNG GỬI')
  await fill('phone', '123')
  await click('.po-submit')
  check(document.activeElement.name === 'phone' && root.querySelector('#po-phone-error').textContent, 'Invalid phone has an adjacent error and receives focus')
  await fill('phone', '+84 912-345-678')
  await fill('email', 'broken')
  await click('.po-submit')
  check(document.activeElement.name === 'email' && root.querySelector('#po-email-error').textContent, 'Entered email is validated')
  await fill('email', 'qa@example.com')
  await click('.po-note-toggle summary')
  await fill('note', 'Nháp kiểm tra trên local, không gửi đơn.')
  more.click(); more.click(); await settle()
  const saved = JSON.parse(sessionStorage.getItem('thuy-tran.preorder.v2'))
  check(saved.draft.quantity === 3 && saved.draft.email === 'qa@example.com' && !saved.pending && !saved.receipt, 'Only the current draft is persisted before submit')
  check(root.querySelector('.po-totals').textContent.includes('1.797.000') && root.textContent.includes('Chưa thu tiền'), 'Real price is visible without a payable total')
  const viewportWidth = Math.ceil(document.documentElement.getBoundingClientRect().width)
  check(document.documentElement.scrollWidth <= viewportWidth + 2, 'No new horizontal page overflow')
  check([...root.querySelectorAll('input:not([name="company"]),textarea,.po-submit')].filter(el => el.getBoundingClientRect().width).every(el => {
    const rect = el.getBoundingClientRect(); return rect.left >= 0 && rect.right <= viewportWidth + 1
  }), 'Contact fields and CTA fit the viewport')
  check(root.querySelector('.po-submit').getBoundingClientRect().height >= 44, 'Main action has a usable touch target')
  if (innerWidth > 900) {
    await click('.po-lid')
    check(root.querySelector('.po-stage').dataset.open === 'true', 'Interactive box preview still opens')
    await click('.po-lid')
  }
  check(!document.querySelector('iframe[title="Kênh gửi đăng ký Thủy Trận"]'), 'The QA script never sends a valid request')
  return { passed, viewport: `${innerWidth}×${innerHeight}`, next: 'Reload once, verify name/phone/email/note/quantity, then clear this QA draft.' }
})()
