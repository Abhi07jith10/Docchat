import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api'
import GridBackground from '../components/GridBackground'

function Signup() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [glow, setGlow] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await registerUser(username, email, password)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', response.data.username)
      navigate('/app')
    } catch (err) {
      setError('Signup failed. Try a different username.')
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() })
    setTimeout(() => setGlow(null), 500)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GridBackground />

      <form
        onSubmit={handleSubmit}
        onClick={handleCardClick}
        className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 rounded-xl shadow-lg w-80"
      >
        {glow && (
          <span
            className="absolute w-56 h-56 rounded-full bg-blue-400 dark:bg-blue-500 opacity-25 blur-2xl pointer-events-none transition-opacity duration-500"
            style={{ left: glow.x - 112, top: glow.y - 112 }}
          />
        )}

        <div className="relative">
          <h1 className="text-2xl font-semibold mb-1 text-center text-gray-900 dark:text-gray-100">Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Get started with DocChat</p>

          {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <p className="text-sm text-center mt-4 text-gray-600 dark:text-gray-400">
            Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Log in</Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Signup