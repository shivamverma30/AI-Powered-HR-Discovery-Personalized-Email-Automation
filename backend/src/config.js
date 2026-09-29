import 'dotenv/config'

// Central configuration loaded from environment variables.
export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:4000/api/auth/google/callback',
  },
}

export const isProduction = config.nodeEnv === 'production'

// Fail fast if required secrets are missing, so problems surface at startup
// instead of during a request.
export function assertConfig() {
  const missing = []
  if (!config.jwtSecret) missing.push('JWT_SECRET')
  if (!config.google.clientId) missing.push('GOOGLE_CLIENT_ID')
  if (!config.google.clientSecret) missing.push('GOOGLE_CLIENT_SECRET')

  if (missing.length > 0) {
    console.warn(
      `Warning: missing environment variables: ${missing.join(', ')}. ` +
        'Google authentication will not work until these are set.'
    )
  }
}
