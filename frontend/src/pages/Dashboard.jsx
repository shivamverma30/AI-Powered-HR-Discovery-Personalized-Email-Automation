import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'emails', label: 'My Emails' },
  { key: 'profile', label: 'Profile' },
]

export default function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
          <div className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
            0/30 emails sent today
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
            {navItems.map((item) => (
              <SidebarItem
                key={item.key}
                label={item.label}
                active={item.key === 'dashboard'}
              />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
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

function SidebarItem({ label, active }) {
  return (
    <button
      type="button"
      className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
        active
          ? 'bg-slate-100 font-medium text-slate-900'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
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
