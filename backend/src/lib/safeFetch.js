// HTTP fetch helpers with timeout and response size limits.

const DEFAULT_TIMEOUT_MS = 8000
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024 // 2 MB

// Fetch text with an abort timeout and a maximum body size.
// `redirect` defaults to 'follow'; callers that need SSRF safety should pass
// 'manual' and validate the final URL themselves, or restrict hosts first.
export async function fetchText(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    headers = {},
    redirect = 'follow',
  } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect,
      headers: {
        'User-Agent': 'HireReachAI/1.0 (+contact-discovery)',
        ...headers,
      },
    })

    if (!response.ok) {
      return { ok: false, status: response.status, body: null, finalUrl: response.url }
    }

    // Read the body but stop once we exceed the byte limit.
    const reader = response.body?.getReader()
    if (!reader) {
      const body = await response.text()
      return { ok: true, status: response.status, body, finalUrl: response.url }
    }

    const decoder = new TextDecoder()
    let received = 0
    let body = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > maxBytes) {
        reader.cancel()
        break
      }
      body += decoder.decode(value, { stream: true })
    }

    return { ok: true, status: response.status, body, finalUrl: response.url }
  } finally {
    clearTimeout(timer)
  }
}
