import { grokJsonCompletion } from './grokService.js'
import { isValidEmail } from '../lib/contacts.js'

// System prompt: strict rules to avoid fabrication.
const SYSTEM_PROMPT = `You are an assistant that writes concise, professional job-outreach emails for a student or job seeker contacting a company's HR/recruiter.

Rules:
- Use ONLY the information provided. Never invent work experience, achievements, projects, certifications, job openings, HR names, or company relationships.
- If a field is missing, simply omit it naturally. Do not use placeholders like [Name].
- If the HR name is unavailable, use a neutral greeting such as "Hello" or "Dear Hiring Team".
- Keep the email professional and reasonably short (roughly 120-200 words).
- Naturally mention the company. Briefly introduce the sender using their real details and relevant skills/projects found in their resume text.
- Include the sender's resume link, and GitHub/portfolio links when available.
- End with a professional sign-off using the sender's name.
- Do not make aggressive, exaggerated, or misleading claims. Do not claim the sender already applied for a role.
- Return ONLY a JSON object with exactly these keys: "subject" (string) and "body" (string). No markdown, no extra keys.`

// Build the per-contact user prompt from real data only.
function buildUserPrompt({ profile, resumeText, contact }) {
  const lines = []

  lines.push('SENDER (use only what is present):')
  if (profile.name) lines.push(`- Full name: ${profile.name}`)
  if (profile.collegeName) lines.push(`- College: ${profile.collegeName}`)
  if (profile.githubUrl) lines.push(`- GitHub: ${profile.githubUrl}`)
  if (profile.portfolioUrl) lines.push(`- Portfolio: ${profile.portfolioUrl}`)
  if (profile.resumeUrl) lines.push(`- Resume link (include in email): ${profile.resumeUrl}`)

  lines.push('')
  lines.push('RECIPIENT (HR contact):')
  if (contact.name) lines.push(`- HR name: ${contact.name}`)
  lines.push(`- HR email: ${contact.email}`)
  if (contact.title) lines.push(`- HR designation: ${contact.title}`)
  if (contact.company) lines.push(`- Company: ${contact.company}`)
  if (contact.jobTitle) lines.push(`- Job title of interest: ${contact.jobTitle}`)

  lines.push('')
  if (resumeText) {
    lines.push('RESUME TEXT (extract relevant skills/projects/education, do not copy verbatim):')
    lines.push(resumeText)
  } else {
    lines.push('No resume text is available; write a general professional outreach email using the sender details above.')
  }

  lines.push('')
  lines.push('Write one email tailored to this recipient. Return JSON with "subject" and "body" only.')

  return lines.join('\n')
}

// Validate the model's JSON output. Returns { subject, body } or throws.
function parseDraftJson(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    const err = new Error('The AI returned an invalid response')
    err.code = 'AI_INVALID_JSON'
    throw err
  }

  const subject = typeof parsed.subject === 'string' ? parsed.subject.trim() : ''
  const body = typeof parsed.body === 'string' ? parsed.body.trim() : ''

  if (!subject || !body) {
    const err = new Error('The AI response was incomplete')
    err.code = 'AI_INCOMPLETE'
    throw err
  }

  return { subject, body }
}

// Generate a single draft for one contact.
// The recipient email is taken from the trusted contact input, NOT the model.
export async function generateDraftForContact({ profile, resumeText, contact }) {
  if (!isValidEmail(contact.email)) {
    const err = new Error('Contact email is invalid')
    err.code = 'INVALID_CONTACT'
    throw err
  }

  const userPrompt = buildUserPrompt({ profile, resumeText, contact })
  const raw = await grokJsonCompletion({ system: SYSTEM_PROMPT, user: userPrompt })
  const { subject, body } = parseDraftJson(raw)

  return {
    contactEmail: contact.email, // recipient locked to the selected contact
    contactName: contact.name || null,
    company: contact.company || null,
    subject,
    body,
  }
}
