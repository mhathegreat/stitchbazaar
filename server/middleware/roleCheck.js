/**
 * Role-based access control middleware.
 * Must be used AFTER requireAuth.
 *
 * @example
 * router.delete('/products/:id', requireAuth, requireRole('admin', 'vendor'), handler)
 */

/**
 * @param {...string} roles  Allowed roles (e.g. 'admin', 'vendor', 'customer')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      })
    }
    next()
  }
}
