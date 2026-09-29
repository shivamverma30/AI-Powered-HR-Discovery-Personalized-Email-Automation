import { useContactSelection, MAX_SELECTION } from '../hooks/useContactSelection.js'

// Shared preview table for both scraped and imported contacts.
// Each contact: { name, email, title, company, sourceUrl, source, emailStatus }.
export default function ContactPreview({ contacts }) {
  const selection = useContactSelection()

  if (!contacts || contacts.length === 0) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {contacts.length} contact{contacts.length === 1 ? '' : 's'} found.
          Select up to {MAX_SELECTION}.
        </p>
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
        </div>
      </div>

      {selection.limitReached && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You can select a maximum of {MAX_SELECTION} contacts.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th>Select</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Title</Th>
              <Th>Company</Th>
              <Th>Source</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {contacts.map((contact, index) => {
              const key = contact.email ? `${contact.email}-${index}` : `row-${index}`
              return (
                <tr key={key}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selection.isSelected(key)}
                      onChange={() => selection.toggle(key)}
                      aria-label={`Select ${contact.name || contact.email || 'contact'}`}
                    />
                  </td>
                  <Td value={contact.name} />
                  <Td value={contact.email} />
                  <Td value={contact.title} />
                  <Td value={contact.company} />
                  <td className="px-3 py-2 text-slate-700">
                    <SourceCell contact={contact} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
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

function SourceCell({ contact }) {
  if (contact.sourceUrl) {
    return (
      <a
        href={contact.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="text-brand hover:underline"
      >
        {contact.source || 'View source'}
      </a>
    )
  }
  if (contact.source) return contact.source
  return <span className="text-slate-400">Not available</span>
}
