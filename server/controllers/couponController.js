/**
 * Coupon Controller
 * POST /api/v1/coupons/validate  — public (anyone applying a coupon at checkout)
 * Admin CRUD for managing coupons.
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'

// ── Schemas ─────────────────────────────────────────────────────────
export const couponSchema = z.object({
  code:      z.string().min(2).max(30).toUpperCase(),
  type:      z.enum(['percentage', 'fixed']).default('percentage'),
  value:     z.number().int().positive(),  // % (1-100) or paisa
  minOrder:  z.number().int().min(0).default(0),
  maxUses:   z.number().int().min(0).default(0),
  expiresAt: z.string().datetime().optional().nullable(),
  active:    z.boolean().default(true),
})

// ── Validate & compute discount (public) ────────────────────────────
export async function validateCoupon(req, res, next) {
  try {
    const { code, cartTotal } = req.body
    if (!code || !cartTotal) {
      return res.status(400).json({ success: false, message: 'code and cartTotal required' })
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (!coupon || !coupon.active) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon' })
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' })
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' })
    }
    if (cartTotal < coupon.minOrder) {
      const minPKR = (coupon.minOrder / 100).toLocaleString('en-PK')
      return res.status(400).json({ success: false, message: `Minimum order Rs. ${minPKR} required for this coupon` })
    }

    const discount = coupon.type === 'percentage'
      ? Math.floor(cartTotal * coupon.value / 100)
      : Math.min(coupon.value, cartTotal)

    res.json({
      success: true,
      data: {
        code:     coupon.code,
        type:     coupon.type,
        value:    coupon.value,
        discount,
        finalTotal: cartTotal - discount,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── Admin: list coupons ──────────────────────────────────────────────
export async function listCoupons(req, res, next) {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: coupons })
  } catch (err) {
    next(err)
  }
}

// ── Admin: create coupon ─────────────────────────────────────────────
export async function createCoupon(req, res, next) {
  try {
    const parsed = couponSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const coupon = await prisma.coupon.create({ data: parsed.data })
    res.status(201).json({ success: true, data: coupon })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' })
    }
    next(err)
  }
}

// ── Admin: update coupon ─────────────────────────────────────────────
export async function updateCoupon(req, res, next) {
  try {
    const parsed = couponSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data:  parsed.data,
    })
    res.json({ success: true, data: coupon })
  } catch (err) {
    next(err)
  }
}

// ── Admin: delete coupon ─────────────────────────────────────────────
export async function deleteCoupon(req, res, next) {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Coupon deleted' })
  } catch (err) {
    next(err)
  }
}
