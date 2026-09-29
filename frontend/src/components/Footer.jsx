export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-slate-200 bg-card">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <span>HireReach AI</span>
        <span>&copy; {year} HireReach AI. All rights reserved.</span>
      </div>
    </footer>
  )
}
