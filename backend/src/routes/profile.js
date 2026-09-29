import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateProfile } from '../lib/validateProfile.js'
import { toUserView } from '../lib/userView.js'

const router = Router()

// GET /api/profile - return the authenticated user's profile.
router.get('/', requireAuth, (req, res) => {
  res.json({ success: true, profile: toUserView(req.user) })
})

// PUT /api/profile - create or update the authenticated user's profile.
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const { valid, errors, data } = validateProfile(req.body || {})

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the highlighted fields',
        errors,
      })
    }

    // Update only the authenticated user's own record (id from the session).
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: data.name,
        collegeName: data.collegeName,
        githubUrl: data.githubUrl,
        resumeUrl: data.resumeUrl,
        portfolioUrl: data.portfolioUrl,
        profileCompleted: true,
      },
    })

    res.json({ success: true, profile: toUserView(updated) })
  } catch (err) {
    next(err)
  }
})

export default router
