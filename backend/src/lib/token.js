import jwt from 'jsonwebtoken'
import { config, isProduction } from '../config.js'

// Name of the cookie that holds the session JWT.
export const SESSION_COOKIE = 'hirereach_session'

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Create a signed JWT carrying only the user id.
export function signSession(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' })
}

// Verify a JWT and return its payload, or null if invalid/expired.
export function verifySession(token) {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }
}

// Consistent cookie options for setting and clearing the session cookie.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/',
  }
}
