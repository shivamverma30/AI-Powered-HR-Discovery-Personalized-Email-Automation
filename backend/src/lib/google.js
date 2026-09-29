import { OAuth2Client } from 'google-auth-library'
import { config } from '../config.js'

// Single OAuth2 client configured for the server-side authorization code flow.
const oauthClient = new OAuth2Client({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: config.google.callbackUrl,
})

const SCOPES = ['openid', 'email', 'profile']

// Build the Google consent screen URL. `state` protects against CSRF.
export function getGoogleAuthUrl(state) {
  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: SCOPES,
    state,
  })
}

// Exchange the authorization code for tokens and verify the ID token.
// Returns the verified Google profile, or throws on failure.
export async function verifyGoogleCode(code) {
  const { tokens } = await oauthClient.getToken(code)

  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token')
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.google.clientId,
  })

  const payload = ticket.getPayload()
  if (!payload) {
    throw new Error('Could not read Google identity')
  }

  return {
    googleId: payload.sub, // stable, verified account identifier
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name || null,
  }
}
