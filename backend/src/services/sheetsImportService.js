import { parse } from 'csv-parse/sync'
import { fetchText } from '../lib/safeFetch.js'
import { normalizeContact, dedupeByEmail } from '../lib/contacts.js'

const MAX_SHEET_BYTES = 2 * 1024 * 1024 // 2 MB
const FETCH_TIMEOUT_MS = 8000
const MAX_ROWS = 1000

// Only these hosts are allowed (SSRF protection).
const ALLOWED_HOSTS = new Set(['docs.google.com'])

// Custom error with a code, so the route can map to a helpful message.
function importError(code, message) {
  const err = new Error(message)
  err.code = code
  err.isImportError = true
  return err
}

// Validate the URL and extract the spreadsheet id + optional gid.
// Accepts standard Google Sheets URLs on docs.google.com only.
export function parseSheetUrl(rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl).trim())
  } catch {
    throw importError('INVALID_URL', 'That does not look like a valid URL.')
  }

  if (url.protocol !== 'https:') {
    throw importError('INVALID_URL', 'The spreadsheet URL must use https.')
  }

  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw importError(
      'UNSUPPORTED_URL',
      'Only public Google Sheets links (docs.google.com) are supported.'
    )
  }

  // Expected path: /spreadsheets/d/<ID>/...
  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) {
    throw importError('UNSUPPORTED_URL', 'This is not a Google Sheets URL.')
  }

  const spreadsheetId = match[1]

  // gid may live in the hash (#gid=123) or query (?gid=123).
  let gid = url.searchParams.get('gid')
  if (!gid && url.hash) {
    const hashMatch = url.hash.match(/gid=([0-9]+)/)
    if (hashMatch) gid = hashMatch[1]
  }

  return { spreadsheetId, gid: gid || null }
}

// Build the CSV export URL from the spreadsheet id (docs.google.com only).
function buildCsvExportUrl({ spreadsheetId, gid }) {
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
  return gid ? `${base}&gid=${gid}` : base
}

// Map header names case-insensitively, ignoring surrounding whitespace.
// Only the known columns are mapped; unrelated columns are ignored.
const COLUMN_ALIASES = {
  sno: 'sno',
  's.no': 'sno',
  'sr no': 'sno',
  name: 'name',
  email: 'email',
  title: 'title',
  designation: 'title',
  company: 'company',
}

function mapHeaders(headerRow) {
  const map = {}
  headerRow.forEach((raw, index) => {
    const key = String(raw || '').trim().toLowerCase()
    const mapped = COLUMN_ALIASES[key]
    if (mapped && !(mapped in map)) {
      map[mapped] = index
    }
  })
  return map
}

// Fetch and parse a public Google Sheet into validated, de-duplicated contacts.
export async function importContactsFromSheet(rawUrl) {
  const parsed = parseSheetUrl(rawUrl)
  const csvUrl = buildCsvExportUrl(parsed)

  // Fetch the CSV. Do not follow redirects to arbitrary hosts: a private sheet
  // redirects to a Google login page, which we detect and reject.
  let res
  try {
    res = await fetchText(csvUrl, {
      timeoutMs: FETCH_TIMEOUT_MS,
      maxBytes: MAX_SHEET_BYTES,
      redirect: 'manual',
      headers: { Accept: 'text/csv' },
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw importError('TIMEOUT', 'The spreadsheet took too long to load. Try again.')
    }
    throw importError('FETCH_FAILED', 'Could not fetch the spreadsheet.')
  }

  // A manual redirect (3xx) or non-200 means the sheet is not publicly readable.
  if (!res.ok || res.status >= 300) {
    throw importError(
      'PRIVATE_OR_INACCESSIBLE',
      'The spreadsheet is private or inaccessible. Set sharing to "Anyone with the link" as Viewer.'
    )
  }

  return parseContactsFromCsv(res.body || '')
}

// Parse CSV text into validated, de-duplicated contacts.
// Separated from the fetch so it can be tested without network access.
export function parseContactsFromCsv(csvText) {
  if (!csvText.trim()) {
    throw importError('EMPTY_SHEET', 'The spreadsheet appears to be empty.')
  }

  // Parse CSV robustly (handles quotes, commas, empty cells).
  let rows
  try {
    rows = parse(csvText, {
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    })
  } catch {
    throw importError('MALFORMED_CSV', 'The spreadsheet data could not be parsed.')
  }

  if (!rows.length) {
    throw importError('EMPTY_SHEET', 'The spreadsheet appears to be empty.')
  }

  const headerMap = mapHeaders(rows[0])

  if (!('email' in headerMap)) {
    throw importError(
      'MISSING_COLUMNS',
      'The spreadsheet must include an "Email" column.'
    )
  }

  const dataRows = rows.slice(1, MAX_ROWS + 1)
  const contacts = []
  let invalidEmailCount = 0

  for (const row of dataRows) {
    const get = (field) =>
      headerMap[field] !== undefined ? row[headerMap[field]] : null

    const email = get('email')
    if (!email || !String(email).trim()) continue // skip rows with no email

    const contact = normalizeContact({
      name: get('name'),
      email,
      title: get('title'),
      company: get('company'),
      sourceUrl: null,
      source: 'Google Sheets',
    })

    if (contact.emailStatus !== 'found') {
      invalidEmailCount += 1
      continue // drop malformed emails
    }

    contacts.push(contact)
  }

  const deduped = dedupeByEmail(contacts)

  if (deduped.length === 0) {
    throw importError(
      'NO_VALID_EMAILS',
      'No valid email addresses were found in the spreadsheet.'
    )
  }

  return {
    contacts: deduped,
    total: deduped.length,
    skippedInvalid: invalidEmailCount,
  }
}
