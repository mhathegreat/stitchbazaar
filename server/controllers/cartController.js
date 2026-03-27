/**
 * Cart controller — server-side cart persistence for abandonment recovery
 */

import prisma from '../utils/prisma.js'

/**
 * POST /cart/sync
 * Called by the frontend when a logged-in user's cart changes.
 * Upserts their SavedCart and resets emailSentAt so they can receive
 * another reminder if they add items again after a previous email.
 */
export async function syncCart(req, res, next) {
  try {
    const { items } = req.body   // [{productId, name, price, qty, image}]

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items must be an array' })
    }

    if (items.length === 0) {
      // Cart cleared — delete SavedCart if exists
      await prisma.savedCart.deleteMany({ where: { userId: req.user.id } })
      return res.json({ success: true })
    }

    await prisma.savedCart.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, items, emailSentAt: null },
      update: { items, emailSentAt: null },   // reset so new email can fire
    })

    res.json({ success: true })
  } catch (err) { next(err) }
}
