import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to home
      </Link>
    </div>
  )
}
