import { useEffect, useRef } from 'react'

// Accessible confirmation dialog shown before sending an email.
export default function SendConfirmDialog({
  recipient,
  subject,
  sending,
  error,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape' && !sending) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sending, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h2 id="send-dialog-title" className="text-lg font-semibold text-slate-900">
          Send this email?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          This will send the email through your connected Gmail account.
        </p>

        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">To</dt>
            <dd className="text-slate-900">{recipient}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Subject</dt>
            <dd className="text-slate-900">{subject}</dd>
          </div>
        </dl>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}
