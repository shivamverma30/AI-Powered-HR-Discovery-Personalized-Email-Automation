import { OAuth2Client } from 'google-auth-library'
import { config } from '../config.js'

// Dedicated OAuth2 client for the Gmail connection flow.
// Reuses the Google client credentials but a separate callback URL and the
// gmail.send scope only (least privilege - no read/modify/delete).
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'openid',
  'email',
]

export function createGmailClient() {
  return new OAuth2Client({
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: config.gmail.callbackUrl,
  })
}

// Build the consent URL. access_type=offline + prompt=consent so Google
// returns a refresh token we can use for future sends.
export function getGmailAuthUrl(state) {
  const client = createGmailClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state,
  })
}

// Exchange the authorization code for tokens and read the connected Gmail
// address from the id_token. Returns { tokens, gmailEmail }.
export async function exchangeGmailCode(code) {
  const client = createGmailClient()
  const { tokens } = await client.getToken(code)

  let gmailEmail = null
  if (tokens.id_token) {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.google.clientId,
    })
    const payload = ticket.getPayload()
    gmailEmail = payload?.email || null
  }

  return { tokens, gmailEmail }
}

// Use a refresh token to obtain a fresh access token.
// Returns { accessToken, expiryDate } or throws.
export async function refreshAccessToken(refreshToken) {
  const client = createGmailClient()
  client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await client.refreshAccessToken()
  return {
    accessToken: credentials.access_token,
    expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  }
}
