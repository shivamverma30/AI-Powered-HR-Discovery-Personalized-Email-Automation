import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import JobSearchResults from '../components/JobSearchResults.jsx'
import { apiPost } from '../lib/api.js'
import { JOB_CATEGORIES } from '../lib/jobCategories.js'

export default function HrSearch() {
  const [form, setForm] = useState({
    company: '',
    category: '',
    jobTitle: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { jobs, contacts, message }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    const company = form.company.trim()
    if (!company) {
      setError('Please enter a company name.')
      return
    }

    setLoading(true)
    const { ok, status, data } = await apiPost('/api/hr/search', {
      company,
      category: form.category === 'Other' ? '' : form.category,
      jobTitle: form.jobTitle.trim(),
      location: form.location.trim(),
    })
    setLoading(false)

    if (ok && data?.success) {
      setResult({
        jobs: data.jobs || [],
        contacts: data.contacts || [],
        message: data.message,
      })
      return
    }

    if (status === 401) setError('Your session has expired. Please log in again.')
    else setError(data?.message || 'The search could not be completed. Please try again.')
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">Find Jobs and Recruiters</h1>
      <p className="mt-1 text-sm text-slate-600">
        Search for relevant job openings and, where publicly available, the
        recruiters associated with them. Company name is required; the other
        fields refine your search.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-slate-700">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={form.company}
            onChange={handleChange}
            placeholder="e.g. Accenture"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Job Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="">Any category</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-700">
            Job Title
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            type="text"
            value={form.jobTitle}
            onChange={handleChange}
            placeholder="e.g. Java Developer"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. India"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 max-w-2xl rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">
          Searching public job sources, this can take a few seconds...
        </p>
      )}

      {result && result.jobs.length === 0 && (
        <div className="mt-4 max-w-2xl rounded-md border border-slate-200 bg-card px-3 py-2 text-sm text-slate-600">
          {result.message || 'No relevant job openings found.'}
        </div>
      )}

      {result && result.jobs.length > 0 && (
        <JobSearchResults jobs={result.jobs} contacts={result.contacts} />
      )}
    </DashboardLayout>
  )
}
