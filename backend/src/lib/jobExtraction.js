// Extract structured job information from a job posting page.
// Primary source: schema.org JobPosting JSON-LD (used by most ATS and job
// boards). Falls back to <title>/<meta> when JSON-LD is absent.

function cleanText(value, maxLen = 1200) {
  if (typeof value !== 'string') return null
  const t = value.replace(/\s+/g, ' ').trim()
  if (!t) return null
  return t.length > maxLen ? `${t.slice(0, maxLen)}...` : t
}

// Strip HTML tags from a JSON-LD description (which may contain markup).
function stripHtml(value) {
  if (typeof value !== 'string') return null
  return cleanText(value.replace(/<[^>]+>/g, ' '))
}

// Collect all JSON-LD objects from the page (handles arrays and @graph).
function collectJsonLd($) {
  const nodes = []
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text()
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        if (item && typeof item === 'object') {
          if (Array.isArray(item['@graph'])) nodes.push(...item['@graph'])
          else nodes.push(item)
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  })
  return nodes
}

function isJobPostingNode(node) {
  const type = node?.['@type']
  if (!type) return false
  if (Array.isArray(type)) return type.some((t) => /JobPosting/i.test(String(t)))
  return /JobPosting/i.test(String(type))
}

// Normalize schema.org location shapes into a readable string.
function readLocation(jobLocation) {
  if (!jobLocation) return null
  const loc = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation
  const addr = loc?.address || loc
  if (typeof addr === 'string') return cleanText(addr)
  if (addr && typeof addr === 'object') {
    const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
      .map((p) => (typeof p === 'object' ? p?.name : p))
      .filter((p) => typeof p === 'string' && p.trim())
    return parts.length ? cleanText(parts.join(', ')) : null
  }
  return null
}

function readOrganization(hiringOrganization) {
  if (!hiringOrganization) return null
  if (typeof hiringOrganization === 'string') return cleanText(hiringOrganization)
  return cleanText(hiringOrganization?.name)
}

// Classify hiring status from JSON-LD evidence. Returns one of:
// open | expired | closed | unknown. Only 'open' when evidence supports it.
export function classifyStatus(job, now = new Date()) {
  // validThrough is the strongest signal.
  if (job.validThrough) {
    const validThrough = new Date(job.validThrough)
    if (!Number.isNaN(validThrough.getTime())) {
      return validThrough.getTime() < now.getTime() ? 'expired' : 'open'
    }
  }
  // A JobPosting with a datePosted but no expiry: we cannot be sure it is
  // still open, so report unknown rather than guessing.
  return 'unknown'
}

// Parse a single JobPosting JSON-LD node into our job shape.
function fromJsonLd(node, pageUrl) {
  const applyUrl =
    (node.applicationContact && node.applicationContact.url) ||
    (typeof node.url === 'string' ? node.url : null)

  return {
    title: cleanText(node.title) || null,
    company: readOrganization(node.hiringOrganization),
    location: readLocation(node.jobLocation) ||
      (node.applicantLocationRequirements
        ? readOrganization(node.applicantLocationRequirements)
        : null),
    description: stripHtml(node.description),
    employmentType: cleanText(
      Array.isArray(node.employmentType)
        ? node.employmentType.join(', ')
        : node.employmentType
    ),
    datePosted: cleanText(node.datePosted),
    validThrough: cleanText(node.validThrough),
    applyUrl: applyUrl && applyUrl !== pageUrl ? cleanText(applyUrl, 500) : null,
    status: classifyStatus(node),
    hasStructuredData: true,
  }
}

// Fallback when no JSON-LD: derive a title from <title>/og:title only.
function fromHtmlFallback($) {
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const title = cleanText(ogTitle) || cleanText($('title').first().text())
  return {
    title,
    company: null,
    location: null,
    description: cleanText($('meta[name="description"]').attr('content')),
    employmentType: null,
    datePosted: null,
    validThrough: null,
    applyUrl: null,
    status: 'unknown',
    hasStructuredData: false,
  }
}

// Public: extract a job object from a loaded cheerio document.
// Returns null if the page does not look like a job posting at all.
export function extractJob($, pageUrl) {
  const nodes = collectJsonLd($)
  const jobNode = nodes.find(isJobPostingNode)

  const domain = (() => {
    try {
      return new URL(pageUrl).hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  })()

  if (jobNode) {
    const job = fromJsonLd(jobNode, pageUrl)
    return { ...job, jobUrl: pageUrl, sourceDomain: domain, checkedAt: new Date().toISOString() }
  }

  const fallback = fromHtmlFallback($)
  // Only return a fallback "job" if the page title suggests a job posting.
  const looksLikeJob =
    fallback.title && /job|career|hiring|vacan|opening|position|role|developer|engineer/i.test(fallback.title)
  if (!looksLikeJob) return null

  return { ...fallback, jobUrl: pageUrl, sourceDomain: domain, checkedAt: new Date().toISOString() }
}

// Score how well a job matches the requested criteria (for relevance ranking).
// Returns { score, reasons }.
export function scoreJobRelevance(job, criteria) {
  let score = 0
  const reasons = []
  const hay = `${job.title || ''} ${job.company || ''} ${job.location || ''} ${job.description || ''}`.toLowerCase()

  if (criteria.company && hay.includes(criteria.company.toLowerCase())) {
    score += 3
    reasons.push('company match')
  }
  if (criteria.jobTitle && job.title && job.title.toLowerCase().includes(criteria.jobTitle.toLowerCase())) {
    score += 3
    reasons.push('job title match')
  }
  if (criteria.category && hay.includes(criteria.category.toLowerCase())) {
    score += 2
    reasons.push('category match')
  }
  if (criteria.location && hay.includes(criteria.location.toLowerCase())) {
    score += 2
    reasons.push('location match')
  }
  if (job.status === 'open') {
    score += 2
    reasons.push('open status')
  }
  if (job.hasStructuredData) score += 1

  return { score, reasons }
}
