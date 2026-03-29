/**
 * Notifications history — /notifications
 * Shows persisted notifications from the DB + real-time SSE updates.
 */

import { Link } from 'react-router-dom'
import { Bell, ArrowLeft } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper.jsx'
import { useNotifications } from '../hooks/useNotifications.js'

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

export default function Notifications() {
  const { notifications, markAllRead } = useNotifications()

  return (
    <PageWrapper title="Notifications">
      <div className="min-h-[calc(100vh-64px)] pt-20 pb-12" style={{ background: '#FFFCF5' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          <Link to="/" className="flex items-center gap-2 text-sm mb-6 hover:underline"
            style={{ color: '#C88B00' }}>
            <ArrowLeft size={14} /> Back
          </Link>

          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="font-serif font-bold text-2xl flex items-center gap-2" style={{ color: '#1C0A00' }}>
              <Bell size={22} style={{ color: '#C88B00' }} />
              Notifications
            </h1>
            {notifications.length > 0 && (
              <button onClick={markAllRead}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#C88B00' }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3"
                style={{ background: '#FFF8E7' }}>
                <Bell size={40} style={{ color: 'rgba(200,139,0,0.3)' }} />
                <p className="font-semibold text-sm" style={{ color: '#7A6050' }}>No notifications yet</p>
                <p className="text-xs text-center" style={{ color: '#A07000' }}>
                  Order updates, messages, and more will appear here.
                </p>
              </div>
            ) : notifications.map((n, i) => (
              <div key={n.id}
                style={{
                  borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined,
                  background: '#FFF8E7',
                }}>
                <Link
                  to={n.link || '#'}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-amber-50 transition-colors block">
                  <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1C0A00' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5A4030' }}>{n.message}</p>
                  </div>
                  <span className="text-[10px] shrink-0 mt-1" style={{ color: '#A07000' }}>
                    {timeAgo(n.time)}
                  </span>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#A07000' }}>
            Showing your last 50 notifications.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}
