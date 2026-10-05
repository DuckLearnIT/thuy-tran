// Run in DevTools on ?page=dat-truoc after the curtain opens.
(async () => {
  let passed = 0
  const check = (ok, message) => { if (!ok) throw Error(message); passed++ }
  const frame = () => new Promise(requestAnimationFrame)
  const click = async (button) => { button.click(); await frame(); await frame() }
  const root = document.querySelector('.po-page')
  check(root && !root.querySelector('[inert]'), 'Preloaded page is unlocked')
  check(document.fonts.check('700 16px "NVN Yellost"'), 'Display font is ready')
  check([...root.querySelectorAll('img')].every((img) => img.complete && img.naturalWidth > 0), 'Every image is ready')
  const stage = root.querySelector('.po-stage')
  const lid = root.querySelector('.po-lid')
  if (stage.dataset.open === 'true') await click(lid)
  check(lid.getAttribute('aria-expanded') === 'false', 'Box starts closed')
  await click(lid)
  check(stage.dataset.open === 'true' && lid.getAttribute('aria-expanded') === 'true', 'Box opens')
  check(root.querySelector('#preorder-hand').getAttribute('aria-hidden') === 'false', 'Six cards become accessible')
  check(root.querySelectorAll('.po-hand img').length === 6, 'The complete character hand is present')
  await click(lid)
  check(stage.dataset.open === 'false', 'Box closes again')
  const minus = root.querySelector('[aria-label="Giảm số bộ game"]')
  const plus = root.querySelector('[aria-label="Tăng số bộ game"]')
  check(minus.disabled && root.querySelector('output').value === '01', 'Quantity cannot fall below one')
  for (let i = 0; i < 98; i++) await click(plus)
  check(plus.disabled && root.querySelector('output').value === '99', 'Quantity has an upper limit')
  for (let i = 0; i < 98; i++) await click(minus)
  check(minus.disabled && root.querySelector('output').value === '01', 'Quantity returns to one')
  const email = root.querySelector('[name="email"]')
  email.value = 'invalid-email'
  check(email.validity.typeMismatch, 'Email uses native validation')
  email.value = ''
  check(root.querySelector('[name="name"]').required && email.required, 'Contact fields are labelled and required')
  check(root.querySelector('.po-submit').disabled, 'Preview cannot create an order')
  const submit = new Event('submit', { bubbles: true, cancelable: true })
  root.querySelector('form').dispatchEvent(submit)
  check(submit.defaultPrevented, 'Programmatic submission is also blocked')
  check([...root.querySelectorAll('a')].every((link) => link.origin === location.origin && !link.search), 'Return links leave the preorder route')
  check(document.documentElement.scrollWidth <= innerWidth, 'Page has no horizontal overflow')
  check([...root.querySelectorAll('input')].every((input) => input.getBoundingClientRect().width > 0 && input.getBoundingClientRect().right <= innerWidth), 'Form fits the viewport')
  await click(lid)
  return { passed, viewport: `${innerWidth}×${innerHeight}`, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches }
})()
