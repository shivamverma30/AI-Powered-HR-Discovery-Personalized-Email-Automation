import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wide text-brand">
                HR outreach, organized
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                Discover HR contacts and prepare personalized outreach emails
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                HireReach AI helps you find relevant HR contacts, then drafts
                tailored outreach emails from your own profile and resume. You
                review and edit every draft before anything is sent.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="bg-card">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              A simple, step-by-step workflow to plan your outreach.
            </p>

            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <Step
                number="1"
                title="Find contacts"
                description="Search the web for HR contacts by company, or import an existing list from a public Google Sheet."
              />
              <Step
                number="2"
                title="Generate drafts"
                description="Create personalized email drafts based on your profile and resume, then edit or regenerate any of them."
              />
              <Step
                number="3"
                title="Save and review"
                description="Keep your drafts organized in one place and review them before you reach out."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-medium text-brand">
        {number}
      </div>
      <h3 className="mt-4 text-base font-medium text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  )
}
