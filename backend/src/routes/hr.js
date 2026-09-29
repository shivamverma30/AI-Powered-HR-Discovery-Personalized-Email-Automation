import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { searchHrContacts } from '../services/hrSearchService.js'
import { importContactsFromSheet } from '../services/sheetsImportService.js'

const router = Router()

// POST /api/hr/search - discover HR contacts for a company via web search.
router.post('/search', requireAuth, async (req, res, next) => {
  try {
    const company = typeof req.body?.company === 'string' ? req.body.company.trim() : ''

    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: 'Company name is required.' })
    }
    if (company.length > 100) {
      return res
        .status(400)
        .json({ success: false, message: 'Company name is too long.' })
    }

    const result = await searchHrContacts(company)
    return res.json({
      success: true,
      company,
      contacts: result.contacts,
      pagesVisited: result.pagesVisited,
      message: result.message || null,
    })
  } catch (err) {
    if (err.code === 'SEARCH_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        message: 'Web search is not configured on the server yet.',
      })
    }
    if (err.code === 'SEARCH_PROVIDER_ERROR') {
      return res.status(502).json({
        success: false,
        message: 'The search provider is currently unavailable. Please try again later.',
      })
    }
    return next(err)
  }
})

// POST /api/hr/import-sheet - import contacts from a public Google Sheet URL.
router.post('/import-sheet', requireAuth, async (req, res, next) => {
  try {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''

    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: 'A Google Sheets URL is required.' })
    }

    const result = await importContactsFromSheet(url)
    return res.json({
      success: true,
      contacts: result.contacts,
      total: result.total,
      skippedInvalid: result.skippedInvalid,
    })
  } catch (err) {
    // Import errors carry a code and a user-safe message.
    if (err.isImportError) {
      const status =
        err.code === 'PRIVATE_OR_INACCESSIBLE'
          ? 403
          : err.code === 'TIMEOUT'
            ? 504
            : 400
      return res.status(status).json({ success: false, message: err.message })
    }
    return next(err)
  }
})

export default router
