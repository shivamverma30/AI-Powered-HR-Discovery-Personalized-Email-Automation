import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { config, isProduction } from '../config.js'
import { getGoogleAuthUrl, verifyGoogleCode } from '../lib/google.js'
import {
  SESSION_COOKIE,
  signSession,
  sessionCookieOptions,
} from '../lib/token.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { toUserView } from '../lib/userView.js'

const router = Router()

const STATE_COOKIE = 'hirereach_oauth_state'

const stateCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 10 * 60 * 1000, // 10 minutes
  path: '/',
}

// GET /api/auth/google - start the OAuth flow.
router.get('/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  res.cookie(STATE_COOKIE, state, stateCookieOptions)
  res.redirect(getGoogleAuthUrl(state))
})

// GET /api/auth/google/callback - handle Google's redirect back.
router.get('/google/callback', async (req, res, next) => {
  const { code, state, error } = req.query
  const frontend = config.frontendUrl

  // User cancelled or Google returned an error.
  if (error) {
    return res.redirect(`${frontend}/login?error=cancelled`)
  }

  // Validate state against the cookie (CSRF protection).
  const expectedState = req.cookies?.[STATE_COOKIE]
  res.clearCookie(STATE_COOKIE, { ...stateCookieOptions, maxAge: undefined })

  if (!code || !state || !expectedState || state !== expectedState) {
    return res.redirect(`${frontend}/login?error=invalid`)
  }

  try {
    const profile = await verifyGoogleCode(code)

    if (!profile.email || !profile.emailVerified) {
      return res.redirect(`${frontend}/login?error=unverified`)
    }

    // Find by verified Google id first, then fall back to email to avoid
    // creating a duplicate account for the same person.
    let user = await prisma.user.findUnique({
      where: { googleId: profile.googleId },
    })

    if (!user) {
      const byEmail = await prisma.user.findUnique({
        where: { email: profile.email },
      })

      if (byEmail) {
        // Link the Google id to the existing account.
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { googleId: profile.googleId },
        })
      } else {
        user = await prisma.user.create({
          data: {
            googleId: profile.googleId,
            email: profile.email,
            name: profile.name,
          },
        })
      }
    }

    // Create the application session.
    const token = signSession(user.id)
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions())

    // Redirect based on profile completeness.
    const destination = user.profileCompleted ? '/dashboard' : '/profile/complete'
    return res.redirect(`${frontend}${destination}`)
  } catch (err) {
    // Log without exposing the authorization code or token details.
    console.error('Google OAuth callback failed:', err.message)
    return res.redirect(`${frontend}/login?error=failed`)
  }
})

// GET /api/auth/me - return the currently authenticated user.
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: toUserView(req.user) })
})

// POST /api/auth/logout - clear the session cookie.
router.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined })
  res.json({ success: true, message: 'Logged out' })
})

export default router
