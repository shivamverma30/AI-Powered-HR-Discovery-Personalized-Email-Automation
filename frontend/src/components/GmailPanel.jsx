import { useState } from 'react'

// Gmail connection + daily usage panel for the dashboard.
// Props come from the useGmail hook (connection, usage, connect, disconnect).
export default function GmailPanel({ connection, usage, loading, connect, disconnect }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  async function handleConnect() {
    setError('')
    setBusy(true)
    const res = await connect()
    if (!res.ok) {
      setBusy(false)
      setError(res.message)
    }
    // On success the browser redirects to Google.
  }

  async function handleDisconnect() {
    setBusy(true)
    const ok = await disconnect()
    setBusy(false)
    setConfirmDisconnect(false)
    if (!ok) setError('Could not disconnect Gmail.')
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-slate-900">Gmail account</h2>
          {loading ? (
            <p className="mt-1 text-sm text-slate-500">Checking connection...</p>
          ) : connection?.connected ? (
            <p className="mt-1 text-sm text-slate-600">
              Connected as{' '}
              <span className="font-medium text-slate-900">{connection.gmailEmail}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Connect a Gmail account to send your drafts.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!loading && connection?.connected ? (
            confirmDisconnect ? (
              <>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={busy}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? 'Disconnecting...' : 'Confirm disconnect'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(false)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDisconnect(true)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Disconnect Gmail
              </button>
            )
          ) : (
            !loading && (
              <button
                type="button"
                onClick={handleConnect}
                disabled={busy}
                className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? 'Connecting...' : 'Connect Gmail'}
              </button>
            )
          )}
        </div>
      </div>

      {usage && (
        <p className="mt-4 text-sm text-slate-600">
          {usage.sentToday}/{usage.limit} emails sent today
          {usage.remaining === 0 && (
            <span className="text-red-600"> - daily limit reached</span>
          )}
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
