// Builds a MIME message and sends it via the Gmail API.

const GMAIL_SEND_URL =
  'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
const SEND_TIMEOUT_MS = 15000

// Encode a string as base64url (Gmail's required raw message encoding).
function base64Url(input) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Encode a header value that may contain non-ASCII (RFC 2047).
function encodeHeader(value) {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

// Build a simple plain-text MIME message.
export function buildMimeMessage({ from, to, subject, body }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ]
  return `${headers.join('\r\n')}\r\n\r\n${body}`
}

// Low-level Gmail API call. Exported so tests can mock it.
// Returns { id } (the Gmail message id) or throws a tagged error.
export async function sendViaGmailApi({ accessToken, rawMessage }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)

  try {
    const response = await fetch(GMAIL_SEND_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    })

    if (response.status === 401 || response.status === 403) {
      const err = new Error('Gmail permission error')
      err.code = 'GMAIL_PERMISSION'
      throw err
    }
    if (response.status === 429) {
      const err = new Error('Gmail quota exceeded')
      err.code = 'GMAIL_QUOTA'
      throw err
    }
    if (!response.ok) {
      console.error('Gmail send failed, status:', response.status)
      const err = new Error('Gmail send failed')
      err.code = 'GMAIL_SEND_FAILED'
      throw err
    }

    const data = await response.json()
    return { id: data?.id || null }
  } catch (err) {
    if (err.code) throw err
    if (err.name === 'AbortError') {
      const e = new Error('Gmail request timed out')
      e.code = 'GMAIL_TIMEOUT'
      throw e
    }
    const e = new Error('Gmail API unavailable')
    e.code = 'GMAIL_UNAVAILABLE'
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// Compose and send. `sender` is the Gmail API caller (injectable for tests).
export async function sendEmail(
  { accessToken, from, to, subject, body },
  sender = sendViaGmailApi
) {
  const mime = buildMimeMessage({ from, to, subject, body })
  const rawMessage = base64Url(mime)
  return sender({ accessToken, rawMessage })
}
