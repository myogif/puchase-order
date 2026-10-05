import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Package } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultRoute } from '../../utils/permissions'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi')
      return
    }

    setLoading(true)
    const user = login(username, password)
    if (!user) {
      setError('Username atau password salah')
      setLoading(false)
      return
    }

    navigate(getDefaultRoute(user.role), { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Roti Distributor</h1>
            <p className="text-gray-500 mt-1">Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Masukkan username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Masukkan password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Demo Accounts</p>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between px-2">
                <span>Manager:</span>
                <span className="font-mono">manager / manager123</span>
              </div>
              <div className="flex justify-between px-2">
                <span>Kasir:</span>
                <span className="font-mono">kasir / kasir123</span>
              </div>
              <div className="flex justify-between px-2">
                <span>Admin:</span>
                <span className="font-mono">admin / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
