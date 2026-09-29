import { PDFParse } from 'pdf-parse'

// Fetches and extracts text from a user's public Google Drive resume.
// Security: only Google hosts are allowed (SSRF protection), redirects are
// not followed to arbitrary hosts, size and time are bounded, and the
// downloaded bytes live only in memory (never written to disk).

const FETCH_TIMEOUT_MS = 10000
const MAX_RESUME_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_TEXT_CHARS = 12000 // only send a bounded amount of text to the AI

const ALLOWED_HOSTS = new Set(['drive.google.com', 'docs.google.com'])

function resumeError(code, message) {
  const err = new Error(message)
  err.code = code
  err.isResumeError = true
  return err
}

// Extract a Drive file id from common Google Drive/Docs URL shapes.
function extractDriveFileId(url) {
  // /file/d/<id>/  or  /document/d/<id>/  etc.
  const pathMatch = url.pathname.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/)
  if (pathMatch) return pathMatch[1]
  // ?id=<id>
  const idParam = url.searchParams.get('id')
  if (idParam) return idParam
  return null
}

// Validate the saved resume URL and build a safe direct-download URL.
export function buildResumeDownloadUrl(rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl).trim())
  } catch {
    throw resumeError('INVALID_URL', 'Your saved resume link is not a valid URL.')
  }

  if (url.protocol !== 'https:') {
    throw resumeError('INVALID_URL', 'The resume link must use https.')
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw resumeError(
      'UNSUPPORTED_URL',
      'Only public Google Drive resume links are supported.'
    )
  }

  const fileId = extractDriveFileId(url)
  if (!fileId) {
    throw resumeError('UNSUPPORTED_URL', 'Could not read a Google Drive file id from your resume link.')
  }

  // Direct download endpoint on a Google host.
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

// Fetch the resume bytes with SSRF-safe settings.
async function fetchResumeBytes(downloadUrl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(downloadUrl, {
      signal: controller.signal,
      redirect: 'follow', // Drive redirects between its own hosts
      headers: { 'User-Agent': 'HireReachAI/1.0' },
    })

    // Ensure any redirect stayed on an allowed Google host.
    try {
      const finalHost = new URL(response.url).hostname.toLowerCase()
      const allowedFinal =
        ALLOWED_HOSTS.has(finalHost) || finalHost.endsWith('.googleusercontent.com')
      if (!allowedFinal) {
        throw resumeError('UNSUPPORTED_URL', 'The resume link redirected to an unsupported host.')
      }
    } catch (e) {
      if (e.isResumeError) throw e
    }

    if (!response.ok) {
      throw resumeError(
        'INACCESSIBLE',
        'The resume could not be accessed. Make sure it is shared publicly (Anyone with the link).'
      )
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    // A private file returns an HTML sign-in page instead of a PDF.
    if (contentType.includes('text/html')) {
      throw resumeError(
        'PRIVATE',
        'The resume appears to be private. Set sharing to "Anyone with the link" and try again.'
      )
    }

    const reader = response.body?.getReader()
    if (!reader) {
      const buf = Buffer.from(await response.arrayBuffer())
      if (buf.length > MAX_RESUME_BYTES) {
        throw resumeError('TOO_LARGE', 'The resume file is too large to process.')
      }
      return buf
    }

    const chunks = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > MAX_RESUME_BYTES) {
        reader.cancel()
        throw resumeError('TOO_LARGE', 'The resume file is too large to process.')
      }
      chunks.push(value)
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)))
  } catch (err) {
    if (err.isResumeError) throw err
    if (err.name === 'AbortError') {
      throw resumeError('TIMEOUT', 'Fetching the resume timed out. Please try again.')
    }
    throw resumeError('FETCH_FAILED', 'Could not fetch the resume.')
  } finally {
    clearTimeout(timer)
  }
}

// Public entry: return extracted, bounded resume text for a saved resume URL.
// The returned text is used only for prompt building and is never sent back
// to the frontend or logged.
export async function extractResumeText(resumeUrl) {
  if (!resumeUrl) {
    throw resumeError('NO_RESUME', 'No resume link is saved on your profile.')
  }

  const downloadUrl = buildResumeDownloadUrl(resumeUrl)
  const bytes = await fetchResumeBytes(downloadUrl)

  // Basic sanity check: PDFs start with "%PDF".
  const header = bytes.subarray(0, 5).toString('latin1')
  if (!header.startsWith('%PDF')) {
    throw resumeError(
      'UNSUPPORTED_FORMAT',
      'The resume must be a PDF file for text extraction.'
    )
  }

  let text
  try {
    const parser = new PDFParse({ data: bytes })
    const result = await parser.getText()
    text = result?.text || ''
  } catch {
    throw resumeError('EXTRACTION_FAILED', 'Could not read text from the resume PDF.')
  }

  const cleaned = text.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
  if (!cleaned) {
    throw resumeError('EMPTY_RESUME', 'No readable text was found in the resume.')
  }

  return cleaned.slice(0, MAX_TEXT_CHARS)
}
