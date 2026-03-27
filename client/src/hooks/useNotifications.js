/**
 * useNotifications — connects to the SSE stream and delivers real-time alerts.
 * Only active when the user is authenticated.
 */

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

// Use same base URL pattern as api/client.js — fallback to window.origin so it
// works when the frontend is served from the same host as the API (Railway).
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : `${window.location.origin}/api/v1`

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)
  const esRef = useRef(null)

  useEffect(() => {
    if (!user) return

    // Close any existing connection
    if (esRef.current) esRef.current.close()

    const es = new EventSource(`${API_BASE}/notifications/stream`, { withCredentials: true })
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        handleEvent(event)
      } catch { /* ignore malformed */ }
    }

    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [user?.id])

  function handleEvent({ type, payload }) {
    if (type === 'connected') return   // handshake, ignore

    const note = buildNotification(type, payload)
    if (!note) return

    setNotifications(prev => [{ id: Date.now(), type, payload, ...note, time: new Date() }, ...prev].slice(0, 50))
    setUnread(n => n + 1)

    // Show toast
    toast(note.message, { icon: note.icon, duration: 5000 })
  }

  function buildNotification(type, payload) {
    switch (type) {
      case 'new_order':
        return {
          icon:    '🛍️',
          title:   'New Order',
          message: `New order from ${payload.customer} — Rs. ${((payload.total || 0) / 100).toLocaleString()}`,
          link:    '/vendor/orders',
        }
      case 'order_status':
        return {
          icon:    '📦',
          title:   'Order Updated',
          message: `Your order status changed to ${payload.status}`,
          link:    `/customer/orders/${payload.orderId}`,
        }
      default:
        return null
    }
  }

  function markAllRead() {
    setUnread(0)
  }

  return { notifications, unread, markAllRead }
}
