/**
 * ProtectedRoute
 * Wraps routes that require authentication and/or a specific role.
 *
 * Usage:
 *   <ProtectedRoute>                    — must be logged in
 *   <ProtectedRoute role="admin">       — must be logged in AND role === admin
 *   <ProtectedRoute role="vendor">      — must be logged in AND role === vendor
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Wait for the silent-refresh check only if we don't yet have a user.
  // If user is already set (just logged in manually), skip the spinner.
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#FFFCF5' }}>
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-spin">🧶</span>
          <p className="text-sm font-medium" style={{ color: '#A07000' }}>Loading…</p>
        </div>
      </div>
    )
  }

  // Not logged in — send to login, remember where they came from
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Logged in but wrong role — send to home with a clear message
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
