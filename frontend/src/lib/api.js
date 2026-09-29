// Central place for the backend API base URL.
// Configured through the Vite environment variable VITE_API_URL.
// Falls back to the local backend during development.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Start the Google OAuth flow by sending the browser to the backend.
export function goToGoogleLogin() {
  window.location.href = `${API_URL}/api/auth/google`
}

// Fetch wrapper that always sends the session cookie.
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  return { ok: response.ok, status: response.status, data }
}

export function apiGet(path) {
  return request(path, { method: 'GET' })
}

export function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body || {}) })
}

export function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body || {}) })
}
