import { Router } from 'express'

const router = Router()

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HireReach AI API is running',
  })
})

export default router
