import { Link } from 'react-router-dom'

// Simple text-based brand mark. No icon libraries needed.
export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="text-lg font-semibold text-brand">
      HireReach AI
    </Link>
  )
}
