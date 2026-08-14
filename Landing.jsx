import { Link } from 'react-router-dom'
import { useTheme } from '../useTheme'
import { useState } from 'react'
import GridBackground from '../components/GridBackground'

function Landing() {
  const [isDark, setIsDark] = useTheme()
  const [glow, setGlow] = useState(null)

  const handleCardClick = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setGlow({ id, x: e.clientX - rect.left, y: e.clientY - rect.top })
    setTimeout(() => setGlow(null), 500)
  }

  const features = [
    { id: 1, icon: '🔍', title: 'Semantic search', desc: 'Finds the right answer by meaning, not just keyword matching.' },
    { id: 2, icon: '📎', title: 'Cited sources', desc: 'Every answer links back to the exact page it came from — no guessing.' },
    { id: 3, icon: '📁', title: 'Organized by document', desc: 'Chats are grouped per document, so history never gets confusing.' },
  ]

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <GridBackground />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="text-blue-600 dark:text-blue-400">📄</span>
          DocChat
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link
            to="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-3xl mx-auto text-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Chat with your documents
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Upload any PDF and ask questions in plain English. Get accurate, grounded
          answers — with the exact source page cited every time.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/signup"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-95"
          >
            Get started for free
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.id}
            onClick={(e) => handleCardClick(e, f.id)}
            className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer transition-transform hover:-translate-y-0.5"
          >
            {glow?.id === f.id && (
              <span
                className="absolute w-40 h-40 rounded-full bg-blue-400 dark:bg-blue-500 opacity-30 blur-2xl pointer-events-none transition-opacity duration-500"
                style={{ left: glow.x - 80, top: glow.y - 80 }}
              />
            )}
            <div className="relative text-2xl mb-3">{f.icon}</div>
            <h3 className="relative font-semibold mb-1">{f.title}</h3>
            <p className="relative text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        Built by Abhijith S Sanal
      </footer>
    </div>
  )
}

export default Landing