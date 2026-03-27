/**
 * JWT authentication middleware.
 * Verifies Bearer token from Authorization header.
 * Attaches decoded user to req.user.
 */

import jwt from 'jsonwebtoken'

/**
 * Require a valid JWT access token.
 * Usage: router.get('/protected', requireAuth, controller)
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded   // { id, email, role }
    next()
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    return res.status(401).json({ success: false, message })
  }
}

/**
 * Optionally attach user if token is present — does not reject missing token.
 * Useful for public routes that behave differently when authenticated.
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    } catch { /* ignore */ }
  }
  next()
}
