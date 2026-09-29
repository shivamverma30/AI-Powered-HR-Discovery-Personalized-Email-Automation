import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import ContactPreview from '../components/ContactPreview.jsx'
import { apiPost } from '../lib/api.js'

export default function HrSearch() {
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { contacts, message }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    const trimmed = company.trim()
    if (!trimmed) {
      setError('Please enter a company name.')
      return
    }

    setLoading(true)
    const { ok, status, data } = await apiPost('/api/hr/search', { company: trimmed })
    setLoading(false)

    if (ok && data?.success) {
      setResult({ contacts: data.contacts || [], message: data.message })
      return
    }

    if (status === 401) {
      setError('Your session has expired. Please log in again.')
    } else {
      setError(data?.message || 'The search could not be completed. Please try again.')
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">
        Search HR using Web Scraping
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter a company name to look for publicly available HR contact
        information. Only details found in accessible public sources are shown.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg">
        <label htmlFor="company" className="block text-sm font-medium text-slate-700">
          Company Name
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Google"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="whitespace-nowrap rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Searching...' : 'Search HR'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 max-w-lg rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Searching public sources, this can take a few seconds...
        </p>
      )}

      {result && result.contacts.length === 0 && (
        <div className="mt-4 max-w-lg rounded-md border border-slate-200 bg-card px-3 py-2 text-sm text-slate-600">
          {result.message || 'No HR contacts were found for this company.'}
        </div>
      )}

      {result && result.contacts.length > 0 && (
        <ContactPreview contacts={result.contacts} />
      )}
    </DashboardLayout>
  )
}
