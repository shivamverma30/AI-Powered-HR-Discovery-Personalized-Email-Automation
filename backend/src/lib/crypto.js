import crypto from 'crypto'
import { config } from '../config.js'

// AES-256-GCM encryption for OAuth tokens at rest.
// The key comes from TOKEN_ENCRYPTION_KEY (64 hex chars or base64, 32 bytes).
// Stored format: base64(iv).base64(authTag).base64(ciphertext)

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // recommended for GCM

let cachedKey = null

function getKey() {
  if (cachedKey) return cachedKey
  const raw = config.tokenEncryptionKey
  if (!raw) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }
  let key
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex')
  } else {
    key = Buffer.from(raw, 'base64')
  }
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64)')
  }
  cachedKey = key
  return key
}

// True when a valid encryption key is configured.
export function isEncryptionConfigured() {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}

export function encrypt(plainText) {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.')
}

export function decrypt(payload) {
  const key = getKey()
  const [ivB64, tagB64, dataB64] = String(payload).split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload')
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64')
  )
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
