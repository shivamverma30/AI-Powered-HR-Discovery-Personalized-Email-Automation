import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Simple full-screen loading state to avoid incorrect redirects while
// the current user is still being loaded.
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  )
}

// Requires authentication AND a completed profile.
// Sends unauthenticated users to login and incomplete profiles to completion.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (!user.profileCompleted) return <Navigate to="/profile/complete" replace />

  return children
}

// Requires authentication only (used for the profile completion page).
// If the profile is already complete, send the user to the dashboard.
export function RequireAuthOnly({ children, redirectCompleted = false }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (redirectCompleted && user.profileCompleted) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// For login/signup: authenticated users are redirected away.
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (user) {
    return (
      <Navigate to={user.profileCompleted ? '/dashboard' : '/profile/complete'} replace />
    )
  }

  return children
}
