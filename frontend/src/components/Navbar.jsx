import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-card">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}
