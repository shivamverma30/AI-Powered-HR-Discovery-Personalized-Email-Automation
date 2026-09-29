import { config } from '../config.js'

// Thin, reusable client for the Groq chat completions API (groq.com).
// OpenAI-compatible endpoint: POST {baseUrl}/chat/completions.

const REQUEST_TIMEOUT_MS = 30000

export function isGroqConfigured() {
  return Boolean(config.groq.apiKey)
}

// Send a chat completion request asking for a JSON object response.
// Returns the parsed assistant message content (as a string).
// Throws tagged errors; never returns fabricated content on failure.
export async function groqJsonCompletion({ system, user }) {
  if (!isGroqConfigured()) {
    const err = new Error('Groq API key is not configured')
    err.code = 'GROQ_NOT_CONFIGURED'
    throw err
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${config.groq.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.groq.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (response.status === 429) {
      const err = new Error('Groq API rate limit reached')
      err.code = 'GROQ_RATE_LIMIT'
      throw err
    }

    if (response.status === 401 || response.status === 403) {
      // Invalid key, or the Groq account lacks access.
      console.error('Groq API auth/permission error status:', response.status)
      const err = new Error('Groq API access denied')
      err.code = 'GROQ_ACCESS_DENIED'
      throw err
    }

    if (!response.ok) {
      // Do not surface provider internals; log only the status code.
      console.error('Groq API error status:', response.status)
      const err = new Error('Groq API request failed')
      err.code = 'GROQ_ERROR'
      throw err
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      const err = new Error('Groq API returned an empty response')
      err.code = 'GROQ_EMPTY'
      throw err
    }
    return content
  } catch (err) {
    if (err.code) throw err
    if (err.name === 'AbortError') {
      const e = new Error('Groq API request timed out')
      e.code = 'GROQ_TIMEOUT'
      throw e
    }
    const e = new Error('Could not reach the Groq API')
    e.code = 'GROQ_UNREACHABLE'
    throw e
  } finally {
    clearTimeout(timer)
  }
}
