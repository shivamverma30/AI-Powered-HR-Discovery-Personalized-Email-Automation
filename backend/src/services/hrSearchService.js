import * as cheerio from 'cheerio'
import robotsParser from 'robots-parser'
import { webSearch, isSearchConfigured } from './searchProvider.js'
import { fetchText } from '../lib/safeFetch.js'
import { extractJob, scoreJobRelevance } from '../lib/jobExtraction.js'
import { extractRecruiterContacts } from '../lib/recruiterExtraction.js'

// Responsible scraping limits.
const MAX_PAGES = 8 // how many discovered pages we visit at most
const PAGE_TIMEOUT_MS = 8000
const USER_AGENT = 'HireReachAI/1.0 (+job-discovery)'

// Known applicant tracking systems / reputable job hosts (job-detail friendly).
const ATS_HOSTS = [
  'greenhouse.io', 'lever.co', 'workday', 'myworkdayjobs.com',
  'smartrecruiters.com', 'ashbyhq.com', 'jobvite.com', 'icims.com',
  'taleo.net', 'successfactors', 'recruitee.com', 'workable.com',
  'bamboohr.com', 'teamtailor.com', 'jobs.',
]

// Platforms we should not scrape via automated access.
const RESTRICTED_HOSTS =
  /linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|glassdoor\.com/

// Build job-focused search queries from the provided criteria.
export function buildJobQueries({ company, jobTitle, category, location }) {
  const parts = [company, jobTitle, category, location].filter(Boolean)
  const base = parts.join(' ').trim()
  const queries = []

  if (base) {
    queries.push(`${base} careers job opening`)
    queries.push(`${base} hiring apply`)
  }
  // Company-anchored queries even when only company is provided.
  if (company) {
    const role = [jobTitle, category].filter(Boolean).join(' ')
    if (role) queries.push(`${company} ${role} job ${location || ''}`.trim())
    queries.push(`${company} careers ${location || ''}`.trim())
  }

  // De-duplicate.
  return [...new Set(queries)].slice(0, 4)
}

// Rank a candidate result URL: prefer ATS/job-detail pages, drop restricted.
export function scoreUrl(url, title = '') {
  const u = url.toLowerCase()
  const t = (title || '').toLowerCase()
  let score = 0

  if (RESTRICTED_HOSTS.test(u)) return -100

  if (ATS_HOSTS.some((h) => u.includes(h))) score += 5
  // Job-detail URL shapes (an id/slug after a jobs path) beat generic pages.
  if (/\/(jobs?|careers?|opening|vacan|position)s?\/[^/]+/.test(u)) score += 3
  else if (/careers?|jobs?|hiring|recruit/.test(u)) score += 1
  if (/job|hiring|career|position|opening|developer|engineer/.test(t)) score += 1
  // Slight penalty for obvious listing/index pages.
  if (/\/(careers?|jobs?)\/?$/.test(u)) score -= 1

  return score
}

async function isAllowedByRobots(pageUrl) {
  try {
    const { origin } = new URL(pageUrl)
    const robotsUrl = `${origin}/robots.txt`
    const res = await fetchText(robotsUrl, { timeoutMs: 5000, maxBytes: 256 * 1024 })
    if (!res.ok || !res.body) return true
    const robots = robotsParser(robotsUrl, res.body)
    return robots.isAllowed(pageUrl, USER_AGENT) !== false
  } catch {
    return true
  }
}

// Scrape one page: extract a job (if present) and recruiter contacts.
async function scrapePage(pageUrl) {
  if (!(await isAllowedByRobots(pageUrl))) {
    return { skipped: 'robots' }
  }

  const res = await fetchText(pageUrl, {
    timeoutMs: PAGE_TIMEOUT_MS,
    maxBytes: 1024 * 1024,
    headers: { Accept: 'text/html' },
  })
  if (!res.ok || !res.body) {
    return { skipped: 'inaccessible' }
  }

  const $ = cheerio.load(res.body)
  const job = extractJob($, pageUrl)
  const recruiters = extractRecruiterContacts($, pageUrl, res.body)
  return { skipped: null, job, recruiters }
}

// Main entry: discover job postings + public recruiter contacts.
export async function searchJobsAndRecruiters(criteria) {
  if (!isSearchConfigured()) {
    const err = new Error('Web search is not configured on the server')
    err.code = 'SEARCH_NOT_CONFIGURED'
    throw err
  }

  // 1) Discover candidate pages with job-focused queries.
  const queries = buildJobQueries(criteria)
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

  // 2) Rank and keep the most promising job pages.
  const ranked = candidates
    .map((r) => ({ ...r, urlScore: scoreUrl(r.link, r.title) }))
    .filter((r) => r.urlScore > -50)
    .sort((a, b) => b.urlScore - a.urlScore)
    .slice(0, MAX_PAGES)

  if (ranked.length === 0) {
    return {
      jobs: [],
      contacts: [],
      pagesVisited: 0,
      message: 'No relevant job openings found for this search.',
    }
  }

  // 3) Scrape sequentially (polite). Collect jobs + recruiter contacts.
  const jobs = []
  const recruiterByEmail = new Map()
  let pagesVisited = 0

  for (const page of ranked) {
    let result
    try {
      result = await scrapePage(page.link)
    } catch {
      continue
    }
    if (result.skipped) continue
    pagesVisited += 1

    const { job, recruiters } = result

    if (job && job.title) {
      const { score, reasons } = scoreJobRelevance(job, criteria)
      // Attach the first recruiter found on the same page (if any).
      const pageRecruiter = recruiters[0] || null
      jobs.push({
        ...job,
        company: job.company || criteria.company || null,
        relevanceScore: score,
        matchReasons: reasons,
        recruiter: pageRecruiter,
      })
    }

    // Collect recruiter contacts (deduped by email), tagging job context.
    for (const rec of recruiters) {
      if (recruiterByEmail.has(rec.email)) continue
      recruiterByEmail.set(rec.email, {
        ...rec,
        company: job?.company || criteria.company || null,
        relatedJobTitle: job?.title || null,
      })
    }
  }

  // 4) Sort jobs by relevance; keep a reasonable cap.
  jobs.sort((a, b) => b.relevanceScore - a.relevanceScore)
  const topJobs = jobs.slice(0, 25)

  // 5) Build a flat contacts array compatible with the Groq generate flow.
  // Each contact carries email + name + title + company + source, plus the
  // related job title (used to personalize the email).
  const contacts = [...recruiterByEmail.values()].map((rec) => ({
    email: rec.email,
    name: rec.name, // null (never guessed)
    title: rec.title, // null
    company: rec.company,
    jobTitle: rec.relatedJobTitle,
    sourceUrl: rec.sourceUrl,
    source: 'Recruiter contact',
    contactType: rec.contactType,
    verification: rec.verification,
    emailStatus: 'found',
  }))

  const message =
    topJobs.length === 0
      ? 'No relevant job openings found for this search.'
      : null

  return { jobs: topJobs, contacts, pagesVisited, message }
}
