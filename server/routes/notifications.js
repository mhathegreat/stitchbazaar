/**
 * Notification routes:
 *   GET  /api/v1/notifications/stream  — SSE stream (real-time)
 *   GET  /api/v1/notifications         — fetch persisted history (last 50)
 *   PATCH /api/v1/notifications/read   — mark all as read
 */

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../middleware/auth.js'
import { addClient, removeClient } from '../utils/sse.js'
import prisma from '../utils/prisma.js'

const router = Router()

/** Auth middleware that also accepts ?token= query param (needed for EventSource). */
function requireAuthSSE(req, res, next) {
  // Prefer Authorization header; fall back to ?token= query param (SSE-only)
  const header = req.headers.authorization
  const raw = header?.startsWith('Bearer ') ? header.split(' ')[1] : (req.query.token || null)
  if (!raw) return res.status(401).json({ success: false, message: 'Authentication required' })
  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

/* ── SSE stream ───────────────────────────────────────────────────── */
router.get('/stream', requireAuthSSE, (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')   // Disable nginx buffering
  res.flushHeaders()

  const userId = req.user.id
  res._sseRole = req.user.role

  res.write(`data: ${JSON.stringify({ type: 'connected', payload: { userId } })}\n\n`)

  addClient(userId, res)

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { clearInterval(heartbeat) }
  }, 25_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    removeClient(userId, res)
  })
})

/* ── List persisted notifications (newest first, max 50) ────────── */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.notification.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
})

/* ── Mark all as read ───────────────────────────────────────────── */
router.patch('/read', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data:  { read: true },
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

/* ── Get notification preferences ──────────────────────────────── */
router.get('/prefs', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { notificationPrefs: true },
    })
    res.json({ success: true, data: user?.notificationPrefs || {} })
  } catch (err) {
    next(err)
  }
})

/* ── Update notification preferences ───────────────────────────── */
router.patch('/prefs', requireAuth, async (req, res, next) => {
  try {
    const current = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { notificationPrefs: true },
    })
    const merged = { ...(current?.notificationPrefs || {}), ...req.body }
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { notificationPrefs: merged },
    })
    res.json({ success: true, data: merged })
  } catch (err) {
    next(err)
  }
})

export default router
