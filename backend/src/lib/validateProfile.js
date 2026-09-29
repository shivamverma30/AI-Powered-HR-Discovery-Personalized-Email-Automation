// Backend validation for profile data. Returns { valid, errors, data }.
// errors is a map of field -> message so the frontend can show them inline.

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isGithubUrl(value) {
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname.toLowerCase().replace(/^www\./, '') === 'github.com'
    )
  } catch {
    return false
  }
}

function isGoogleDriveUrl(value) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    const isDriveHost =
      host === 'drive.google.com' ||
      host === 'docs.google.com' ||
      host.endsWith('.googleusercontent.com')
    return (url.protocol === 'http:' || url.protocol === 'https:') && isDriveHost
  } catch {
    return false
  }
}

export function validateProfile(body) {
  const errors = {}

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const collegeName =
    typeof body.collegeName === 'string' ? body.collegeName.trim() : ''
  const githubUrl =
    typeof body.githubUrl === 'string' ? body.githubUrl.trim() : ''
  const resumeUrl =
    typeof body.resumeUrl === 'string' ? body.resumeUrl.trim() : ''
  const portfolioUrl =
    typeof body.portfolioUrl === 'string' ? body.portfolioUrl.trim() : ''

  if (!name) {
    errors.name = 'Full name is required'
  }

  if (!collegeName) {
    errors.collegeName = 'College name is required'
  }

  if (!githubUrl) {
    errors.githubUrl = 'GitHub profile URL is required'
  } else if (!isGithubUrl(githubUrl)) {
    errors.githubUrl = 'Enter a valid GitHub URL (github.com)'
  }

  if (!resumeUrl) {
    errors.resumeUrl = 'Google Drive resume URL is required'
  } else if (!isGoogleDriveUrl(resumeUrl)) {
    errors.resumeUrl = 'Enter a valid Google Drive link'
  }

  // Portfolio is optional, but if provided it must be a valid URL.
  if (portfolioUrl && !isHttpUrl(portfolioUrl)) {
    errors.portfolioUrl = 'Enter a valid URL'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      collegeName,
      githubUrl,
      resumeUrl,
      portfolioUrl: portfolioUrl || null,
    },
  }
}
