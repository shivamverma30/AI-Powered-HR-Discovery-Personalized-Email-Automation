import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-card">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 md:hidden"
              aria-label="Toggle navigation"
            >
              Menu
            </button>
            <Logo to="/dashboard" />
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
              0/30 emails sent today
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } w-full md:block md:w-56 md:flex-none`}
        >
          <nav className="rounded-lg border border-slate-200 bg-card p-2">
            <span className="block rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900">
              Dashboard
            </span>
            <span
              className="block cursor-not-allowed rounded-md px-3 py-2 text-sm text-slate-400"
              title="Available in a later stage"
            >
              My Emails
            </span>
            <Link
              to="/profile"
              className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Profile
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Choose how you want to collect HR contacts to start your outreach.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <OptionCard
              title="Search HR using Web Scraping"
              description="Find HR contacts across the web based on your search criteria."
            />
            <OptionCard
              title="Import HR Contacts using Google Sheets"
              description="Bring in an existing list of contacts from a public Google Sheet."
            />
          </div>
        </main>
      </div>
    </div>
  )
}

function OptionCard({ title, description }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-card p-5">
      <h2 className="text-base font-medium text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <button
        type="button"
        disabled
        title="Available in a later stage"
        className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Open
      </button>
    </div>
  )
}
