import { useState } from 'react'
import { apiPost, apiPut } from '../lib/api.js'

// Editable card for a single email draft.
// draft: { id?, contactEmail, contactName, company, subject, body }
// resumeUrl: shown as the resume link the email should include.
// onChange(updatedDraft): notify parent of local edits (for saved drafts).
export default function DraftEditor({ draft, resumeUrl, onChange }) {
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const [status, setStatus] = useState('') // '', 'saving', 'saved', 'regenerating'
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState(draft.id || null)

  function update(nextSubject, nextBody) {
    setSubject(nextSubject)
    setBody(nextBody)
    setStatus('')
    if (onChange) onChange({ ...draft, subject: nextSubject, body: nextBody })
  }

  async function handleSave() {
    setError('')
    setStatus('saving')

    if (savedId) {
      const { ok, data } = await apiPut(`/api/emails/${savedId}`, { subject, body })
      setStatus(ok ? 'saved' : '')
      if (!ok) setError(data?.message || 'Could not save the draft.')
      return
    }

    const { ok, data } = await apiPost('/api/emails', {
      contactEmail: draft.contactEmail,
      contactName: draft.contactName,
      company: draft.company,
      subject,
      body,
    })
    if (ok && data?.draft) {
      setSavedId(data.draft.id)
      setStatus('saved')
    } else {
      setStatus('')
      setError(data?.message || 'Could not save the draft.')
    }
  }

  async function handleRegenerate() {
    setError('')
    setStatus('regenerating')
    const { ok, data } = await apiPost('/api/emails/regenerate', {
      contact: {
        email: draft.contactEmail,
        name: draft.contactName,
        company: draft.company,
      },
    })
    if (ok && data?.draft) {
      update(data.draft.subject, data.draft.body)
    } else {
      setStatus('')
      setError(data?.message || 'Could not regenerate the draft.')
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {draft.contactName || 'HR Contact'}
          </p>
          <p className="text-sm text-slate-600">{draft.contactEmail}</p>
          {draft.company && (
            <p className="text-xs text-slate-500">{draft.company}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={status === 'regenerating' || status === 'saving'}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'regenerating' ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === 'saving' || status === 'regenerating'}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'saving' ? 'Saving...' : savedId ? 'Update' : 'Save Draft'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {status === 'saved' && !error && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Draft saved.
        </div>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => update(e.target.value, body)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium text-slate-700">Body</label>
        <textarea
          value={body}
          onChange={(e) => update(subject, e.target.value)}
          rows={10}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {resumeUrl && (
        <p className="mt-2 text-xs text-slate-500">
          Resume link included:{' '}
          <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
            {resumeUrl}
          </a>
        </p>
      )}
    </div>
  )
}
