import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import profileRouter from './routes/profile.js'
import hrRouter from './routes/hr.js'
import emailsRouter from './routes/emails.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

// Build and configure the Express application.
export function createApp() {
  const app = express()

  // Behind a proxy in production (needed for secure cookies).
  app.set('trust proxy', 1)

  // Allow credentialed requests from the frontend origin only.
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  )

  // Parse JSON bodies and cookies.
  app.use(express.json())
  app.use(cookieParser())

  // Reasonable limit on authentication endpoints.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })

  // Limit search/scraping and import requests (they hit external services).
  const hrLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })

  // API routes
  app.use('/api', healthRouter)
  app.use('/api/auth', authLimiter, authRouter)
  app.use('/api/profile', profileRouter)
  app.use('/api/hr', hrLimiter, hrRouter)
  app.use('/api/emails', hrLimiter, emailsRouter)

  // 404 handler for unknown routes
  app.use(notFound)

  // Centralized error handler (must be last)
  app.use(errorHandler)

  return app
}
