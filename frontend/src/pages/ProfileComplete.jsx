import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import Logo from '../components/Logo.jsx'

export default function ProfileComplete() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  function handleSaved(profile) {
    setUser(profile)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-card">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
          <Logo to="/profile/complete" />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Complete Your Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user?.email}. Add a few details to finish setting up your
          account.
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-card p-6">
          <ProfileForm
            initial={user || {}}
            submitLabel="Save and Continue"
            onSaved={handleSaved}
          />
        </div>
      </main>
    </div>
  )
}
