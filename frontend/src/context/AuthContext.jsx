import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiGet, apiPost } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load the current user from the session cookie.
  const refresh = useCallback(async () => {
    const { ok, data } = await apiGet('/api/auth/me')
    setUser(ok && data?.user ? data.user : null)
    setLoading(false)
    return ok && data?.user ? data.user : null
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await apiPost('/api/auth/logout')
    setUser(null)
  }, [])

  const value = { user, loading, refresh, logout, setUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
