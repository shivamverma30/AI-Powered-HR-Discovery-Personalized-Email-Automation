import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Profile', to: '/profile' },
]

// Shared dashboard chrome: top bar (email limit + logout) and sidebar.
export default function DashboardLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface">
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
        <aside
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } w-full md:block md:w-56 md:flex-none`}
        >
          <nav className="rounded-lg border border-slate-200 bg-card p-2">
            {navItems.map((item) => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    active
                      ? 'bg-slate-100 font-medium text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <span
              className="block cursor-not-allowed rounded-md px-3 py-2 text-sm text-slate-400"
              title="Available in a later stage"
            >
              My Emails
            </span>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
