// Configure SPREADSHEET_ID in Project Settings > Script properties. Never publish the sheet.
const UNIT_PRICE = 599000;
const SHEET_NAME = 'Đơn đặt trước';

function doGet(e) {
  const nonce = String(e && e.parameter && e.parameter.nonce || '');
  if (!/^[a-f0-9-]{36}$/.test(nonce)) return HtmlService.createHtmlOutput('Thủy Trận — kênh nhận đăng ký.');
  const template = HtmlService.createTemplateFromFile('Bridge');
  template.nonce = nonce;
  return template.evaluate().setTitle('Thủy Trận — nhận đăng ký')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function validateRequest_(input) {
  if (!input || typeof input !== 'object' || input.company !== '') return null;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.replace(/[\s-]/g, '').replace(/^\+84/, '0') : '';
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (!name || name.length > 100 || note.length > 500 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(name + note)) return null;
  if (!/^0(?:[35789]\d{8}|2\d{9})$/.test(phone) || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 99) return null;
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return null;
  if (typeof input.requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(input.requestId)) return null;
  if (!Number.isFinite(input.startedAt) || Date.now() - input.startedAt < 800 || Date.now() - input.startedAt > 7 * 86400000) return null;
  return { name, phone, email, note, quantity: input.quantity, requestId: input.requestId };
}

function safeCell_(text) { return /^[=+\-@\t\r]/.test(text) ? "'" + text : text; }
function receipt_(row) {
  return { reference: row[0], createdAt: new Date(row[1]).toISOString(), quantity: row[5], unitPrice: row[6], subtotal: row[7] };
}

// Only public RPC besides doGet: append a validated request, or acknowledge its opaque retry id.
// No public endpoint returns contacts, lists orders, edits rows, shares files or sends email.
function submitPreorder(input) {
  const data = validateRequest_(input);
  if (!data) return { ok: false, code: 'invalid' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, code: 'retry' };
  let stage = 'configuration';
  try {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) { console.error('Preorder configuration missing'); return { ok: false, code: 'retry' }; }
    stage = 'open-sheet';
    const sheet = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getRange(1, 13).getValue() !== 'Mã chống trùng') {
      console.error('Preorder sheet structure does not match');
      return { ok: false, code: 'retry' };
    }
    stage = 'find-retry';
    const last = sheet.getLastRow();
    if (last > 1) {
      const found = sheet.getRange(2, 13, last - 1, 1).createTextFinder(data.requestId).matchEntireCell(true).findNext();
      if (found) return { ok: true, receipt: receipt_(sheet.getRange(found.getRow(), 1, 1, 13).getValues()[0]) };
    }
    stage = 'rate-limit';
    const cache = CacheService.getScriptCache();
    const phoneKey = 'phone:' + Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data.phone)
      .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
    if (cache.get(phoneKey)) return { ok: false, code: 'rate_limit' };
    const dayKey = 'day:' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
    const count = Number(cache.get(dayKey) || 0);
    if (count >= 1000) return { ok: false, code: 'retry' };
    const now = new Date();
    const reference = 'TT-' + Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyyMMdd') + '-' + data.requestId.replace(/-/g, '').slice(0, 12);
    const row = [reference, now, safeCell_(data.name), data.phone, safeCell_(data.email), data.quantity, UNIT_PRICE, data.quantity * UNIT_PRICE,
      safeCell_(data.note), 'Chờ liên hệ', 'Chưa thanh toán', '', data.requestId];
    stage = 'prepare-row';
    if (last >= sheet.getMaxRows()) sheet.insertRowsAfter(last, 100);
    const range = sheet.getRange(last + 1, 1, 1, row.length);
    sheet.getRange(last + 1, 4).setNumberFormat('@');
    sheet.getRange(last + 1, 2).setNumberFormat('dd/MM/yyyy HH:mm');
    // Sheets tables require formatting one column at a time.
    sheet.getRange(last + 1, 7).setNumberFormat('#,##0" ₫"');
    sheet.getRange(last + 1, 8).setNumberFormat('#,##0" ₫"');
    stage = 'write-row';
    range.setValues([row]);
    stage = 'flush';
    SpreadsheetApp.flush();
    stage = 'cache-phone';
    cache.put(phoneKey, '1', 300);
    stage = 'cache-day';
    cache.put(dayKey, String(count + 1), 21600);
    return { ok: true, receipt: receipt_(row) };
  } catch (error) {
    // Record only the stage and error class, never customer data.
    console.error('Preorder failure at ' + stage + ': ' + (error && error.name || 'Error'));
    // A write might already have completed. The same request id safely checks that on retry.
    return { ok: false, code: 'retry' };
  } finally { lock.releaseLock(); }
}
