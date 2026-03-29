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
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)
  const esRef = useRef(null)

  /* ── Load persisted history on login ──────────────────────────── */
  useEffect(() => {
    if (!user || !token) { setNotifications([]); setUnread(0); return }

    fetch(`${API_BASE}/notifications`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    })
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
  }, [user?.id, token])

  /* ── SSE stream for real-time events ──────────────────────────── */
  useEffect(() => {
    if (!user || !token) return

    if (esRef.current) esRef.current.close()

    const es = new EventSource(
      `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`,
      { withCredentials: true },
    )
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
  }, [user?.id, token])

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
      case 'order_placed':
        return {
          icon:    '✅',
          title:   'Order Placed',
          message: `Your order has been placed successfully (Rs. ${((payload?.total || 0) / 100).toLocaleString()})`,
          link:    `/customer/orders/${payload?.orderId}`,
        }
      case 'order_status':
        return {
          icon:    '📦',
          title:   'Order Updated',
          message: `Your order status changed to ${payload?.status}`,
          link:    `/customer/orders/${payload?.orderId}`,
        }
      case 'review_reminder':
        return {
          icon:    '⭐',
          title:   'How was your order?',
          message: `Your order was delivered! Share your feedback by leaving a review.`,
          link:    `/customer/orders/${payload?.orderId}`,
        }
      case 'refund_requested':
        return {
          icon:    '↩️',
          title:   'Refund Request',
          message: `A customer requested a refund of Rs. ${((payload?.amount || 0) / 100).toLocaleString()}`,
          link:    '/admin/refunds',
        }
      case 'refund_status':
        return {
          icon:    payload?.status === 'approved' ? '💸' : '❌',
          title:   'Refund Update',
          message: payload?.status === 'approved'
            ? `Your refund of Rs. ${((payload?.amount || 0) / 100).toLocaleString()} has been approved.`
            : `Your refund request was not approved.`,
          link:    `/customer/orders/${payload?.orderId}`,
        }
      case 'dispute_opened':
        return {
          icon:    '⚠️',
          title:   'New Dispute',
          message: `A customer opened a dispute on order ${payload?.orderId?.slice(-6)}`,
          link:    '/admin/disputes',
        }
      case 'dispute_resolved':
        return {
          icon:    '✔️',
          title:   'Dispute Resolved',
          message: `Your dispute has been ${payload?.status}.`,
          link:    `/customer/orders/${payload?.orderId}`,
        }
      case 'payout_requested':
        return {
          icon:    '💰',
          title:   'Payout Request',
          message: `${payload?.shopName} requested a payout of Rs. ${((payload?.amount || 0) / 100).toLocaleString()}`,
          link:    '/admin/payouts',
        }
      case 'payout_status':
        return {
          icon:    payload?.status === 'paid' ? '💵' : '❌',
          title:   'Payout Update',
          message: payload?.status === 'paid'
            ? `Your payout of Rs. ${((payload?.amount || 0) / 100).toLocaleString()} has been processed!`
            : `Your payout request was rejected.${payload?.adminNote ? ` Note: ${payload.adminNote}` : ''}`,
          link:    '/vendor/payouts',
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
    if (token) {
      fetch(`${API_BASE}/notifications/read`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { /* non-critical */ })
    }
  }, [token])

  return { notifications, unread, markAllRead }
}
