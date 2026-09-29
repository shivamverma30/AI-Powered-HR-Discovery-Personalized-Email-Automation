import { useMemo, useState } from 'react'
import { useContactSelection, MAX_SELECTION } from '../hooks/useContactSelection.js'

// Renders discovered job postings + public recruiter contacts.
// Recruiter contacts can be selected (max 5) and passed to onGenerate.
//
// jobs: [{ title, company, location, status, jobUrl, applyUrl, sourceDomain,
//          employmentType, datePosted, checkedAt, matchReasons,
//          recruiter: { email, sourceUrl } | null }]
// contacts: [{ email, name, title, company, jobTitle, sourceUrl, verification }]
export default function JobResults({ jobs, contacts, onGenerate, generating = false }) {
  const selection = useContactSelection()
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [emailOnly, setEmailOnly] = useState(false)

  // A row per job; attach the recruiter contact (matched by job title/company).
  const rows = useMemo(() => {
    const byJobTitle = new Map()
    for (const c of contacts || []) {
      if (c.jobTitle && !byJobTitle.has(c.jobTitle)) byJobTitle.set(c.jobTitle, c)
    }
    return (jobs || []).map((job, index) => {
      const recruiter =
        job.recruiter ||
        (job.title && byJobTitle.get(job.title)) ||
        null
      return { job, recruiter, key: `${job.jobUrl || 'job'}-${index}` }
    })
  }, [jobs, contacts])

  const locations = useMemo(() => {
    const set = new Set()
    for (const { job } of rows) if (job.location) set.add(job.location)
    return [...set]
  }, [rows])

  const filtered = rows.filter(({ job, recruiter }) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false
    if (locationFilter !== 'all' && job.location !== locationFilter) return false
    if (categoryFilter) {
      const hay = `${job.title || ''} ${job.location || ''}`.toLowerCase()
      if (!hay.includes(categoryFilter.toLowerCase())) return false
    }
    if (emailOnly && !recruiter?.email) return false
    return true
  })

  function keyForRecruiter(recruiter, key) {
    return recruiter?.email ? `${recruiter.email}::${key}` : null
  }

  function handleGenerate() {
    if (!onGenerate) return
    const selected = []
    for (const { job, recruiter, key } of filtered) {
      const rk = keyForRecruiter(recruiter, key)
      if (rk && selection.isSelected(rk)) {
        selected.push({
          email: recruiter.email,
          name: recruiter.name || null,
          title: recruiter.title || null,
          company: recruiter.company || job.company || null,
          jobTitle: job.title || recruiter.jobTitle || null,
          sourceUrl: recruiter.sourceUrl || job.jobUrl || null,
        })
      }
    }
    onGenerate(selected)
  }

  if (!jobs || jobs.length === 0) return null

  return (
    <div className="mt-6">
      {/* Filters + selection controls */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Hiring status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              ['all', 'All statuses'],
              ['open', 'Open'],
              ['expired', 'Expired'],
              ['closed', 'Closed'],
              ['unknown', 'Unknown'],
            ]}
          />
          <FilterSelect
            label="Location"
            value={locationFilter}
            onChange={setLocationFilter}
            options={[['all', 'All locations'], ...locations.map((l) => [l, l])]}
          />
          <div>
            <label className="block text-xs font-medium text-slate-500">Category contains</label>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="e.g. Java"
              className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <label className="flex items-center gap-2 pb-1 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={emailOnly}
              onChange={(e) => setEmailOnly(e.target.checked)}
            />
            Recruiter email available
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            Selected: {selection.count}/{MAX_SELECTION}
          </span>
          <button
            type="button"
            onClick={selection.clear}
            disabled={selection.count === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Selection
          </button>
          {onGenerate && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={selection.count === 0 || generating}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? 'Generating...' : 'Generate Drafts'}
            </button>
          )}
        </div>
      </div>

      {selection.limitReached && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You can select a maximum of {MAX_SELECTION} recruiter contacts.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Select</Th>
              <Th>Job Title</Th>
              <Th>Company</Th>
              <Th>Location</Th>
              <Th>Hiring Status</Th>
              <Th>Recruiter Email</Th>
              <Th>Job Posting</Th>
              <Th>Contact Source</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map(({ job, recruiter, key }) => {
              const rk = keyForRecruiter(recruiter, key)
              return (
                <tr key={key}>
                  <td className="px-3 py-2">
                    {rk ? (
                      <input
                        type="checkbox"
                        checked={selection.isSelected(rk)}
                        onChange={() => selection.toggle(rk)}
                        aria-label={`Select recruiter for ${job.title || 'job'}`}
                      />
                    ) : (
                      <span className="text-xs text-slate-400" title="No recruiter email to select">-</span>
                    )}
                  </td>
                  <Td value={job.title} />
                  <Td value={job.company} />
                  <Td value={job.location} />
                  <td className="px-3 py-2">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-3 py-2">
                    {recruiter?.email ? (
                      <span className="text-slate-800">{recruiter.email}</span>
                    ) : (
                      <span className="text-slate-400">No public email found</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <ExternalLink url={job.jobUrl} label="View Job" />
                    {job.applyUrl && (
                      <>
                        {' · '}
                        <ExternalLink url={job.applyUrl} label="Apply" />
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {recruiter?.sourceUrl ? (
                      <ExternalLink url={recruiter.sourceUrl} label="View Source" />
                    ) : job.jobUrl ? (
                      <ExternalLink url={job.jobUrl} label="View Source" />
                    ) : (
                      <span className="text-slate-400">Source unavailable</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">
                  No jobs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </th>
  )
}

function Td({ value }) {
  return (
    <td className="px-3 py-2 text-slate-700">
      {value ? value : <span className="text-slate-400">Not available</span>}
    </td>
  )
}

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-green-100 text-green-700',
    expired: 'bg-amber-100 text-amber-700',
    closed: 'bg-red-100 text-red-700',
    unknown: 'bg-slate-100 text-slate-600',
  }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status] || styles.unknown}`}>
      {label}
    </span>
  )
}

function ExternalLink({ url, label }) {
  if (!url) return <span className="text-slate-400">Not available</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
      {label}
    </a>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </div>
  )
}
