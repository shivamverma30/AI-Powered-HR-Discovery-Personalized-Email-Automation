import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import DraftEditor from '../components/DraftEditor.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGet, apiDelete } from '../lib/api.js'

export default function MyEmails() {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  async function loadDrafts() {
    setLoading(true)
    const { ok, data } = await apiGet('/api/emails')
    setLoading(false)
    if (ok && data?.success) {
      setDrafts(data.drafts || [])
    } else {
      setError('Could not load your saved drafts.')
    }
  }

  useEffect(() => {
    loadDrafts()
  }, [])

  async function handleDelete(id) {
    const { ok } = await apiDelete(`/api/emails/${id}`)
    if (ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id))
      setConfirmId(null)
      if (openId === id) setOpenId(null)
    } else {
      setError('Could not delete the draft.')
    }
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">My Emails</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your saved email drafts. Nothing here has been sent.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading drafts...</p>
      ) : drafts.length === 0 ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-card px-4 py-6 text-sm text-slate-600">
          You have no saved drafts yet. Generate drafts from Find HR or Google
          Sheets, then save the ones you want to keep.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Recipient</Th>
                <Th>Company</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {drafts.map((draft) => (
                <tr key={draft.id}>
                  <td className="px-3 py-2 text-slate-700">
                    <div>{draft.contactName || draft.contactEmail}</div>
                    <div className="text-xs text-slate-500">{draft.contactEmail}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {draft.company || <span className="text-slate-400">Not available</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{draft.subject}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {draft.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(draft.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === draft.id ? null : draft.id)}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {openId === draft.id ? 'Close' : 'Open'}
                      </button>
                      {confirmId === draft.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(draft.id)}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(draft.id)}
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

      {openId && (
        <div className="mt-6">
          <DraftEditor
            key={openId}
            draft={drafts.find((d) => d.id === openId)}
            resumeUrl={user?.resumeUrl}
          />
        </div>
      )}
    </DashboardLayout>
  )
}

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </th>
  )
}
