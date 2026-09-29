import 'dotenv/config'

// Central configuration loaded from environment variables.
export const config = {
  port: process.env.PORT || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}
