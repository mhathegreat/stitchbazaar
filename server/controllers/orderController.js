/**
 * Order Controller
 * Handles order creation, listing, status updates, disputes.
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import { buildVendorNotifyLink } from '../utils/whatsapp.js'
import { sendOrderConfirmation, sendOrderStatusUpdate, sendLowStockAlert } from '../utils/email.js'
import { pushToRole, pushToUser } from '../utils/sse.js'

// ── Schemas ──────────────────────────────────────────────────────

const orderItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity:  z.number().int().positive(),
})

export const createOrderSchema = z.object({
  items:           z.array(orderItemSchema).min(1),
  deliveryAddress: z.string().min(5).max(500),
  city:            z.string().min(2).max(80),
  notes:           z.string().max(500).optional(),
  paymentMethod:   z.enum(['cash_on_delivery', 'bank_transfer']).default('cash_on_delivery'),
  guestName:       z.string().min(2).max(80).optional(),
  guestPhone:      z.string().max(20).optional(),
  guestEmail:      z.string().email().optional(),
})

export const disputeSchema = z.object({
  reason: z.string().min(10).max(1000),
})

// ── Controllers ──────────────────────────────────────────────────

/**
 * POST /api/v1/orders
 * Create a new order (guest or authenticated).
 */
export async function createOrder(req, res, next) {
  try {
    const parsed = createOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const { items, deliveryAddress, city, notes, paymentMethod,
            guestName, guestPhone, guestEmail } = parsed.data

    // Must have either auth user or full guest info
    if (!req.user && (!guestName || !guestPhone)) {
      return res.status(400).json({
        success: false, message: 'Guest name and phone are required for guest checkout',
      })
    }

    // Fetch all products (and variants) in one query
    const productIds = items.map(i => i.productId)
    const products   = await prisma.product.findMany({
      where:   { id: { in: productIds }, status: 'active' },
      include: { variants: true },
    })

    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'One or more products not available' })
    }

    // Batch-fetch all vendors to avoid N+1
    const vendorIds = [...new Set(products.map(p => p.vendorId))]
    const vendors   = await prisma.vendor.findMany({
      where:  { id: { in: vendorIds } },
      select: { id: true, commissionRate: true },
    })
    const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v]))

    // Build order items and check stock
    let totalAmount = 0
    let commissionAmount = 0

    const orderItemsData = []
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      let unitPrice = product.basePrice

      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId)
        if (!variant) {
          return res.status(400).json({ success: false, message: `Variant not found for ${product.name}` })
        }
        unitPrice += variant.priceModifier
      }

      // Stock check
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` })
      }

      const lineTotal = unitPrice * item.quantity
      totalAmount    += lineTotal

      const vendor = vendorMap[product.vendorId]
      commissionAmount += Math.round(lineTotal * (vendor?.commissionRate ?? 10) / 100)

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        vendorId:  product.vendorId,
        quantity:  item.quantity,
        unitPrice,
      })
    }

    // Create the order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId:      req.user?.id,
          guestName,
          guestPhone,
          guestEmail,
          deliveryAddress,
          city,
          notes,
          paymentMethod,
          totalAmount,
          commissionAmount,
          items: { create: orderItemsData },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, vendorId: true } },
              vendor:  { select: { shopName: true } },
            },
          },
        },
      })

      // Decrement stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { stock: { decrement: item.quantity } },
        })
      }

      return newOrder
    })

    logger.info(`Order created: ${order.id} | total: ${totalAmount} paisa`)

    // Low-stock alerts (fire-and-forget, threshold = 5)
    const LOW_STOCK_THRESHOLD = 5
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) }, stock: { lte: LOW_STOCK_THRESHOLD, gt: 0 } },
      include: { vendor: { include: { user: { select: { email: true } } } } },
    })
    for (const p of updatedProducts) {
      const vendorEmail = p.vendor.user?.email
      if (vendorEmail) {
        sendLowStockAlert({
          to:          vendorEmail,
          shopName:    p.vendor.shopName,
          productName: p.name,
          stock:       p.stock,
          productId:   p.id,
        }).catch(() => {})
      }
    }

    // Push real-time event to admin and affected vendors
    const vendorUserIds = await prisma.vendor.findMany({
      where:  { id: { in: [...new Set(orderItemsData.map(i => i.vendorId))] } },
      select: { userId: true },
    })
    const event = {
      type:    'new_order',
      payload: {
        orderId:  order.id,
        total:    totalAmount,
        items:    order.items.length,
        city,
        customer: guestName || 'Customer',
      },
    }
    pushToRole('admin', event)
    for (const { userId } of vendorUserIds) pushToUser(userId, event)

    // Send confirmation email (fire-and-forget)
    const emailTo   = guestEmail   || (req.user ? (await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true, name: true } }))?.email : null)
    const emailName = guestName    || (req.user ? (await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } }))?.name : 'Customer')
    if (emailTo) {
      sendOrderConfirmation({
        to:      emailTo,
        name:    emailName,
        orderId: order.id,
        total:   totalAmount,
        items:   order.items.map(i => ({ name: i.product.name, quantity: i.quantity, unitPrice: i.unitPrice })),
      }).catch(e => logger.error(`Order confirmation email failed: ${e.message}`))
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data:    order,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/orders
 * Auth required. Returns orders for the logged-in user.
 * Admin sees all orders.
 */
export async function listOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const skip  = (Number(page) - 1) * Number(limit)
    const where = {}

    if (req.user.role !== 'admin') {
      where.customerId = req.user.id
    }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, images: true } },
              vendor:  { select: { id: true, shopName: true, colorTheme: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/orders/:id
 * Auth required. Customer sees their own, admin sees all.
 */
export async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where:   { id: req.params.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, basePrice: true } },
            variant: { select: { label: true } },
            vendor:  { select: { id: true, shopName: true, colorTheme: true } },
          },
        },
        disputes: true,
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    // Check ownership
    if (req.user.role !== 'admin' && order.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/v1/orders/:id/status
 * Vendor: update their items' vendorStatus.
 * Admin: update overall order status.
 */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' })
    }

    if (req.user.role === 'vendor') {
      // Vendor updates their own orderItems
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' })
      }

      const validStatuses = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid vendor status' })
      }

      await prisma.orderItem.updateMany({
        where: { orderId: req.params.id, vendorId: vendor.id },
        data:  { vendorStatus: status },
      })

      // Notify customer by email
      const order = await prisma.order.findUnique({
        where:  { id: req.params.id },
        include: { customer: { select: { email: true, name: true } } },
      })
      if (order) {
        const emailTo   = order.customer?.email || order.guestEmail
        const emailName = order.customer?.name  || order.guestName || 'Customer'
        if (emailTo) {
          sendOrderStatusUpdate({ to: emailTo, name: emailName, orderId: order.id, status })
            .catch(e => logger.warn(`Status update email failed: ${e.message}`))
        }
        // Push real-time update to customer
        if (order.customerId) {
          pushToUser(order.customerId, { type: 'order_status', payload: { orderId: order.id, status } })
        }
      }

      return res.json({ success: true, message: `Order items updated to ${status}` })
    }

    // Admin updates overall order status
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data:  { status },
    })

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/orders/:id/dispute
 * Auth required. Customer raises a dispute.
 */
export async function raiseDispute(req, res, next) {
  try {
    const parsed = disputeSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your order' })
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Disputes can only be raised on delivered orders' })
    }

    const existing = await prisma.dispute.findFirst({
      where: { orderId: order.id, customerId: req.user.id },
    })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Dispute already raised for this order' })
    }

    const dispute = await prisma.dispute.create({
      data: {
        orderId:    order.id,
        customerId: req.user.id,
        reason:     parsed.data.reason,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data:  { status: 'disputed' },
    })

    res.status(201).json({ success: true, message: 'Dispute raised', data: dispute })
  } catch (err) {
    next(err)
  }
}
