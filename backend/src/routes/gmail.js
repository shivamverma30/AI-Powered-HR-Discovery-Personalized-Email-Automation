import { Router } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { config, isProduction } from '../config.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { getGmailAuthUrl, exchangeGmailCode } from '../lib/gmailOAuth.js'
import {
  saveGmailConnection,
  getConnection,
  toConnectionView,
  disconnectGmail,
} from '../services/gmailTokenService.js'
import { isEncryptionConfigured } from '../lib/crypto.js'
import { getUsage } from '../services/dailyLimitService.js'

const router = Router()

const GMAIL_STATE_COOKIE = 'hirereach_gmail_state'

const stateCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 10 * 60 * 1000,
  path: '/',
}

// GET /api/gmail/connect - start the Gmail connection flow (authenticated).
router.get('/connect', requireAuth, (req, res) => {
  if (!isEncryptionConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Gmail sending is not configured on the server (missing encryption key).',
    })
  }

  // State binds the flow to this user + a random nonce (CSRF protection).
  const nonce = crypto.randomBytes(16).toString('hex')
  const state = jwt.sign({ uid: req.user.id, nonce }, config.jwtSecret, {
    expiresIn: '10m',
  })
  res.cookie(GMAIL_STATE_COOKIE, nonce, stateCookieOptions)
  res.json({ success: true, url: getGmailAuthUrl(state) })
})

// GET /api/gmail/callback - handle Google's redirect for the Gmail flow.
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query
  const frontend = config.frontendUrl
  const done = (status) => res.redirect(`${frontend}/dashboard?gmail=${status}`)

  if (error) return done('cancelled')

  const nonce = req.cookies?.[GMAIL_STATE_COOKIE]
  res.clearCookie(GMAIL_STATE_COOKIE, { ...stateCookieOptions, maxAge: undefined })

  if (!code || !state || !nonce) return done('invalid')

  // Validate signed state and match the nonce cookie.
  let payload
  try {
    payload = jwt.verify(state, config.jwtSecret)
  } catch {
    return done('invalid')
  }
  if (payload.nonce !== nonce || !payload.uid) return done('invalid')

  try {
    const { tokens, gmailEmail } = await exchangeGmailCode(code)
    if (!tokens.access_token || !gmailEmail) return done('failed')

    await saveGmailConnection(payload.uid, { gmailEmail, tokens })
    return done('connected')
  } catch (err) {
    console.error('Gmail OAuth callback failed:', err.message)
    return done('failed')
  }
})

// GET /api/gmail/status - connection state for the authenticated user.
router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const conn = await getConnection(req.user.id)
    return res.json({ success: true, ...toConnectionView(conn) })
  } catch (err) {
    return next(err)
  }
})

// GET /api/gmail/usage - daily sending usage for the authenticated user.
router.get('/usage', requireAuth, async (req, res, next) => {
  try {
    const usage = await getUsage(req.user.id)
    return res.json({ success: true, ...usage })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/gmail/connection - disconnect Gmail (keeps sent history).
router.delete('/connection', requireAuth, async (req, res, next) => {
  try {
    await disconnectGmail(req.user.id)
    return res.json({ success: true, message: 'Gmail disconnected.' })
  } catch (err) {
    return next(err)
  }
})

export default router
