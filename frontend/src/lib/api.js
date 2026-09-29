// Central place for the backend API base URL.
// Configured through the Vite environment variable VITE_API_URL.
// Falls back to the local backend during development.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Simple helper for future API calls (used in later stages).
export async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}
