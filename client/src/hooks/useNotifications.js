/**
 * useNotifications — loads persisted history from the DB on mount,
 * then connects to the SSE stream for real-time updates.
 * Only active when the user is authenticated.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : `${window.location.origin}/api/v1`

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)
  const esRef = useRef(null)

  /* ── Load persisted history on login ──────────────────────────── */
  useEffect(() => {
    if (!user) { setNotifications([]); setUnread(0); return }

    fetch(`${API_BASE}/notifications`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        const rows = (d.data || []).map(row => ({
          id:      row.id,
          type:    row.type,
          payload: row.payload,
          time:    new Date(row.createdAt),
          read:    row.read,
          ...buildNotification(row.type, row.payload),
        })).filter(n => n.message)   // drop unknown types

        setNotifications(rows)
        setUnread(rows.filter(n => !n.read).length)
      })
      .catch(() => { /* non-critical */ })
  }, [user?.id])

  /* ── SSE stream for real-time events ──────────────────────────── */
  useEffect(() => {
    if (!user) return

    if (esRef.current) esRef.current.close()

    const es = new EventSource(`${API_BASE}/notifications/stream`, { withCredentials: true })
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        handleEvent(event)
      } catch { /* ignore malformed */ }
    }

    es.onerror = () => { /* EventSource auto-reconnects */ }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [user?.id])

  function handleEvent({ type, payload }) {
    if (type === 'connected') return

    const note = buildNotification(type, payload)
    if (!note) return

    setNotifications(prev =>
      [{ id: Date.now(), type, payload, ...note, time: new Date(), read: false }, ...prev].slice(0, 50)
    )
    setUnread(n => n + 1)

    toast(note.message, { icon: note.icon, duration: 5000 })
  }

  function buildNotification(type, payload) {
    switch (type) {
      case 'new_order':
        return {
          icon:    '🛍️',
          title:   'New Order',
          message: `New order — ${payload?.customer || 'Customer'} (Rs. ${((payload?.total || 0) / 100).toLocaleString()})`,
          link:    '/vendor/orders',
        }
      case 'order_status':
        return {
          icon:    '📦',
          title:   'Order Updated',
          message: `Your order status changed to ${payload?.status}`,
          link:    `/customer/orders/${payload?.orderId}`,
        }
      case 'vendor_approved':
        return {
          icon:    '🎉',
          title:   'Shop Approved!',
          message: `Your shop "${payload?.shopName}" has been approved!`,
          link:    '/vendor/dashboard',
        }
      case 'vendor_rejected':
        return {
          icon:    '⚠️',
          title:   'Application Update',
          message: `Your shop application needs attention.`,
          link:    '/vendor/dashboard',
        }
      case 'new_message':
        return {
          icon:    '💬',
          title:   'New Message',
          message: `${payload?.senderName}: ${payload?.preview}`,
          link:    `/messages/${payload?.conversationId}`,
        }
      default:
        return null
    }
  }

  const markAllRead = useCallback(() => {
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    fetch(`${API_BASE}/notifications/read`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch(() => { /* non-critical */ })
  }, [])

  return { notifications, unread, markAllRead }
}
