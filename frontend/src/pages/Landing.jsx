import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Discover HR contacts and prepare personalized outreach
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              HireReach AI helps you find relevant HR contacts and organize
              personalized outreach emails in one place. Build your profile,
              collect contacts, and prepare drafts before you reach out.
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
        </section>

        <section className="border-t border-slate-200 bg-card">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="text-xl font-semibold text-slate-900">
              How it works
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              A simple workflow to help you plan your outreach. These features
              are being built and will become available as the product grows.
            </p>

            <div className="mt-8 space-y-6">
              <Step
                number="1"
                title="Find HR contacts"
                description="Search for HR contacts on the web or import an existing list from a public Google Sheet."
              />
              <Step
                number="2"
                title="Prepare personalized emails"
                description="Use your profile details to prepare tailored outreach drafts before sending."
              />
              <Step
                number="3"
                title="Track your outreach"
                description="Keep an overview of your prepared and sent emails from a single dashboard."
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
    <div className="flex gap-4">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-medium text-brand">
        {number}
      </div>
      <div>
        <h3 className="text-base font-medium text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}
