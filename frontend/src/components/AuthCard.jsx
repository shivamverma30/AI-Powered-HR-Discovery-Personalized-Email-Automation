import Logo from './Logo.jsx'

// Shared layout for the login and signup pages.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        <div className="rounded-lg border border-slate-200 bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
