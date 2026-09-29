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
  // Web search provider (Serper.dev). Optional: when absent, HR search
  // returns a clear "not configured" message instead of fabricating data.
  searchApiKey: process.env.SEARCH_API_KEY || '',
  // Groq API (groq.com) for email generation. OpenAI-compatible.
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  // Gmail OAuth for sending. Reuses the Google client credentials but with a
  // separate callback URL and the gmail.send scope only.
  gmail: {
    callbackUrl:
      process.env.GMAIL_CALLBACK_URL ||
      'http://localhost:4000/api/gmail/callback',
  },
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  // Key used to encrypt stored OAuth tokens (AES-256-GCM). 32 bytes,
  // provided as 64 hex chars or a base64 string. Never commit this.
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
  dailyEmailLimit: Number(process.env.DAILY_EMAIL_LIMIT || 30),
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
