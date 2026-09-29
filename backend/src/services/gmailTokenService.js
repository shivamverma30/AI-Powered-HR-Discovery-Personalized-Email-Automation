import { prisma } from '../lib/prisma.js'
import { encrypt, decrypt } from '../lib/crypto.js'
import { refreshAccessToken } from '../lib/gmailOAuth.js'

// Refresh a bit before actual expiry to avoid edge-of-expiry failures.
const EXPIRY_SKEW_MS = 60 * 1000

function gmailError(code, message) {
  const err = new Error(message)
  err.code = code
  err.isGmailError = true
  return err
}

// Save (create or update) a user's Gmail connection with encrypted tokens.
// Preserves an existing refresh token if Google did not return a new one.
export async function saveGmailConnection(userId, { gmailEmail, tokens }) {
  const existing = await prisma.gmailConnection.findUnique({ where: { userId } })

  const accessTokenEncrypted = encrypt(tokens.access_token)
  const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null

  // Only overwrite the refresh token when Google actually returns one.
  let refreshTokenEncrypted = existing?.refreshTokenEncrypted || null
  if (tokens.refresh_token) {
    refreshTokenEncrypted = encrypt(tokens.refresh_token)
  }

  const data = {
    gmailEmail,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    tokenExpiry,
    status: 'connected',
  }

  if (existing) {
    return prisma.gmailConnection.update({ where: { userId }, data })
  }
  return prisma.gmailConnection.create({ data: { userId, ...data } })
}

// Return a public view of the connection (never includes tokens).
export function toConnectionView(conn) {
  if (!conn || conn.status !== 'connected') {
    return { connected: false }
  }
  return { connected: true, gmailEmail: conn.gmailEmail }
}

export async function getConnection(userId) {
  return prisma.gmailConnection.findUnique({ where: { userId } })
}

// Return a valid access token for the user, refreshing if needed.
// Throws a tagged error if not connected or the refresh token is revoked.
export async function getValidAccessToken(userId) {
  const conn = await prisma.gmailConnection.findUnique({ where: { userId } })
  if (!conn || conn.status !== 'connected') {
    throw gmailError('NOT_CONNECTED', 'Gmail is not connected.')
  }

  const notExpired =
    conn.tokenExpiry && conn.tokenExpiry.getTime() - EXPIRY_SKEW_MS > Date.now()
  if (notExpired) {
    return decrypt(conn.accessTokenEncrypted)
  }

  // Need to refresh.
  if (!conn.refreshTokenEncrypted) {
    await markInvalid(userId)
    throw gmailError('NO_REFRESH_TOKEN', 'Gmail session expired. Please reconnect Gmail.')
  }

  let refreshToken
  try {
    refreshToken = decrypt(conn.refreshTokenEncrypted)
  } catch {
    await markInvalid(userId)
    throw gmailError('TOKEN_DECRYPT_FAILED', 'Stored Gmail token could not be read. Please reconnect Gmail.')
  }

  try {
    const { accessToken, expiryDate } = await refreshAccessToken(refreshToken)
    await prisma.gmailConnection.update({
      where: { userId },
      data: {
        accessTokenEncrypted: encrypt(accessToken),
        tokenExpiry: expiryDate,
        status: 'connected',
      },
    })
    return accessToken
  } catch {
    // Refresh token likely revoked or invalid.
    await markInvalid(userId)
    throw gmailError('REFRESH_FAILED', 'Gmail access was revoked. Please reconnect Gmail.')
  }
}

async function markInvalid(userId) {
  await prisma.gmailConnection
    .update({ where: { userId }, data: { status: 'invalid' } })
    .catch(() => {})
}

// Remove the user's Gmail connection (disconnect).
export async function disconnectGmail(userId) {
  await prisma.gmailConnection.deleteMany({ where: { userId } })
}
