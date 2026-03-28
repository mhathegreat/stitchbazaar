/**
 * Vendor Controller
 * Handles vendor registration, profile, dashboard, payouts.
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logger } from '../utils/logger.js'

// ── Schemas ──────────────────────────────────────────────────────

export const vendorRegisterSchema = z.object({
  shopName:        z.string().min(2).max(100).trim(),
  shopDescription: z.string().max(1000).optional(),
  city:            z.string().max(50).optional(),
  whatsapp:        z.string().max(20).optional(),
  colorTheme:      z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#C88B00'),
  logo:            z.string().url().optional().nullable(),
  banner:          z.string().url().optional().nullable(),
  bankAccountName:   z.string().max(100).optional(),
  bankAccountNumber: z.string().max(30).optional(),
  bankName:          z.string().max(80).optional(),
  branchCode:        z.string().max(20).optional(),
})

export const vendorUpdateSchema = vendorRegisterSchema.partial()

// ── Controllers ──────────────────────────────────────────────────

/**
 * GET /api/v1/vendors
 * Public: list all active vendors.
 */
export async function listVendors(req, res, next) {
  try {
    const { city, q, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = { status: 'active' }
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (q)    where.shopName = { contains: q, mode: 'insensitive' }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, shopName: true, shopDescription: true,
          logo: true, banner: true, colorTheme: true, city: true,
          createdAt: true,
          _count: { select: { products: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ])

    res.json({ success: true, data: vendors, meta: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/vendors/:id
 * Public: single vendor profile + products.
 */
export async function getVendor(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          where:   { status: 'active' },
          take:    12,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, basePrice: true, images: true,
            stock: true, category: { select: { name: true } },
          },
        },
        _count: { select: { products: true, orderItems: true } },
      },
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    res.json({ success: true, data: vendor })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/vendors/register
 * Auth required. Creates a vendor profile for the logged-in user.
 */
export async function registerVendor(req, res, next) {
  try {
    const parsed = vendorRegisterSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const existing = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Vendor profile already exists' })
    }

    const { shopName, shopDescription, city, colorTheme,
            bankAccountName, bankAccountNumber, bankName, branchCode } = parsed.data

    const vendor = await prisma.vendor.create({
      data: {
        userId:          req.user.id,
        shopName,
        shopDescription,
        city,
        colorTheme,
        bankAccountName,
        bankAccountNumber,
        bankName,
        status:          'pending',
      },
    })

    // Save bank detail record if full info provided
    if (bankAccountName && bankAccountNumber && bankName) {
      await prisma.bankDetail.create({
        data: {
          vendorId:      vendor.id,
          accountName:   bankAccountName,
          accountNumber: bankAccountNumber,
          bankName,
          branchCode:    branchCode || null,
        },
      })
    }

    // Upgrade user role to vendor
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { role: 'vendor' },
    })

    logger.info(`Vendor registered: ${shopName} (userId: ${req.user.id})`)

    res.status(201).json({
      success: true,
      message: 'Vendor application submitted. Await admin approval.',
      data:    vendor,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/v1/vendors/profile
 * Vendor: update their own shop profile.
 */
export async function updateVendorProfile(req, res, next) {
  try {
    const parsed = vendorUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data:  parsed.data,
    })

    res.json({ success: true, message: 'Profile updated', data: updated })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/vendors/dashboard
 * Vendor: stats overview.
 */
export async function getVendorDashboard(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    const [totalProducts, orderItems, paidPayouts, pendingPayouts, recentOrders] = await Promise.all([
      prisma.product.count({ where: { vendorId: vendor.id } }),

      prisma.orderItem.findMany({
        where: { vendorId: vendor.id, vendorStatus: 'delivered' },
        select: { unitPrice: true, quantity: true },
      }),

      prisma.payout.aggregate({
        where:  { vendorId: vendor.id, status: 'paid' },
        _sum:   { amount: true },
      }),

      prisma.payout.aggregate({
        where:  { vendorId: vendor.id, status: 'pending' },
        _sum:   { amount: true },
      }),

      prisma.orderItem.findMany({
        where:   { vendorId: vendor.id },
        take:    10,
        orderBy: { createdAt: 'desc' },
        include: {
          order:   { select: { id: true, createdAt: true, deliveryAddress: true, city: true,
                               customer: { select: { name: true, phone: true } } } },
          product: { select: { name: true } },
        },
      }),
    ])

    const grossRevenue = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    const commission   = Math.round(grossRevenue * vendor.commissionRate / 100)
    const netRevenue   = grossRevenue - commission

    res.json({
      success: true,
      data: {
        vendor,
        stats: {
          totalProducts,
          totalOrders:   orderItems.length,
          grossRevenue,
          netRevenue,
          paidOut:       paidPayouts._sum.amount || 0,
          pendingPayout: pendingPayouts._sum.amount || 0,
        },
        recentOrders,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/vendors/payout-request
 * Vendor: request a payout of available earnings.
 */
export async function requestPayout(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    // Calculate available amount
    const delivered = await prisma.orderItem.findMany({
      where: { vendorId: vendor.id, vendorStatus: 'delivered' },
      select: { unitPrice: true, quantity: true },
    })
    const paid = await prisma.payout.aggregate({
      where: { vendorId: vendor.id, status: { in: ['paid', 'processing'] } },
      _sum:  { amount: true },
    })

    const gross     = delivered.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const net       = gross - Math.round(gross * vendor.commissionRate / 100)
    const available = net - (paid._sum.amount || 0)

    if (available <= 0) {
      return res.status(400).json({ success: false, message: 'No available balance to request payout' })
    }

    const payout = await prisma.payout.create({
      data: { vendorId: vendor.id, amount: available },
    })

    logger.info(`Payout requested: vendor ${vendor.id}, amount ${available}`)

    res.status(201).json({
      success: true,
      message: 'Payout request submitted',
      data:    payout,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/vendors/earnings
 * Vendor: earnings breakdown by month.
 */
export async function getVendorEarnings(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    const items = await prisma.orderItem.findMany({
      where:   { vendorId: vendor.id },
      include: { order: { select: { createdAt: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const payouts = await prisma.payout.findMany({
      where:   { vendorId: vendor.id },
      orderBy: { requestedAt: 'desc' },
    })

    res.json({ success: true, data: { items, payouts, commissionRate: vendor.commissionRate } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/vendors/orders
 * Vendor: paginated list of their order items.
 */
export async function getVendorOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    const where = { vendorId: vendor.id }
    if (status) where.vendorStatus = status

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, images: true } },
          variant: { select: { label: true } },
          order: {
            select: {
              id: true, createdAt: true, city: true,
              deliveryAddress: true, paymentMethod: true,
              guestName: true, guestPhone: true,
              customer: { select: { name: true, phone: true } },
            },
          },
        },
      }),
      prisma.orderItem.count({ where }),
    ])

    res.json({ success: true, data: items, meta: { total } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/vendors/disputes
 * Returns disputes on orders that contain items from this vendor.
 */
export async function getVendorDisputes(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' })

    // Find orders that have items belonging to this vendor
    const orderIds = await prisma.orderItem.findMany({
      where:  { vendorId: vendor.id },
      select: { orderId: true },
      distinct: ['orderId'],
    })
    const ids = orderIds.map(o => o.orderId)

    const disputes = await prisma.dispute.findMany({
      where:   { orderId: { in: ids } },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true, totalAmount: true, createdAt: true,
            customer: { select: { name: true, email: true } },
            guestName: true, guestEmail: true,
          },
        },
      },
    })

    res.json({ success: true, data: disputes })
  } catch (err) {
    next(err)
  }
}

export async function getVendorRefunds(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' })

    const orderRows = await prisma.orderItem.findMany({
      where: { vendorId: vendor.id },
      select: { orderId: true },
      distinct: ['orderId'],
    })
    const ids = orderRows.map(o => o.orderId)

    if (ids.length === 0) return res.json({ success: true, data: [] })

    const refunds = await prisma.refund.findMany({
      where: { orderId: { in: ids } },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true, totalAmount: true, createdAt: true,
            customer: { select: { name: true } },
            guestName: true,
          },
        },
        customer: { select: { name: true, email: true } },
      },
    })

    res.json({ success: true, data: refunds })
  } catch (err) {
    next(err)
  }
}

const VALID_VENDOR_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

export async function updateVendorOrderStatus(req, res, next) {
  try {
    const { status } = req.body || {}
    if (!VALID_VENDOR_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    const item = await prisma.orderItem.findFirst({
      where: { id: req.params.itemId, vendorId: vendor.id },
    })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' })
    }

    const updated = await prisma.orderItem.update({
      where: { id: req.params.itemId },
      data:  { vendorStatus: status },
      include: { order: { select: { id: true } } },
    })

    // Sync overall order status from all items in this order
    const allItems = await prisma.orderItem.findMany({
      where:  { orderId: updated.order.id },
      select: { vendorStatus: true },
    })
    const statuses = allItems.map(i => i.vendorStatus)
    const allSame  = s => statuses.every(x => x === s)
    const anySame  = s => statuses.some(x => x === s)

    let orderStatus = 'pending'
    if      (allSame('cancelled'))  orderStatus = 'cancelled'
    else if (allSame('delivered'))  orderStatus = 'delivered'
    else if (anySame('shipped'))    orderStatus = 'shipped'
    else if (anySame('packed'))     orderStatus = 'packed'
    else if (anySame('confirmed'))  orderStatus = 'confirmed'

    await prisma.order.update({
      where: { id: updated.order.id },
      data:  { status: orderStatus },
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}
