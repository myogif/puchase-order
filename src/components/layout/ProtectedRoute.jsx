import { Navigate } from 'react-router-dom'
import { hasPermission } from '../../utils/permissions'

export default function ProtectedRoute({ children, permission }) {
  const stored = localStorage.getItem('auth_user')
  if (!stored) {
    return <Navigate to="/login" replace />
  }

  if (permission) {
    const user = JSON.parse(stored)
    if (!hasPermission(user.role, permission)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300">403</h1>
            <p className="mt-4 text-xl text-gray-600">Akses Ditolak</p>
            <p className="mt-2 text-gray-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            <a href="/" className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Kembali ke Beranda
            </a>
          </div>
        </div>
      )
    }
  }

  return children
}
