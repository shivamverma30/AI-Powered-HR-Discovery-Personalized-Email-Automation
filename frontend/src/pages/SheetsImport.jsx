import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import GenerateDraftsSection from '../components/GenerateDraftsSection.jsx'
import { apiPost } from '../lib/api.js'

export default function SheetsImport() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contacts, setContacts] = useState(null)
  const [skipped, setSkipped] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setContacts(null)
    setSkipped(0)

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please paste your public Google Sheets URL.')
      return
    }

    setLoading(true)
    const { ok, status, data } = await apiPost('/api/hr/import-sheet', { url: trimmed })
    setLoading(false)

    if (ok && data?.success) {
      setContacts(data.contacts || [])
      setSkipped(data.skippedInvalid || 0)
      return
    }

    if (status === 401) {
      setError('Your session has expired. Please log in again.')
    } else {
      setError(data?.message || 'The import could not be completed. Please try again.')
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">
        Import HR Contacts using Google Sheets
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Import contacts from a publicly shared Google Sheet. Follow the steps
        below.
      </p>

      {/* Step 1 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-card p-5">
        <h2 className="text-base font-medium text-slate-900">
          Step 1: Prepare your spreadsheet
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Use these columns. The <span className="font-medium">Email</span>{' '}
          column is required; the others are optional.
        </p>
        <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>SNo</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Title</Th>
                <Th>Company</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr>
                <Td>1</Td>
                <Td>Rahul Sharma</Td>
                <Td>rahul@example.com</Td>
                <Td>HR Recruiter</Td>
                <Td>Google</Td>
              </tr>
              <tr>
                <Td>2</Td>
                <Td>Priya Singh</Td>
                <Td>priya@example.com</Td>
                <Td>HR Manager</Td>
                <Td>Microsoft</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Step 2 */}
      <section className="mt-4 rounded-lg border border-slate-200 bg-card p-5">
        <h2 className="text-base font-medium text-slate-900">
          Step 2: Make your spreadsheet public
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Open Google Sheets.</li>
          <li>Open your HR contacts spreadsheet.</li>
          <li>Click Share.</li>
          <li>Select Anyone with the link.</li>
          <li>Set permission to Viewer.</li>
          <li>Copy the spreadsheet URL.</li>
        </ol>
      </section>

      {/* Step 3 */}
      <section className="mt-4 rounded-lg border border-slate-200 bg-card p-5">
        <h2 className="text-base font-medium text-slate-900">
          Step 3: Import contacts
        </h2>
        <form onSubmit={handleSubmit} className="mt-3">
          <label htmlFor="sheetUrl" className="block text-sm font-medium text-slate-700">
            Public Google Sheets URL
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              id="sheetUrl"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Importing...' : 'Import Contacts'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <p className="mt-4 text-sm text-slate-500">Fetching your spreadsheet...</p>
        )}
        {contacts && skipped > 0 && (
          <p className="mt-4 text-sm text-slate-500">
            {skipped} row{skipped === 1 ? '' : 's'} skipped due to invalid or
            missing email.
          </p>
        )}
      </section>

      {contacts && contacts.length > 0 && (
        <GenerateDraftsSection contacts={contacts} />
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

function Td({ children }) {
  return <td className="px-3 py-2 text-slate-700">{children}</td>
}
