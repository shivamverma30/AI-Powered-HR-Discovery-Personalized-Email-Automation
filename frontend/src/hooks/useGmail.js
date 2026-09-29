import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, apiDelete, API_URL } from '../lib/api.js'

// Loads Gmail connection status and daily usage, and exposes connect/disconnect.
export function useGmail() {
  const [connection, setConnection] = useState(null) // { connected, gmailEmail }
  const [usage, setUsage] = useState(null) // { limit, sentToday, remaining, resetsAt }
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [statusRes, usageRes] = await Promise.all([
      apiGet('/api/gmail/status'),
      apiGet('/api/gmail/usage'),
    ])
    if (statusRes.ok && statusRes.data?.success) {
      setConnection({
        connected: Boolean(statusRes.data.connected),
        gmailEmail: statusRes.data.gmailEmail || null,
      })
    }
    if (usageRes.ok && usageRes.data?.success) {
      setUsage({
        limit: usageRes.data.limit,
        sentToday: usageRes.data.sentToday,
        remaining: usageRes.data.remaining,
        resetsAt: usageRes.data.resetsAt,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Start the Gmail OAuth flow: fetch the consent URL, then redirect.
  const connect = useCallback(async () => {
    const { ok, data } = await apiGet('/api/gmail/connect')
    if (ok && data?.url) {
      window.location.href = data.url
      return { ok: true }
    }
    return { ok: false, message: data?.message || 'Could not start Gmail connection.' }
  }, [])

  const disconnect = useCallback(async () => {
    const { ok } = await apiDelete('/api/gmail/connection')
    if (ok) await refresh()
    return ok
  }, [refresh])

  return { connection, usage, loading, refresh, connect, disconnect, API_URL, apiPost }
}
