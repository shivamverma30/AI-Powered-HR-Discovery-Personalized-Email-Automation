import { useState } from 'react'
import FormField from './FormField.jsx'
import { apiPut } from '../lib/api.js'

// Client-side validation mirrors the backend rules.
function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Full name is required'
  if (!values.collegeName.trim()) errors.collegeName = 'College name is required'

  if (!values.githubUrl.trim()) {
    errors.githubUrl = 'GitHub profile URL is required'
  } else if (!/^https?:\/\/(www\.)?github\.com\//i.test(values.githubUrl.trim())) {
    errors.githubUrl = 'Enter a valid GitHub URL (github.com)'
  }

  if (!values.resumeUrl.trim()) {
    errors.resumeUrl = 'Google Drive resume URL is required'
  } else if (
    !/^https?:\/\/(drive|docs)\.google\.com\//i.test(values.resumeUrl.trim())
  ) {
    errors.resumeUrl = 'Enter a valid Google Drive link'
  }

  if (values.portfolioUrl.trim() && !/^https?:\/\//i.test(values.portfolioUrl.trim())) {
    errors.portfolioUrl = 'Enter a valid URL'
  }

  return errors
}

// Shared profile form used by the completion and edit pages.
// onSaved receives the updated profile returned by the API.
export default function ProfileForm({ initial, submitLabel, onSaved }) {
  const [values, setValues] = useState({
    name: initial.name || '',
    collegeName: initial.collegeName || '',
    githubUrl: initial.githubUrl || '',
    resumeUrl: initial.resumeUrl || '',
    portfolioUrl: initial.portfolioUrl || '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const clientErrors = validate(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSaving(true)
    const { ok, data } = await apiPut('/api/profile', values)
    setSaving(false)

    if (ok && data?.profile) {
      onSaved(data.profile)
      return
    }

    // Show field errors from the backend, plus a general message.
    if (data?.errors) setErrors(data.errors)
    setFormError(data?.message || 'Could not save your profile. Please try again.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <FormField
        label="Full Name"
        name="name"
        value={values.name}
        onChange={handleChange}
        error={errors.name}
        required
      />
      <FormField
        label="College Name"
        name="collegeName"
        value={values.collegeName}
        onChange={handleChange}
        error={errors.collegeName}
        required
      />
      <FormField
        label="GitHub Profile"
        name="githubUrl"
        value={values.githubUrl}
        onChange={handleChange}
        placeholder="https://github.com/username"
        error={errors.githubUrl}
        required
      />
      <FormField
        label="Public Google Drive Resume Link"
        name="resumeUrl"
        value={values.resumeUrl}
        onChange={handleChange}
        placeholder="https://drive.google.com/..."
        error={errors.resumeUrl}
        help="Make sure the link is shared publicly so it can be opened by anyone."
        required
      />
      <FormField
        label="Portfolio (Optional)"
        name="portfolioUrl"
        value={values.portfolioUrl}
        onChange={handleChange}
        placeholder="https://your-portfolio.com"
        error={errors.portfolioUrl}
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
