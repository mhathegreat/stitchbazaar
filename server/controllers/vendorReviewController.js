/**
 * Vendor Review Controller
 * GET  /api/v1/vendors/:id/reviews   — public: list reviews for a vendor
 * POST /api/v1/vendors/:id/reviews   — customer: submit review (must have delivered order)
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'

const reviewSchema = z.object({
  orderId: z.string().min(1),
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function listVendorReviews(req, res, next) {
  try {
    const { id: vendorId } = req.params
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 20

    const [reviews, total] = await Promise.all([
      prisma.vendorReview.findMany({
        where:   { vendorId },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        include: { customer: { select: { name: true } } },
      }),
      prisma.vendorReview.count({ where: { vendorId } }),
    ])

    const avgRating = reviews.length
      ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null

    res.json({ success: true, data: reviews, meta: { total, page, limit, avgRating } })
  } catch (err) { next(err) }
}

export async function submitVendorReview(req, res, next) {
  try {
    const { id: vendorId } = req.params
    const parsed = reviewSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' })

    // Verify the order belongs to this customer and was fulfilled by this vendor
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        vendorId,
        order: { id: parsed.data.orderId, customerId: req.user.id, status: 'delivered' },
      },
    })
    if (!orderItem) {
      return res.status(403).json({ success: false, message: 'You can only review vendors after a delivered order' })
    }

    const review = await prisma.vendorReview.upsert({
      where: {
        vendorId_customerId_orderId: {
          vendorId,
          customerId: req.user.id,
          orderId:    parsed.data.orderId,
        },
      },
      update: { rating: parsed.data.rating, comment: parsed.data.comment },
      create: {
        vendorId,
        customerId: req.user.id,
        orderId:    parsed.data.orderId,
        rating:     parsed.data.rating,
        comment:    parsed.data.comment,
      },
      include: { customer: { select: { name: true } } },
    })

    res.status(201).json({ success: true, data: review })
  } catch (err) { next(err) }
}
