import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout.jsx'
import GmailPanel from '../components/GmailPanel.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useGmail } from '../hooks/useGmail.js'

const gmailMessages = {
  connected: { type: 'success', text: 'Gmail connected successfully.' },
  cancelled: { type: 'error', text: 'Gmail connection was cancelled.' },
  invalid: { type: 'error', text: 'The Gmail connection request was invalid. Please try again.' },
  failed: { type: 'error', text: 'Gmail connection failed. Please try again.' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const gmail = useGmail()
  const [params, setParams] = useSearchParams()
  const [banner, setBanner] = useState(null)

  // Handle the ?gmail=... status returned from the OAuth callback.
  useEffect(() => {
    const status = params.get('gmail')
    if (status && gmailMessages[status]) {
      setBanner(gmailMessages[status])
      if (status === 'connected') gmail.refresh()
      params.delete('gmail')
      setParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Collect HR contacts, prepare drafts, and send them from your Gmail.
      </p>

      {banner && (
        <div
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            banner.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="mt-6">
        <GmailPanel
          connection={gmail.connection}
          usage={gmail.usage}
          loading={gmail.loading}
          connect={gmail.connect}
          disconnect={gmail.disconnect}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <OptionCard
          title="Search HR using Web Scraping"
          description="Find HR contacts across the web based on a company name."
          onOpen={() => navigate('/hr/search')}
        />
        <OptionCard
          title="Import HR Contacts using Google Sheets"
          description="Bring in an existing list of contacts from a public Google Sheet."
          onOpen={() => navigate('/hr/import')}
        />
      </div>
    </DashboardLayout>
  )
}

function OptionCard({ title, description, onOpen }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-card p-5">
      <h2 className="text-base font-medium text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Open
      </button>
    </div>
  )
}
