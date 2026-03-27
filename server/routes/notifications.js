/**
 * GET /api/v1/notifications/stream
 * Server-Sent Events stream for authenticated users.
 * Vendors receive new-order events; admins receive all platform events.
 */

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { addClient, removeClient } from '../utils/sse.js'

const router = Router()

router.get('/stream', requireAuth, (req, res) => {
  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')   // Disable nginx buffering
  res.flushHeaders()

  const userId = req.user.id

  // Tag response with role so pushToRole() can filter
  res._sseRole = req.user.role

  // Send a ping immediately so the client knows the connection is live
  res.write(`data: ${JSON.stringify({ type: 'connected', payload: { userId } })}\n\n`)

  addClient(userId, res)

  // Heartbeat every 25s to prevent proxies from closing the connection
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { clearInterval(heartbeat) }
  }, 25_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    removeClient(userId, res)
  })
})

export default router
