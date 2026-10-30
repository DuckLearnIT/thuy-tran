import { validReceipt, type PreorderRequest, type PreorderReceipt } from './data/checkout'
import { preorderEndpoint } from './data/preorder-service'

export class PreorderSubmissionError extends Error {
  constructor(message: string, public definitive = false) { super(message) }
}

// How long the HTML bridge gets before the same request also goes out as a plain POST.
const bridgeWait = 6000

// HTML-service bridge uses Google's supported RPC and an acknowledged postMessage,
// rather than treating an opaque no-cors fetch as a successfully saved registration.
// Browsers signed in to several Google accounts get the bridge page redirected to /u/N/ and refused, so
// after a short wait the same request is also sent as an anonymous POST (no cookies, readable JSON reply).
// The request id makes sending it twice safe: the sheet gets one row and both answers carry the same receipt.
export function submitPreorder(request: PreorderRequest, endpoint = preorderEndpoint): Promise<PreorderReceipt> {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
    return Promise.reject(new PreorderSubmissionError('Kênh nhận đăng ký chưa sẵn sàng. Bạn có thể liên hệ nhóm qua Facebook.', true))
  }
  return new Promise((resolve, reject) => {
    const nonce = crypto.randomUUID()
    const iframe = document.createElement('iframe')
    iframe.hidden = true
    iframe.title = 'Kênh gửi đăng ký Thủy Trận'
    iframe.referrerPolicy = 'no-referrer'
    let bridge: MessageEventSource | null = null
    let bridgeOrigin = ''
    let settled = false
    const cleanup = () => { settled = true; clearTimeout(timer); clearTimeout(fallback); window.removeEventListener('message', receive); iframe.remove() }
    const fail = (message: string, definitive = false) => { cleanup(); reject(new PreorderSubmissionError(message, definitive)) }
    const settle = (result: { ok?: boolean; code?: string; receipt?: unknown } | undefined) => {
      if (settled) return
      if (result?.ok && validReceipt(result.receipt)) { cleanup(); resolve(result.receipt as PreorderReceipt) }
      else fail(result?.code === 'invalid' ? 'Thông tin chưa hợp lệ. Kiểm tra lại rồi gửi nhé.'
        : result?.code === 'rate_limit' ? 'Số điện thoại này vừa gửi đăng ký. Vui lòng thử lại sau hoặc liên hệ nhóm.'
          : 'Chưa xác nhận được đăng ký. Bấm gửi lại để kiểm tra; hệ thống sẽ không tạo trùng.',
      ['invalid', 'rate_limit'].includes(result?.code ?? ''))
    }
    const receive = (event: MessageEvent) => {
      if (!/^https:\/\/(?:[a-z0-9-]+-script|script)\.googleusercontent\.com$/.test(event.origin)
        || !event.source || event.data?.nonce !== nonce) return
      if (event.data.type === 'TT_PREORDER_READY' && !bridge) {
        bridge = event.source
        bridgeOrigin = event.origin
        ;(bridge as WindowProxy).postMessage({ type: 'TT_PREORDER_SUBMIT', nonce, request }, bridgeOrigin)
      } else if (event.data.type === 'TT_PREORDER_RESULT' && event.source === bridge && event.origin === bridgeOrigin) {
        settle(event.data.result)
      }
    }
    const viaPost = () => {
      if (settled) return
      // text/plain keeps this a simple request, so no preflight is needed; no cookies means no /u/N/ redirect.
      fetch(endpoint, { method: 'POST', credentials: 'omit', redirect: 'follow', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(request) })
        .then(response => response.json())
        .then(settle)
        // A failed POST is left to the bridge and to the overall timeout, which stays retryable.
        .catch(() => undefined)
    }
    const fallback = setTimeout(viaPost, bridgeWait)
    const timer = setTimeout(() => fail('Kết nối mất nhiều thời gian. Bấm gửi lại để kiểm tra; hệ thống sẽ không tạo trùng.'), 30000)
    iframe.addEventListener('error', () => fail('Chưa kết nối được nơi nhận. Thông tin vẫn được giữ để bạn gửi lại.'), { once: true })
    window.addEventListener('message', receive)
    iframe.src = `${endpoint}?nonce=${encodeURIComponent(nonce)}`
    document.body.append(iframe)
  })
}
