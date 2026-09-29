import { prisma } from '../lib/prisma.js'
import { SESSION_COOKIE, verifySession } from '../lib/token.js'

// Protects routes: verifies the session cookie and attaches the user.
// The user id always comes from the verified token, never from the request body.
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE]
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    const payload = verifySession(token)
    if (!payload?.sub) {
      return res
        .status(401)
        .json({ success: false, message: 'Session expired or invalid' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
