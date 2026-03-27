/**
 * Wishlist Controller
 */
import { z } from 'zod'
import prisma from '../utils/prisma.js'

const addSchema = z.object({ productId: z.string().cuid() })

export async function getWishlist(req, res, next) {
  try {
    const items = await prisma.wishlist.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, basePrice: true, images: true, status: true,
                    vendor: { select: { shopName: true } } },
        },
      },
    })
    res.json({ success: true, data: items })
  } catch (err) {
    next(err)
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const parsed = addSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const item = await prisma.wishlist.upsert({
      where:  { userId_productId: { userId: req.user.id, productId: parsed.data.productId } },
      update: {},
      create: { userId: req.user.id, productId: parsed.data.productId },
    })

    res.status(201).json({ success: true, data: item })
  } catch (err) {
    next(err)
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId },
    })
    res.json({ success: true, message: 'Removed from wishlist' })
  } catch (err) {
    next(err)
  }
}
