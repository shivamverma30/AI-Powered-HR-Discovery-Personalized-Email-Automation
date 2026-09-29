import { config } from '../config.js'

// Thin, reusable client for the Grok (xAI) chat completions API.
// OpenAI-compatible endpoint: POST {baseUrl}/chat/completions.

const REQUEST_TIMEOUT_MS = 30000

export function isGrokConfigured() {
  return Boolean(config.grok.apiKey)
}

// Send a chat completion request asking for a JSON object response.
// Returns the parsed assistant message content (as a string).
// Throws tagged errors; never returns fabricated content on failure.
export async function grokJsonCompletion({ system, user }) {
  if (!isGrokConfigured()) {
    const err = new Error('Grok API key is not configured')
    err.code = 'GROK_NOT_CONFIGURED'
    throw err
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.grok.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.grok.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.grok.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (response.status === 429) {
      const err = new Error('Grok API rate limit reached')
      err.code = 'GROK_RATE_LIMIT'
      throw err
    }

    if (response.status === 401 || response.status === 403) {
      // Invalid key, or the xAI account lacks credits/licenses.
      console.error('Grok API auth/permission error status:', response.status)
      const err = new Error('Grok API access denied')
      err.code = 'GROK_ACCESS_DENIED'
      throw err
    }

    if (!response.ok) {
      // Do not surface provider internals; log only the status code.
      console.error('Grok API error status:', response.status)
      const err = new Error('Grok API request failed')
      err.code = 'GROK_ERROR'
      throw err
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      const err = new Error('Grok API returned an empty response')
      err.code = 'GROK_EMPTY'
      throw err
    }
    return content
  } catch (err) {
    if (err.code) throw err
    if (err.name === 'AbortError') {
      const e = new Error('Grok API request timed out')
      e.code = 'GROK_TIMEOUT'
      throw e
    }
    const e = new Error('Could not reach the Grok API')
    e.code = 'GROK_UNREACHABLE'
    throw e
  } finally {
    clearTimeout(timer)
  }
}
