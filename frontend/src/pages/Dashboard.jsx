import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Choose how you want to collect HR contacts to start your outreach.
      </p>

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
