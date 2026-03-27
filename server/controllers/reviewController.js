/**
 * Review Controller
 */
import { z } from 'zod'
import prisma from '../utils/prisma.js'

const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating:    z.number().int().min(1).max(5),
  comment:   z.string().max(1000).optional(),
})

export async function listReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where:   { productId: req.params.productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })
    const avgRating = reviews.length
      ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null

    res.json({ success: true, data: reviews, meta: { avgRating, count: reviews.length } })
  } catch (err) {
    next(err)
  }
}

export async function submitReview(req, res, next) {
  try {
    const parsed = reviewSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    // Ensure the product exists
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const review = await prisma.review.upsert({
      where:  { productId_userId: { productId: parsed.data.productId, userId: req.user.id } },
      update: { rating: parsed.data.rating, comment: parsed.data.comment },
      create: { ...parsed.data, userId: req.user.id },
      include: { user: { select: { name: true } } },
    })

    res.status(201).json({ success: true, data: review })
  } catch (err) {
    next(err)
  }
}
