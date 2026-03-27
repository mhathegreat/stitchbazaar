/**
 * Auth Controller
 * Handles register, login, logout, refresh, forgot-password, reset-password.
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '../utils/prisma.js'
import { sendPasswordReset } from '../utils/email.js'
import { logger } from '../utils/logger.js'

// ── Validation schemas ────────────────────────────────────────────

export const registerSchema = z.object({
  name:     z.string().min(2).max(80).trim(),
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(100),
  phone:    z.string().max(20).optional(),
  role:     z.enum(['customer', 'vendor']).default('customer'),
})

export const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

export const forgotSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
})

export const resetSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).max(100),
})

// ── Token helpers ─────────────────────────────────────────────────

/** @param {{ id, email, role }} user */
function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
}

/** @param {{ id }} user */
function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
}

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('sb_refresh', token, {
    httpOnly: true,
    secure:   isProd,
    // 'none' required for cross-origin (Vercel → Railway).
    // 'lax' in dev so localhost works without HTTPS.
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,   // 7 days
    path:     '/api/v1/auth',
  })
}

function safeUser(user) {
  const { password, ...safe } = user
  return safe
}

// ── Controllers ───────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, phone, role } = req.body

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user   = await prisma.user.create({
      data: { name, email, password: hashed, phone, role },
    })

    const accessToken  = signAccessToken(user)
    const refreshToken = signRefreshToken(user)

    await prisma.refreshToken.create({
      data: {
        token:     refreshToken,
        userId:    user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    setRefreshCookie(res, refreshToken)

    logger.info(`New user registered: ${email} (${role})`)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data:    { accessToken, user: safeUser(user) },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const accessToken  = signAccessToken(user)
    const refreshToken = signRefreshToken(user)

    await prisma.refreshToken.create({
      data: {
        token:     refreshToken,
        userId:    user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    setRefreshCookie(res, refreshToken)

    res.json({
      success: true,
      message: 'Login successful',
      data:    { accessToken, user: safeUser(user) },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const token = req.cookies?.sb_refresh
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {})
    }
    res.clearCookie('sb_refresh', { path: '/api/v1/auth' })
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.sb_refresh
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' })
    }

    const stored = await prisma.refreshToken.findFirst({
      where: { token, userId: decoded.id, expiresAt: { gt: new Date() } },
    })
    if (!stored) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked or expired' })
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    // Rotate refresh token
    const newRefresh = signRefreshToken(user)
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data:  { token: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
    setRefreshCookie(res, newRefresh)

    res.json({
      success: true,
      data: { accessToken: signAccessToken(user), user: safeUser(user) },
    })
  } catch (err) {
    next(err)
  }
}

// In-memory store for reset tokens (use Redis in production)
const resetTokens = new Map()   // token → { userId, expiresAt }

/**
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    // Always respond success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link was sent.' })
    }

    const token    = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 60 * 60 * 1000   // 1 hour

    resetTokens.set(token, { userId: user.id, expiresAt })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`
    await sendPasswordReset({ to: email, name: user.name, resetUrl })

    res.json({ success: true, message: 'If that email exists, a reset link was sent.' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body

    const entry = resetTokens.get(token)
    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: entry.userId },
      data:  { password: hashed },
    })

    resetTokens.delete(token)

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: entry.userId } })

    res.json({ success: true, message: 'Password reset successfully. Please log in.' })
  } catch (err) {
    next(err)
  }
}

// ── Update profile ────────────────────────────────────────────────

const profileSchema = z.object({
  name:    z.string().min(2).max(80).trim().optional(),
  phone:   z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city:    z.string().max(50).optional(),
})

export async function updateProfile(req, res, next) {
  try {
    const parsed = profileSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data:   parsed.data,
      select: { id: true, name: true, email: true, phone: true, address: true, city: true, role: true },
    })

    res.json({ success: true, message: 'Profile updated', data: user })
  } catch (err) {
    next(err)
  }
}
