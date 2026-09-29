import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import Logo from '../components/Logo.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)

  function handleSaved(profile) {
    setUser(profile)
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo to="/dashboard" />
          <Link
            to="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-brand"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-card p-6">
          {editing ? (
            <ProfileForm
              initial={user}
              submitLabel="Save Changes"
              onSaved={handleSaved}
            />
          ) : (
            <dl className="space-y-4">
              <Field label="Full Name" value={user?.name} />
              <Field label="Email" value={user?.email} />
              <Field label="College Name" value={user?.collegeName} />
              <Field label="GitHub Profile" value={user?.githubUrl} link />
              <Field label="Resume Link" value={user?.resumeUrl} link />
              <Field
                label="Portfolio"
                value={user?.portfolioUrl}
                link
                emptyText="Not provided"
              />
            </dl>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value, link = false, emptyText = '-' }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-slate-900">
        {value ? (
          link ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-slate-400">{emptyText}</span>
        )}
      </dd>
    </div>
  )
}
