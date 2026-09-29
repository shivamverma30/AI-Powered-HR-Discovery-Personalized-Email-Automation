import { config } from '../config.js'

// Web search using Serper.dev (Google Search API).
// Single provider kept intentionally simple. Returns organic results as
// { title, link, snippet }. Throws a tagged error when not configured.

const SERPER_URL = 'https://google.serper.dev/search'

export function isSearchConfigured() {
  return Boolean(config.searchApiKey)
}

export async function webSearch(query, { limit = 10, timeoutMs = 8000 } = {}) {
  if (!isSearchConfigured()) {
    const err = new Error('Search provider is not configured')
    err.code = 'SEARCH_NOT_CONFIGURED'
    throw err
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(SERPER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'X-API-KEY': config.searchApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: limit }),
    })

    if (!response.ok) {
      const err = new Error(`Search provider returned status ${response.status}`)
      err.code = 'SEARCH_PROVIDER_ERROR'
      throw err
    }

    const data = await response.json()
    const organic = Array.isArray(data.organic) ? data.organic : []
    return organic
      .filter((item) => item && item.link)
      .slice(0, limit)
      .map((item) => ({
        title: item.title || null,
        link: item.link,
        snippet: item.snippet || null,
      }))
  } finally {
    clearTimeout(timer)
  }
}
