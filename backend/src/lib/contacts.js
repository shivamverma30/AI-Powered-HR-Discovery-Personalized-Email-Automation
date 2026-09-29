// Shared helpers for contact email validation, normalization, and dedup.

// Reasonable email format check. Format validity does NOT prove the address
// exists or is deliverable - it only rejects clearly malformed input.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  if (typeof value !== 'string') return false
  const email = value.trim()
  if (email.length === 0 || email.length > 254) return false
  return EMAIL_REGEX.test(email)
}

// Normalize a single string field: trim, collapse whitespace, or null.
function cleanField(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.length > 0 ? trimmed : null
}

// Build a normalized contact. Unknown fields become null (never fabricated).
// emailStatus is one of: 'found' (email present + valid format) or
// 'invalid' (email present but malformed). Callers decide whether to keep
// invalid ones.
export function normalizeContact({ name, email, title, company, sourceUrl, source }) {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : null
  const hasEmail = cleanEmail && cleanEmail.length > 0
  const valid = hasEmail && isValidEmail(cleanEmail)

  return {
    name: cleanField(name),
    email: valid ? cleanEmail : hasEmail ? cleanEmail : null,
    title: cleanField(title),
    company: cleanField(company),
    sourceUrl: cleanField(sourceUrl),
    source: source || null,
    // 'found' = present and valid format; 'invalid' = present but malformed.
    emailStatus: valid ? 'found' : hasEmail ? 'invalid' : 'not_found',
  }
}

// Remove duplicate contacts by email (case-insensitive). Keeps the first seen.
// Contacts without an email are all kept (cannot dedup reliably).
export function dedupeByEmail(contacts) {
  const seen = new Set()
  const result = []
  for (const contact of contacts) {
    if (!contact.email) {
      result.push(contact)
      continue
    }
    const key = contact.email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(contact)
  }
  return result
}
