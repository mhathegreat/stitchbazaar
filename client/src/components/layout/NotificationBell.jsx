/**
 * NotificationBell — shows unread count badge, drops down a list of recent alerts.
 * Mounted in the Navbar for authenticated users.
 */

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications.js'

export default function NotificationBell() {
  const { notifications, unread, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggle() {
    setOpen(o => !o)
    if (!open) markAllRead()
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-amber-50"
        style={{ color: '#C88B00' }}
        aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: '#D85A30', color: '#FFFCF5' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)' }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: '#1C0A00' }}>
            <p className="font-serif font-bold text-sm" style={{ color: '#C88B00' }}>Notifications</p>
            {notifications.length > 0 && (
              <button onClick={() => setOpen(false)}
                className="text-[10px]" style={{ color: '#7A6050' }}>Close</button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: '#7A6050' }}>
                No notifications yet
              </p>
            ) : notifications.map(n => (
              <Link key={n.id} to={n.link || '#'}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50 transition-colors"
                style={{ borderBottom: '1px solid rgba(200,139,0,0.1)' }}>
                <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#1C0A00' }}>{n.title}</p>
                  <p className="text-xs leading-snug mt-0.5" style={{ color: '#5A4030' }}>{n.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: '#A07000' }}>
                    {n.time.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
