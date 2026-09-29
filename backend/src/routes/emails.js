import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { isValidEmail } from '../lib/contacts.js'
import { extractResumeText } from '../services/resumeService.js'
import { generateDraftForContact } from '../services/emailGenerationService.js'
import { isGrokConfigured } from '../services/grokService.js'

const router = Router()

const MAX_CONTACTS = 5

// Map internal error codes to a user-safe message.
function messageForError(err) {
  const map = {
    GROK_NOT_CONFIGURED: 'AI email generation is not configured on the server yet.',
    GROK_ACCESS_DENIED:
      'The AI service rejected the request. Check that the Grok API key is valid and the account has credits.',
    GROK_RATE_LIMIT: 'The AI service is busy right now. Please try again shortly.',
    GROK_TIMEOUT: 'The AI request timed out. Please try again.',
    AI_INVALID_JSON: 'The AI returned an unexpected response. Please try again.',
    AI_INCOMPLETE: 'The AI response was incomplete. Please try again.',
  }
  if (err.isResumeError) return err.message
  return map[err.code] || 'Could not generate the email. Please try again.'
}

// Normalize one incoming contact from the frontend selection.
function cleanContact(c) {
  if (!c || typeof c !== 'object') return null
  const email = typeof c.email === 'string' ? c.email.trim().toLowerCase() : ''
  if (!isValidEmail(email)) return null
  return {
    email,
    name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : null,
    title: typeof c.title === 'string' && c.title.trim() ? c.title.trim() : null,
    company: typeof c.company === 'string' && c.company.trim() ? c.company.trim() : null,
    jobTitle: typeof c.jobTitle === 'string' && c.jobTitle.trim() ? c.jobTitle.trim() : null,
  }
}

// Load the authenticated user's profile and best-effort resume text.
// Resume failure is non-fatal: we still generate a general outreach email.
async function loadUserContext(user) {
  const profile = {
    name: user.name,
    collegeName: user.collegeName,
    githubUrl: user.githubUrl,
    portfolioUrl: user.portfolioUrl,
    resumeUrl: user.resumeUrl,
  }

  let resumeText = null
  let resumeWarning = null
  try {
    resumeText = await extractResumeText(user.resumeUrl)
  } catch (err) {
    resumeWarning = err.isResumeError ? err.message : 'Resume could not be read.'
  }

  return { profile, resumeText, resumeWarning }
}

// POST /api/emails/generate - generate drafts for up to 5 contacts.
router.post('/generate', requireAuth, async (req, res, next) => {
  try {
    if (!isGrokConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'AI email generation is not configured on the server yet.',
      })
    }

    const rawContacts = Array.isArray(req.body?.contacts) ? req.body.contacts : []
    if (rawContacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one contact.' })
    }
    if (rawContacts.length > MAX_CONTACTS) {
      return res.status(400).json({
        success: false,
        message: `You can generate at most ${MAX_CONTACTS} drafts at once.`,
      })
    }

    const contacts = rawContacts.map(cleanContact).filter(Boolean)
    if (contacts.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'The selected contacts have no valid email addresses.' })
    }

    const { profile, resumeText, resumeWarning } = await loadUserContext(req.user)

    // Generate sequentially to avoid rate limits. Handle partial failures.
    const drafts = []
    const failures = []
    for (const contact of contacts) {
      try {
        const draft = await generateDraftForContact({ profile, resumeText, contact })
        drafts.push(draft)
      } catch (err) {
        failures.push({ contactEmail: contact.email, message: messageForError(err) })
      }
    }

    return res.json({
      success: true,
      drafts,
      failures,
      resumeWarning,
    })
  } catch (err) {
    return next(err)
  }
})

// POST /api/emails/regenerate - regenerate a single draft (recipient locked).
router.post('/regenerate', requireAuth, async (req, res, next) => {
  try {
    if (!isGrokConfigured()) {
      return res
        .status(503)
        .json({ success: false, message: 'AI email generation is not configured on the server yet.' })
    }

    const contact = cleanContact(req.body?.contact)
    if (!contact) {
      return res
        .status(400)
        .json({ success: false, message: 'A valid contact is required to regenerate.' })
    }

    const { profile, resumeText } = await loadUserContext(req.user)
    const draft = await generateDraftForContact({ profile, resumeText, contact })
    return res.json({ success: true, draft })
  } catch (err) {
    if (err.code || err.isResumeError) {
      return res.status(502).json({ success: false, message: messageForError(err) })
    }
    return next(err)
  }
})

// GET /api/emails - list the authenticated user's saved drafts.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const drafts = await prisma.emailDraft.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    })
    return res.json({ success: true, drafts })
  } catch (err) {
    return next(err)
  }
})

// Validate a draft payload for create/update.
function validateDraftBody(body) {
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const emailBody = typeof body?.body === 'string' ? body.body.trim() : ''
  const contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim().toLowerCase() : ''
  if (!subject || !emailBody) return { valid: false }
  return {
    valid: true,
    data: {
      subject,
      body: emailBody,
      contactEmail: isValidEmail(contactEmail) ? contactEmail : null,
      contactName: typeof body?.contactName === 'string' && body.contactName.trim() ? body.contactName.trim() : null,
      company: typeof body?.company === 'string' && body.company.trim() ? body.company.trim() : null,
    },
  }
}

// POST /api/emails - save a new draft for the authenticated user.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { valid, data } = validateDraftBody(req.body)
    if (!valid || !data.contactEmail) {
      return res
        .status(400)
        .json({ success: false, message: 'Subject, body, and a valid recipient are required.' })
    }

    const draft = await prisma.emailDraft.create({
      data: {
        userId: req.user.id,
        contactEmail: data.contactEmail,
        contactName: data.contactName,
        company: data.company,
        subject: data.subject,
        body: data.body,
        status: 'draft',
      },
    })
    return res.status(201).json({ success: true, draft })
  } catch (err) {
    return next(err)
  }
})

// PUT /api/emails/:id - update a draft (subject/body only), owner-scoped.
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.emailDraft.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Draft not found.' })
    }

    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : ''
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Subject and body are required.' })
    }

    // Only subject and body can change; recipient stays fixed.
    const draft = await prisma.emailDraft.update({
      where: { id: existing.id },
      data: { subject, body },
    })
    return res.json({ success: true, draft })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/emails/:id - delete a draft, owner-scoped.
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.emailDraft.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Draft not found.' })
    }
    await prisma.emailDraft.delete({ where: { id: existing.id } })
    return res.json({ success: true, message: 'Draft deleted.' })
  } catch (err) {
    return next(err)
  }
})

export default router
