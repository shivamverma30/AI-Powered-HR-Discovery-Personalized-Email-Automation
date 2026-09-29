import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import GoogleButton from '../components/GoogleButton.jsx'

export default function Login() {
  return (
    <AuthCard title="Log in" subtitle="Access your HireReach AI account">
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
