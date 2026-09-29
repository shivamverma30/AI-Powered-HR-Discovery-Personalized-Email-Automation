import * as cheerio from 'cheerio'
import robotsParser from 'robots-parser'
import { webSearch, isSearchConfigured } from './searchProvider.js'
import { fetchText } from '../lib/safeFetch.js'
import { isValidEmail, normalizeContact, dedupeByEmail } from '../lib/contacts.js'

// Responsible scraping limits.
const MAX_PAGES = 6 // how many discovered pages we visit at most
const PAGE_TIMEOUT_MS = 8000
const USER_AGENT = 'HireReachAI/1.0 (+contact-discovery)'

// Pages likely to list team/recruitment contacts get searched for.
function buildQueries(company) {
  const c = company.trim()
  return [
    `${c} careers team HR contact email`,
    `${c} recruitment contact email`,
  ]
}

// Prefer pages that look like team / careers / contact pages.
function scoreUrl(url) {
  const u = url.toLowerCase()
  let score = 0
  if (/careers?|jobs|recruit/.test(u)) score += 3
  if (/team|people|about|leadership/.test(u)) score += 2
  if (/contact/.test(u)) score += 2
  // Deprioritize aggregators / restricted platforms we should not scrape.
  if (/linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|indeed\.com|glassdoor\.com/.test(u)) {
    score -= 100
  }
  return score
}

// Check robots.txt for the given URL. Returns true if allowed (or unknown).
async function isAllowedByRobots(pageUrl) {
  try {
    const { origin } = new URL(pageUrl)
    const robotsUrl = `${origin}/robots.txt`
    const res = await fetchText(robotsUrl, { timeoutMs: 5000, maxBytes: 256 * 1024 })
    if (!res.ok || !res.body) return true // no robots.txt => allowed
    const robots = robotsParser(robotsUrl, res.body)
    const allowed = robots.isAllowed(pageUrl, USER_AGENT)
    return allowed !== false
  } catch {
    return true // if robots cannot be read, do not block
  }
}

// Extract emails that literally appear on the page (text or mailto links).
function extractEmails($, html) {
  const emails = new Set()

  // mailto: links are the most reliable signal.
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const addr = href.replace(/^mailto:/i, '').split('?')[0].trim()
    if (isValidEmail(addr)) emails.add(addr.toLowerCase())
  })

  // Plain-text emails in the page body.
  const textMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  for (const m of textMatches) {
    if (isValidEmail(m)) emails.add(m.toLowerCase())
  }

  return [...emails]
}

// Scrape a single page and return contacts found there (emails only, plus
// page title as best-effort source). Names/titles are left null unless a
// clear mailto anchor text looks like a name; we stay conservative.
async function scrapePage(pageUrl, company) {
  if (!(await isAllowedByRobots(pageUrl))) {
    return { skipped: 'robots', contacts: [] }
  }

  const res = await fetchText(pageUrl, {
    timeoutMs: PAGE_TIMEOUT_MS,
    maxBytes: 1024 * 1024,
    headers: { Accept: 'text/html' },
  })

  if (!res.ok || !res.body) {
    return { skipped: 'inaccessible', contacts: [] }
  }

  const $ = cheerio.load(res.body)
  const pageTitle = ($('title').first().text() || '').trim() || null
  const emails = extractEmails($, res.body)

  const contacts = emails.map((email) =>
    normalizeContact({
      name: null, // not reliably attributable; do not guess
      email,
      title: null,
      company,
      sourceUrl: pageUrl,
      source: pageTitle || 'web',
    })
  )

  return { skipped: null, contacts, pageTitle }
}

// Main entry: discover pages via search, scrape a limited set responsibly,
// and return validated, de-duplicated contacts that were actually found.
export async function searchHrContacts(company) {
  if (!isSearchConfigured()) {
    const err = new Error('Web search is not configured on the server')
    err.code = 'SEARCH_NOT_CONFIGURED'
    throw err
  }

  // 1) Discover candidate pages.
  const queries = buildQueries(company)
  const resultsPerQuery = await Promise.all(
    queries.map((q) => webSearch(q, { limit: 10 }).catch(() => []))
  )

  const seenUrls = new Set()
  const candidates = []
  for (const results of resultsPerQuery) {
    for (const r of results) {
      if (seenUrls.has(r.link)) continue
      seenUrls.add(r.link)
      candidates.push(r)
    }
  }

  // 2) Rank and keep only eligible pages (drop restricted platforms).
  const ranked = candidates
    .map((r) => ({ ...r, score: scoreUrl(r.link) }))
    .filter((r) => r.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PAGES)

  if (ranked.length === 0) {
    return { contacts: [], pagesVisited: 0, message: 'No eligible public pages were found for this company.' }
  }

  // 3) Scrape sequentially (limit concurrency to be polite).
  const allContacts = []
  let pagesVisited = 0
  for (const page of ranked) {
    try {
      const { contacts, skipped } = await scrapePage(page.link, company)
      if (!skipped) pagesVisited += 1
      allContacts.push(...contacts)
    } catch {
      // Skip pages that error out (timeout, network) and continue.
      continue
    }
  }

  // 4) Keep only valid emails, dedupe, cap the list.
  const valid = allContacts.filter((c) => c.emailStatus === 'found')
  const deduped = dedupeByEmail(valid).slice(0, 25)

  return {
    contacts: deduped,
    pagesVisited,
    message:
      deduped.length === 0
        ? 'No HR contact emails were found in the accessible public sources.'
        : null,
  }
}
