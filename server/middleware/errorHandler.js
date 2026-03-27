/**
 * Global error handler middleware.
 * Logs to Winston, returns consistent { success, message, error } shape.
 */

import { logger } from '../utils/logger.js'

// Map Prisma error codes to HTTP status + message
function parsePrismaError(err) {
  if (err.code === 'P2025') return { status: 404, message: 'Record not found' }
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field'
    return { status: 409, message: `Duplicate value for ${field}` }
  }
  if (err.code === 'P2003') return { status: 400, message: 'Referenced record does not exist' }
  if (err.code === 'P2014') return { status: 400, message: 'Invalid relation' }
  return null
}

export function errorHandler(err, req, res, _next) {
  const prisma = parsePrismaError(err)
  if (prisma) {
    return res.status(prisma.status).json({ success: false, message: prisma.message })
  }

  logger.error(`${req.method} ${req.url} — ${err.message}`, { stack: err.stack })

  const statusCode = err.statusCode ?? err.status ?? 500
  const message    = err.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
}
