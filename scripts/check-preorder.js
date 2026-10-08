// Run in DevTools on a fresh ?page=dat-truoc tab, after the curtain opens.
// When the result says reload, reload this tab and run the script again (3 runs total).
// Uses only sample contact data; the page never submits an order.
(async () => {
  const DRAFT = 'thuy-tran.checkout.v1'
  const QA = 'thuy-tran.checkout.qa'
  const phase = JSON.parse(sessionStorage.getItem(QA) || 'null')
  let passed = phase?.passed || 0
  const check = (ok, message) => { if (!ok) throw Error(message); passed++ }
  const frame = () => new Promise(requestAnimationFrame)
  const settle = async () => { await frame(); await frame() }
  const root = document.querySelector('.po-page')
  const current = () => root.querySelector('.po-step-panel')?.dataset.step
  const click = async (selector) => { root.querySelector(selector).click(); await settle() }
  const fill = async (name, value) => {
    const input = root.querySelector(`[name="${name}"]`)
    const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value)
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
    await settle()
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await settle()
  }
  const historyMove = async (direction, expected) => {
    const moved = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
    history[direction]()
    await moved
    await settle()
    for (let i = 0; i < 120 && current() !== expected; i++) await frame()
    check(current() === expected, `History ${direction} restores step ${expected}`)
  }
  const fits = () => {
    check(document.documentElement.scrollWidth <= innerWidth, 'No horizontal page overflow')
    check([...root.querySelectorAll('input, textarea, select, .po-submit')].every((el) => {
      const box = el.getBoundingClientRect()
      return box.width > 0 && box.width <= innerWidth && box.right <= innerWidth + 1
    }), 'Fields and CTA fit the viewport')
  }
  check(root && !root.querySelector('[inert]'), 'Page unlocks after preloading')
  check(document.fonts.check('700 16px "NVN Yellost"'), 'Display font is ready')
  check([...root.querySelectorAll('img')].every((img) => img.complete && img.naturalWidth > 0), 'All visible and hidden assets are ready')

  if (phase?.name === 'reload') {
    check(current() === 'preview', 'Reload restores the preview route')
    check(root.querySelector('address').textContent.includes('34 Đường thử'), 'Reload restores delivery information')
    check(root.querySelector('.po-product-small').textContent.includes('3 bộ'), 'Reload restores quantity')
    await click('.po-reset')
    check(current() === '1' && !sessionStorage.getItem(DRAFT), 'Deleting draft resets the flow and storage')
    await historyMove('back', '1')
    check(new URLSearchParams(location.search).get('step') === '1', 'Stale history cannot bypass the selection step')
    sessionStorage.setItem(DRAFT, '{broken json')
    history.replaceState(null, '', '?page=dat-truoc&step=preview')
    sessionStorage.setItem(QA, JSON.stringify({ name: 'corrupt', passed }))
    return { passed, reload: true, next: 'Reload and rerun to check corrupt draft recovery' }
  }
  if (phase?.name === 'corrupt') {
    check(current() === '1', 'Corrupt draft safely falls back to the first step')
    check(root.querySelector('output').value === '01', 'Corrupt draft never supplies an invalid quantity')
    const original = Storage.prototype.setItem
    try {
      Storage.prototype.setItem = function () { throw new DOMException('Blocked for QA', 'SecurityError') }
      await click('[aria-label="Tăng số bộ game"]')
      check(root.querySelector('output').value === '02', 'Flow works with storage unavailable')
      check(root.querySelector('.po-draft-status').textContent.includes('tải lại sẽ mất'), 'Unavailable storage is explained')
    } finally { Storage.prototype.setItem = original }
    await click('[aria-label="Giảm số bộ game"]')
    check(!sessionStorage.getItem(DRAFT), 'Empty draft is removed after storage recovers')
    fits()
    sessionStorage.removeItem(QA)
    return { passed, complete: true, viewport: `${innerWidth}×${innerHeight}`, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches }
  }

  check(current() === '1', 'Fresh tab begins at selection')
  const toggle = root.querySelector('.po-preview-toggle')
  if (getComputedStyle(toggle).display !== 'none') await click('.po-preview-toggle')
  else await click('.po-lid')
  check(root.querySelector('.po-stage').dataset.open === 'true', 'Product preview opens')
  check(root.querySelector('#preorder-hand').getAttribute('aria-hidden') === 'false', 'Six characters become accessible')
  check(root.querySelectorAll('.po-hand img').length === 6, 'Complete character hand is preserved')
  if (getComputedStyle(toggle).display !== 'none') await click('.po-preview-toggle')
  else await click('.po-lid')
  check(root.querySelector('.po-stage').dataset.open === 'false', 'Product preview closes')
  check(root.querySelector('[aria-label="Giảm số bộ game"]').disabled, 'Quantity cannot fall below one')
  for (let i = 0; i < 98; i++) await click('[aria-label="Tăng số bộ game"]')
  check(root.querySelector('[aria-label="Tăng số bộ game"]').disabled && root.querySelector('output').value === '99', 'Quantity cannot exceed 99')
  for (let i = 0; i < 98; i++) await click('[aria-label="Giảm số bộ game"]')
  check(root.querySelector('output').value === '01', 'Quantity returns to one')
  await click('[aria-label="Tăng số bộ game"]')
  fits()
  await click('.po-submit')
  check(current() === '2' && new URLSearchParams(location.search).get('step') === '2', 'Continue opens delivery and updates URL')
  check(!root.querySelector('[role="progressbar"]'), 'Curtain does not run between steps')
  check(document.activeElement.id === 'po-step-title', 'Step change focuses the heading')
  check(root.querySelector('[name="province"]').options.length === 35, 'All 34 provinces are bundled and available')
  check(root.querySelector('[name="ward"]').disabled && root.querySelector('[name="ward"]').options.length === 1, 'Wards wait for a province selection')
  check(root.querySelector('[name="name"]').required && root.querySelector('[name="phone"]').required && !root.querySelector('[name="email"]').required, 'Name/phone are required; email is optional')
  await click('.po-submit')
  check(current() === '2' && document.activeElement.name === 'name', 'Invalid submission focuses the first error')
  check(root.querySelectorAll('[aria-invalid="true"]').length === 5, 'Required delivery fields show errors')
  for (const name of ['name', 'address']) await fill(name, '   ')
  check(['name', 'address'].every((name) => root.querySelector(`[name="${name}"]`).getAttribute('aria-invalid') === 'true'), 'Whitespace is rejected for names and addresses')
  await fill('phone', '090')
  check(root.querySelector('[name="phone"]').getAttribute('aria-invalid') === 'true', 'Invalid phone shows an inline error')
  await fill('email', 'invalid-email')
  check(root.querySelector('[name="email"]').getAttribute('aria-invalid') === 'true', 'Optional email validates when supplied')
  history.pushState(null, '', '?page=dat-truoc&step=3')
  window.dispatchEvent(new PopStateEvent('popstate'))
  await settle()
  check(current() === '2' && new URLSearchParams(location.search).get('step') === '2', 'Incomplete delivery cannot bypass validation through the URL')
  const sample = { name: 'Người nhận thử', phone: '+84 912-345-678', province: 'Thành phố Hà Nội', ward: 'Phường Ba Đình', address: '12 Đường thử', email: '', note: 'Gọi trước khi giao.' }
  for (const [name, value] of Object.entries(sample)) await fill(name, value)
  check(root.querySelectorAll('[aria-invalid="true"]').length === 0, 'Correcting values clears inline errors')
  check(root.querySelector('[name="ward"]').options.length === 127, 'Ha Noi exposes its 126 wards')
  await fill('province', 'Thành phố Huế')
  check(root.querySelector('[name="ward"]').value === '' && ![...root.querySelector('[name="ward"]').options].some((option) => option.value === sample.ward), 'Changing province clears the old ward and replaces its options')
  await click('.po-submit')
  check(current() === '2' && document.activeElement.name === 'ward', 'A cleared ward must be selected again')
  await fill('province', sample.province)
  await fill('ward', sample.ward)
  fits()
  await click('.po-submit')
  check(current() === '3', 'Valid delivery with no email reaches review')
  check(root.querySelector('address').textContent.includes('12 Đường thử'), 'Review includes the complete address')
  check([...root.querySelectorAll('.po-totals dd')].every((value) => value.textContent === 'Chưa công bố'), 'Missing amounts do not become zero or a fake total')
  check(root.querySelector('.po-payment').textContent.includes('Chưa mở thanh toán') && !root.querySelector('.po-payment img, .po-payment canvas, .po-payment svg'), 'No usable payment QR is rendered')
  check(!/[?&](name|phone|email|address|province|ward)=/.test(location.search), 'Personal information never enters the URL')
  await click('.po-summary:first-of-type .po-edit')
  check(current() === '1' && root.querySelector('output').value === '02', 'Edit quantity preserves previous selection')
  await click('[aria-label="Tăng số bộ game"]')
  await click('.po-submit')
  check(root.querySelector('[name="name"]').value === sample.name, 'Returning to delivery preserves input')
  await fill('address', '34 Đường thử')
  await fill('phone', '0912 345-678')
  await click('.po-submit')
  check(current() === '3' && root.querySelector('address').textContent.includes('34 Đường thử'), 'Edited address and local-format phone are accepted')
  await historyMove('back', '2')
  check(root.querySelector('[name="address"]').value === '34 Đường thử', 'Browser Back preserves the draft')
  await historyMove('forward', '3')
  await click('.po-submit')
  check(current() === 'preview', 'Sample receipt opens')
  check(root.querySelector('[role="status"]').textContent === 'Phiếu mẫu — thông tin chưa được gửi.', 'Receipt clearly states it has not been submitted')
  check(!/đã thanh toán|đã gửi email|mã đơn/i.test(root.querySelector('form').textContent), 'Receipt does not claim a real order or payment')
  check(sessionStorage.getItem(DRAFT) && JSON.parse(sessionStorage.getItem(DRAFT)).draft.quantity === 3, 'Draft is saved in this tab')
  fits()
  sessionStorage.setItem(QA, JSON.stringify({ name: 'reload', passed }))
  return { passed, reload: true, next: 'Reload and rerun to check draft restoration' }
})()
