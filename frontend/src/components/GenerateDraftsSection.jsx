import { useState } from 'react'
import ContactPreview from './ContactPreview.jsx'
import DraftEditor from './DraftEditor.jsx'
import { apiPost } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

// Shows the contact preview with a Generate Drafts action, then renders the
// generated draft editors. Reused by the HR search and Sheets import pages.
export default function GenerateDraftsSection({ contacts }) {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [failures, setFailures] = useState([])
  const [error, setError] = useState('')
  const [resumeWarning, setResumeWarning] = useState('')

  async function handleGenerate(selected) {
    setError('')
    setResumeWarning('')
    setFailures([])
    setDrafts([])

    if (selected.length === 0) {
      setError('Select at least one contact to generate drafts.')
      return
    }

    setGenerating(true)
    const { ok, status, data } = await apiPost('/api/emails/generate', {
      contacts: selected.map((c) => ({
        email: c.email,
        name: c.name,
        title: c.title,
        company: c.company,
      })),
    })
    setGenerating(false)

    if (ok && data?.success) {
      setDrafts(data.drafts || [])
      setFailures(data.failures || [])
      if (data.resumeWarning) setResumeWarning(data.resumeWarning)
      if ((data.drafts || []).length === 0) {
        setError('No drafts could be generated. See the details below.')
      }
      return
    }

    if (status === 401) {
      setError('Your session has expired. Please log in again.')
    } else {
      setError(data?.message || 'Draft generation failed. Please try again.')
    }
  }

  return (
    <>
      <ContactPreview
        contacts={contacts}
        onGenerate={handleGenerate}
        generating={generating}
      />

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {resumeWarning && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {resumeWarning} A general outreach email was written instead.
        </div>
      )}

      {failures.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-medium">Some drafts could not be generated:</p>
          <ul className="mt-1 list-disc pl-5">
            {failures.map((f) => (
              <li key={f.contactEmail}>
                {f.contactEmail}: {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Generated Drafts</h2>
          {drafts.map((draft) => (
            <DraftEditor
              key={draft.contactEmail}
              draft={draft}
              resumeUrl={user?.resumeUrl}
            />
          ))}
        </div>
      )}
    </>
  )
}
