import { Link, useSearchParams } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

const errorMessages = {
  cancelled: 'Google sign in was cancelled. Please try again.',
  invalid: 'The sign in request was invalid. Please try again.',
  unverified: 'Your Google email is not verified.',
  failed: 'Google sign in failed. Please try again.',
}

export default function Login() {
  const [params] = useSearchParams()
  const errorKey = params.get('error')
  const errorMessage = errorKey ? errorMessages[errorKey] || errorMessages.failed : null

  return (
    <AuthCard title="Log in" subtitle="Access your HireReach AI account">
      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <GoogleButton label="Continue with Google" />
      <p className="mt-6 text-center text-sm text-slate-600">
        Do not have an account?{' '}
        <Link to="/signup" className="font-medium text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  )
}
