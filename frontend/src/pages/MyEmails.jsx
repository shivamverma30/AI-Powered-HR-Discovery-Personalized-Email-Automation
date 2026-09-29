import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import DraftEditor from '../components/DraftEditor.jsx'
import SendConfirmDialog from '../components/SendConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useGmail } from '../hooks/useGmail.js'
import { apiGet, apiPost, apiDelete } from '../lib/api.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
]

const statusStyles = {
  draft: 'bg-slate-100 text-slate-600',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function MyEmails() {
  const { user } = useAuth()
  const gmail = useGmail()
  const [emails, setEmails] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [sendTarget, setSendTarget] = useState(null) // draft being confirmed
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  async function loadEmails(activeFilter = filter) {
    setLoading(true)
    const query = activeFilter === 'all' ? '' : `?status=${activeFilter}`
    const { ok, data } = await apiGet(`/api/emails${query}`)
    setLoading(false)
    if (ok && data?.success) {
      setEmails(data.drafts || [])
    } else {
      setError('Could not load your emails.')
    }
  }

  useEffect(() => {
    loadEmails(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function handleDelete(id) {
    const { ok } = await apiDelete(`/api/emails/${id}`)
    if (ok) {
      setEmails((prev) => prev.filter((d) => d.id !== id))
      setConfirmDeleteId(null)
      if (openId === id) setOpenId(null)
    } else {
      setError('Could not delete the email.')
    }
  }

  async function confirmSend() {
    if (!sendTarget) return
    setSending(true)
    setSendError('')
    const { ok, status, data } = await apiPost(`/api/emails/${sendTarget.id}/send`)
    setSending(false)

    if (ok && data?.success) {
      // Update the row status locally and refresh usage.
      setEmails((prev) =>
        prev.map((e) => (e.id === sendTarget.id ? data.draft : e))
      )
      gmail.refresh()
      setSendTarget(null)
      // If filtering by drafts, the sent one drops out on next load.
      if (filter !== 'all') loadEmails(filter)
      return
    }

    if (status === 401) setSendError('Your session has expired. Please log in again.')
    else setSendError(data?.message || 'The email could not be sent.')
  }

  function formatDate(value) {
    if (!value) return ''
    try {
      return new Date(value).toLocaleString()
    } catch {
      return ''
    }
  }

  const gmailConnected = gmail.connection?.connected
  const limitReached = gmail.usage && gmail.usage.remaining <= 0

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">My Emails</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your drafts and sent emails.
      </p>

      {gmail.usage && (
        <p className="mt-2 text-sm text-slate-600">
          {gmail.usage.sentToday}/{gmail.usage.limit} emails sent today
          {limitReached && (
            <span className="text-red-600"> - daily limit reached</span>
          )}
        </p>
      )}

      {!gmail.loading && !gmailConnected && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Gmail is not connected. Connect it from the Dashboard to send emails.
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === f.key
                ? 'bg-brand text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading emails...</p>
      ) : emails.length === 0 ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-card px-4 py-6 text-sm text-slate-600">
          No emails to show. Generate drafts from Find HR or Google Sheets, then
          save the ones you want to keep.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Recipient</Th>
                <Th>Company</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Sent</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {emails.map((email) => (
                <tr key={email.id}>
                  <td className="px-3 py-2 text-slate-700">
                    <div>{email.contactName || email.contactEmail}</div>
                    <div className="text-xs text-slate-500">{email.contactEmail}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {email.company || <span className="text-slate-400">Not available</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{email.subject}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        statusStyles[email.status] || statusStyles.draft
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(email.createdAt)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {email.sentAt ? formatDate(email.sentAt) : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === email.id ? null : email.id)}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {openId === email.id ? 'Close' : 'Open'}
                      </button>

                      {email.status !== 'sent' && email.status !== 'sending' && (
                        <button
                          type="button"
                          onClick={() => { setSendError(''); setSendTarget(email) }}
                          disabled={!gmailConnected || limitReached}
                          title={
                            !gmailConnected
                              ? 'Connect Gmail to send'
                              : limitReached
                                ? 'Daily limit reached'
                                : 'Send this email'
                          }
                          className="rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Send
                        </button>
                      )}

                      {confirmDeleteId === email.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(email.id)}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(email.id)}
                          className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / editor for the opened email */}
      {openId && (
        <div className="mt-6">
          <EmailDetail
            email={emails.find((e) => e.id === openId)}
            resumeUrl={user?.resumeUrl}
          />
        </div>
      )}

      {/* Send confirmation dialog */}
      {sendTarget && (
        <SendConfirmDialog
          recipient={sendTarget.contactEmail}
          subject={sendTarget.subject}
          sending={sending}
          error={sendError}
          onConfirm={confirmSend}
          onCancel={() => { if (!sending) { setSendTarget(null); setSendError('') } }}
        />
      )}
    </DashboardLayout>
  )
}

// Sent/failed emails are read-only; drafts are editable.
function EmailDetail({ email, resumeUrl }) {
  if (!email) return null

  if (email.status === 'sent' || email.status === 'sending') {
    return (
      <div className="rounded-lg border border-slate-200 bg-card p-5">
        <p className="text-sm font-medium text-slate-900">
          {email.contactName || 'HR Contact'}
        </p>
        <p className="text-sm text-slate-600">{email.contactEmail}</p>
        {email.company && <p className="text-xs text-slate-500">{email.company}</p>}
        {email.sentAt && (
          <p className="mt-1 text-xs text-slate-500">
            Sent {new Date(email.sentAt).toLocaleString()}
          </p>
        )}
        {email.gmailMessageId && (
          <p className="mt-1 text-xs text-slate-400">Gmail message id: {email.gmailMessageId}</p>
        )}
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subject</p>
          <p className="mt-1 text-sm text-slate-900">{email.subject}</p>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Body</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{email.body}</p>
        </div>
      </div>
    )
  }

  // draft or failed -> editable
  return <DraftEditor draft={email} resumeUrl={resumeUrl} />
}

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </th>
  )
}
