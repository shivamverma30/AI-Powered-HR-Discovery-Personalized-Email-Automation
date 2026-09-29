// Extract PUBLIC recruiter/hiring contacts from a page.
// Strict relevance rules to avoid the old problem of returning generic
// support/alumni/sales addresses. We never guess or synthesize emails.

import { isValidEmail } from './contacts.js'

// Local-parts (before @) that signal recruitment/HR relevance.
const RECRUITER_LOCAL_PARTS = [
  'recruit', 'recruiting', 'recruiter', 'recruitment',
  'talent', 'talentacquisition', 'ta',
  'hiring', 'jobs', 'job', 'careers', 'career',
  'hr', 'humanresources', 'people', 'peopleops', 'staffing',
]

// Local-parts we explicitly reject even if they appear near hiring words.
const DENY_LOCAL_PARTS = [
  'support', 'help', 'helpdesk', 'sales', 'info', 'contact', 'admin',
  'billing', 'invoice', 'accounts', 'account', 'alumni', 'donations',
  'security', 'privacy', 'legal', 'press', 'media', 'marketing',
  'noreply', 'no-reply', 'donotreply', 'newsletter', 'webmaster',
  'abuse', 'postmaster', 'subscribe', 'unsubscribe', 'feedback',
]

// Titles/phrases that indicate a recruitment role, used to classify context.
const RECRUITER_TITLE_HINTS = [
  'recruiter', 'talent acquisition', 'hr recruiter', 'hiring manager',
  'recruitment', 'talent', 'people operations', 'hr manager',
  'technical recruiter', 'staffing',
]

function localPart(email) {
  return email.split('@')[0].toLowerCase().replace(/[._-]/g, '')
}

function isDenied(email) {
  const lp = localPart(email)
  return DENY_LOCAL_PARTS.some((d) => lp === d.replace(/[.-]/g, '') || lp.startsWith(d.replace(/[.-]/g, '')))
}

function looksRecruitment(email) {
  const lp = localPart(email)
  return RECRUITER_LOCAL_PARTS.some((r) => lp.includes(r))
}

// Given surrounding text, does it mention a recruitment role near the email?
function hasRecruiterContext(surroundingText) {
  const t = surroundingText.toLowerCase()
  return RECRUITER_TITLE_HINTS.some((h) => t.includes(h))
}

// Extract recruiter contacts from a loaded cheerio doc.
// Returns array of { email, name, title, contactType, sourceUrl, verification }.
// verification is always 'public_source' here (found in an accessible page).
export function extractRecruiterContacts($, pageUrl, html) {
  const bodyText = $('body').text() || ''
  const pageHasRecruiterContext = hasRecruiterContext(bodyText)
  const found = new Map()

  function consider(email, contextText) {
    const addr = email.trim().toLowerCase()
    if (!isValidEmail(addr)) return
    if (isDenied(addr)) return

    // Accept if the address itself looks recruitment-related, OR the page
    // clearly is a recruitment/careers context and the address is not denied.
    const relevant = looksRecruitment(addr) || (pageHasRecruiterContext && hasRecruiterContext(contextText || ''))
    if (!relevant) return

    if (!found.has(addr)) {
      found.set(addr, {
        email: addr,
        name: null, // never guessed
        title: null,
        contactType: looksRecruitment(addr) ? 'recruitment_address' : 'recruitment_context',
        sourceUrl: pageUrl,
        verification: 'public_source',
      })
    }
  }

  // mailto links (most reliable) with nearby text as context.
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const addr = href.replace(/^mailto:/i, '').split('?')[0]
    const context = `${$(el).text()} ${$(el).parent().text()}`
    consider(addr, context)
  })

  // Plain-text emails in the body.
  const textMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  for (const m of textMatches) {
    consider(m, bodyText)
  }

  return [...found.values()]
}

// Exposed for testing the relevance decision in isolation.
export const __test = { isDenied, looksRecruitment, hasRecruiterContext }
