/**
 * Refund Controller
 * POST /api/v1/refunds          — customer requests refund
 * GET  /api/v1/refunds/mine     — customer views their refunds
 * GET  /api/v1/refunds          — admin: all refunds
 * PUT  /api/v1/refunds/:id      — admin: approve/reject
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { audit } from '../utils/audit.js'

const requestSchema = z.object({
  orderId: z.string().cuid(),
  reason:  z.string().min(10).max(500),
  amount:  z.number().int().positive(),
})

// ── Customer: request refund ─────────────────────────────────────
export async function requestRefund(req, res, next) {
  try {
    const parsed = requestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { refund: true },
    })

    if (!order || order.customerId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Refunds are only allowed for delivered orders' })
    }
    if (order.refund) {
      return res.status(409).json({ success: false, message: 'A refund request already exists for this order' })
    }
    if (parsed.data.amount > order.totalAmount) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed order total' })
    }

    const refund = await prisma.refund.create({
      data: {
        orderId:    parsed.data.orderId,
        customerId: req.user.id,
        reason:     parsed.data.reason,
        amount:     parsed.data.amount,
      },
    })

    res.status(201).json({ success: true, data: refund })
  } catch (err) {
    next(err)
  }
}

// ── Customer: list their refunds ─────────────────────────────────
export async function listMyRefunds(req, res, next) {
  try {
    const refunds = await prisma.refund.findMany({
      where:   { customerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { totalAmount: true, createdAt: true } } },
    })
    res.json({ success: true, data: refunds })
  } catch (err) {
    next(err)
  }
}

// ── Admin: list all refunds ──────────────────────────────────────
export async function listRefunds(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          order:    { select: { totalAmount: true, status: true } },
        },
      }),
      prisma.refund.count({ where }),
    ])

    res.json({ success: true, data: refunds, meta: { total } })
  } catch (err) {
    next(err)
  }
}

// ── Admin: process refund ────────────────────────────────────────
export async function processRefund(req, res, next) {
  try {
    const { status, adminNote } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' })
    }

    const refund = await prisma.refund.update({
      where:   { id: req.params.id },
      data:    { status, adminNote },
      include: { customer: { select: { name: true, email: true } }, order: true },
    })

    audit(req, `refund.${status}`, 'Refund', refund.id, { amount: refund.amount, orderId: refund.orderId })

    res.json({ success: true, data: refund })
  } catch (err) {
    next(err)
  }
}
