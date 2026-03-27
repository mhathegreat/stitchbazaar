/**
 * Rate limiters for sensitive endpoints.
 * Uses express-rate-limit with in-memory store (sufficient for single-server Phase 1).
 */

import rateLimit from 'express-rate-limit'

const json429 = (_req, res) =>
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  })

/** Auth endpoints — 10 attempts per 15 min per IP */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          json429,
})

/** Order creation — 20 per 10 min per IP */
export const orderLimiter = rateLimit({
  windowMs:         10 * 60 * 1000,
  max:              20,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          json429,
})

/** Image upload — 30 per hour per IP */
export const uploadLimiter = rateLimit({
  windowMs:         60 * 60 * 1000,
  max:              30,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          json429,
})

/** General API — 200 per 15 min */
export const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler:          json429,
})
