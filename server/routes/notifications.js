/**
 * Notification routes:
 *   GET  /api/v1/notifications/stream  — SSE stream (real-time)
 *   GET  /api/v1/notifications         — fetch persisted history (last 50)
 *   PATCH /api/v1/notifications/read   — mark all as read
 */

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { addClient, removeClient } from '../utils/sse.js'
import prisma from '../utils/prisma.js'

const router = Router()

/* ── SSE stream ───────────────────────────────────────────────────── */
router.get('/stream', requireAuth, (req, res) => {
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

export default router
