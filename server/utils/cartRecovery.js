/**
 * Abandoned cart recovery cron job.
 * Runs every 15 minutes; finds carts idle for >= 1 hour with no email sent,
 * sends a recovery email, then stamps emailSentAt to prevent duplicates.
 */

import cron from 'node-cron'
import prisma from './prisma.js'
import { sendAbandonedCartEmail } from './email.js'
import { logger } from './logger.js'

const ONE_HOUR_AGO = () => new Date(Date.now() - 60 * 60 * 1000)

async function runRecovery() {
  try {
    const carts = await prisma.savedCart.findMany({
      where: {
        emailSentAt: null,
        updatedAt:   { lte: ONE_HOUR_AGO() },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (carts.length === 0) return

    logger.info(`[cartRecovery] Processing ${carts.length} abandoned cart(s)`)

    for (const cart of carts) {
      const items = Array.isArray(cart.items) ? cart.items : []
      if (items.length === 0) continue

      // Check user hasn't placed an order in the last hour (cart may have converted)
      const recentOrder = await prisma.order.findFirst({
        where: {
          customerId: cart.userId,
          createdAt:  { gte: ONE_HOUR_AGO() },
        },
      })
      if (recentOrder) {
        // They checked out — clean up the saved cart
        await prisma.savedCart.delete({ where: { id: cart.id } })
        continue
      }

      const cartUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart`

      await sendAbandonedCartEmail({
        to:      cart.user.email,
        name:    cart.user.name,
        items,
        cartUrl,
      })

      await prisma.savedCart.update({
        where: { id: cart.id },
        data:  { emailSentAt: new Date() },
      })

      logger.info(`[cartRecovery] Sent recovery email to ${cart.user.email}`)
    }
  } catch (err) {
    logger.error(`[cartRecovery] Error: ${err.message}`)
  }
}

/** Start the cron job — call once from server/index.js */
export function startCartRecoveryCron() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', runRecovery)
  logger.info('[cartRecovery] Cron started — runs every 15 minutes')
}
