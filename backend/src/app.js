import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import healthRouter from './routes/health.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

// Build and configure the Express application.
export function createApp() {
  const app = express()

  // Allow requests from the frontend origin only.
  app.use(cors({ origin: config.frontendUrl }))

  // Parse JSON request bodies.
  app.use(express.json())

  // API routes
  app.use('/api', healthRouter)

  // 404 handler for unknown routes
  app.use(notFound)

  // Centralized error handler (must be last)
  app.use(errorHandler)

  return app
}
