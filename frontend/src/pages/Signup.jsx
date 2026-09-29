import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

export default function Signup() {
  return (
    <AuthCard title="Create your account" subtitle="Get started with HireReach AI">
      <GoogleButton label="Continue with Google" />
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}
