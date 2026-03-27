/**
 * Admin Controller
 * Platform stats, vendor/payout/dispute management, category CRUD.
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import { sendVendorDecision, sendPayoutNotification, sendDisputeResolution } from '../utils/email.js'
import { audit } from '../utils/audit.js'

// ── Schemas ──────────────────────────────────────────────────────

export const categorySchema = z.object({
  name:      z.string().min(1).max(80).trim(),
  nameUrdu:  z.string().max(80).optional(),
  slug:      z.string().min(1).max(80).toLowerCase().trim(),
  icon:      z.string().max(10).optional(),
  color:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#C88B00'),
})

// ── Dashboard ────────────────────────────────────────────────────

export async function getAdminDashboard(req, res, next) {
  try {
    const [
      totalCustomers, totalVendors, totalOrders,
      revenueAgg, pendingVendors, pendingPayouts,
      openDisputes, recentOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.vendor.count({ where: { status: 'active' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { commissionAmount: true } }),
      prisma.vendor.findMany({
        where:   { status: 'pending' },
        take:    10,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, email: true, phone: true } } },
      }),
      prisma.payout.findMany({
        where:   { status: 'pending' },
        take:    10,
        orderBy: { requestedAt: 'asc' },
        include: { vendor: { select: { shopName: true, bankAccountName: true, bankAccountNumber: true, bankName: true } } },
      }),
      prisma.dispute.findMany({
        where:   { status: { in: ['open', 'investigating'] } },
        take:    10,
        orderBy: { createdAt: 'desc' },
        include: {
          order:    { select: { id: true, totalAmount: true } },
          customer: { select: { name: true, email: true } },
        },
      }),
      prisma.order.findMany({
        take:    5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
    ])

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalVendors,
          totalOrders,
          platformRevenue: revenueAgg._sum.commissionAmount || 0,
        },
        pendingVendors,
        pendingPayouts,
        openDisputes,
        recentOrders,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── Vendors ──────────────────────────────────────────────────────

export async function listAllVendors(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user:  { select: { name: true, email: true, phone: true } },
          _count: { select: { products: true, orderItems: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ])

    res.json({ success: true, data: vendors, meta: { total } })
  } catch (err) {
    next(err)
  }
}

export async function approveVendor(req, res, next) {
  try {
    const vendor = await prisma.vendor.update({
      where:   { id: req.params.id },
      data:    { status: 'active' },
      include: { user: { select: { email: true } } },
    })
    logger.info(`Vendor approved: ${vendor.id}`)
    audit(req, 'vendor.approved', 'Vendor', vendor.id, { shopName: vendor.shopName })

    sendVendorDecision({ to: vendor.user.email, shopName: vendor.shopName, approved: true })
      .catch(e => logger.warn(`Vendor approval email failed: ${e.message}`))

    res.json({ success: true, message: 'Vendor approved', data: vendor })
  } catch (err) {
    next(err)
  }
}

export async function rejectVendor(req, res, next) {
  try {
    const { note } = req.body
    const vendor = await prisma.vendor.update({
      where:   { id: req.params.id },
      data:    { status: 'suspended' },
      include: { user: { select: { email: true } } },
    })
    logger.info(`Vendor rejected/suspended: ${vendor.id}`)
    audit(req, 'vendor.rejected', 'Vendor', vendor.id, { shopName: vendor.shopName, note })

    sendVendorDecision({ to: vendor.user.email, shopName: vendor.shopName, approved: false, note })
      .catch(e => logger.warn(`Vendor rejection email failed: ${e.message}`))

    res.json({ success: true, message: 'Vendor rejected', data: vendor })
  } catch (err) {
    next(err)
  }
}

// ── Payouts ──────────────────────────────────────────────────────

export async function listPayouts(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { requestedAt: 'desc' },
        include: {
          vendor: {
            select: { shopName: true, bankAccountName: true, bankAccountNumber: true, bankName: true },
          },
        },
      }),
      prisma.payout.count({ where }),
    ])

    res.json({ success: true, data: payouts, meta: { total } })
  } catch (err) {
    next(err)
  }
}

export async function processPayout(req, res, next) {
  try {
    const { status, adminNote } = req.body   // status: 'paid' | 'rejected'
    if (!['paid', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be paid or rejected' })
    }

    const payout = await prisma.payout.update({
      where:   { id: req.params.id },
      data:    { status, adminNote, processedAt: new Date() },
      include: { vendor: { select: { shopName: true, user: { select: { email: true } } } } },
    })

    logger.info(`Payout ${status}: ${payout.id} | amount: ${payout.amount}`)
    audit(req, `payout.${status}`, 'Payout', payout.id, { amount: payout.amount, shopName: payout.vendor?.shopName })

    // Notify vendor by email
    const vendorEmail = payout.vendor?.user?.email
    if (vendorEmail) {
      sendPayoutNotification({
        to: vendorEmail, shopName: payout.vendor.shopName,
        amount: payout.amount, status, adminNote,
      }).catch(e => logger.warn(`Payout email failed: ${e.message}`))
    }

    res.json({ success: true, message: `Payout marked as ${status}`, data: payout })
  } catch (err) {
    next(err)
  }
}

// ── Disputes ─────────────────────────────────────────────────────

export async function listDisputes(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          order:    { select: { id: true, totalAmount: true, status: true } },
          customer: { select: { name: true, email: true, phone: true } },
        },
      }),
      prisma.dispute.count({ where }),
    ])

    res.json({ success: true, data: disputes, meta: { total } })
  } catch (err) {
    next(err)
  }
}

export async function resolveDispute(req, res, next) {
  try {
    const { status, resolution } = req.body
    if (!['investigating', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid dispute status' })
    }

    const dispute = await prisma.dispute.update({
      where:   { id: req.params.id },
      data:    { status, resolution },
      include: { customer: { select: { email: true, name: true } } },
    })

    // When resolved/closed, revert order status from 'disputed' to 'delivered'
    if (['resolved', 'closed'].includes(status)) {
      await prisma.order.updateMany({
        where: { id: dispute.orderId, status: 'disputed' },
        data:  { status: 'delivered' },
      })

      // Notify customer
      if (dispute.customer?.email) {
        sendDisputeResolution({
          to: dispute.customer.email, name: dispute.customer.name,
          orderId: dispute.orderId, status, resolution,
        }).catch(e => logger.warn(`Dispute resolution email failed: ${e.message}`))
      }
    }

    audit(req, `dispute.${status}`, 'Dispute', dispute.id, { orderId: dispute.orderId, resolution })
    res.json({ success: true, message: 'Dispute updated', data: dispute })
  } catch (err) {
    next(err)
  }
}

// ── Admin: update order status ────────────────────────────────────

export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'disputed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data:  { status },
    })
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

// ── Categories ───────────────────────────────────────────────────

export async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    res.json({ success: true, data: categories })
  } catch (err) {
    next(err)
  }
}

export async function createCategory(req, res, next) {
  try {
    const parsed = categorySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const cat = await prisma.category.create({ data: parsed.data })
    res.status(201).json({ success: true, data: cat })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Slug already exists' })
    }
    next(err)
  }
}

export async function updateCategory(req, res, next) {
  try {
    const parsed = categorySchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const cat = await prisma.category.update({
      where: { id: req.params.id },
      data:  parsed.data,
    })
    res.json({ success: true, data: cat })
  } catch (err) {
    next(err)
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Category deleted' })
  } catch (err) {
    next(err)
  }
}

// ── All Orders (admin) ────────────────────────────────────────────

export async function listAllOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          items:    { select: { vendorId: true, quantity: true, unitPrice: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    res.json({ success: true, data: orders, meta: { total } })
  } catch (err) {
    next(err)
  }
}

// ── All Products (admin) ─────────────────────────────────────────

export async function listAllProducts(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vendor:   { select: { shopName: true } },
          category: { select: { name: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    res.json({ success: true, data: products, meta: { total } })
  } catch (err) {
    next(err)
  }
}

export async function moderateProduct(req, res, next) {
  try {
    const { status } = req.body
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be active or suspended' })
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data:  { status },
    })
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

// ── Audit Log ─────────────────────────────────────────────────────

export async function listAuditLogs(req, res, next) {
  try {
    const { action, page = 1, limit = 50 } = req.query
    const where = {}
    if (action) where.action = { contains: action }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    res.json({ success: true, data: logs, meta: { total } })
  } catch (err) {
    next(err)
  }
}

// ── Analytics ─────────────────────────────────────────────────────

export async function getAnalytics(req, res, next) {
  try {
    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [monthlyOrders, topVendors, topProducts, customerCount, vendorCount] = await Promise.all([
      // All delivered orders in last 6 months for revenue chart
      prisma.order.findMany({
        where:   { createdAt: { gte: sixMonthsAgo } },
        select:  { totalAmount: true, commissionAmount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Top 5 vendors by revenue
      prisma.orderItem.groupBy({
        by:      ['vendorId'],
        _sum:    { unitPrice: true },
        orderBy: { _sum: { unitPrice: 'desc' } },
        take:    5,
      }),

      // Top 5 products by order count
      prisma.orderItem.groupBy({
        by:      ['productId'],
        _count:  { id: true },
        orderBy: { _count: { id: 'desc' } },
        take:    5,
      }),

      prisma.user.count({ where: { role: 'customer' } }),
      prisma.vendor.count({ where: { status: 'active' } }),
    ])

    // Aggregate monthly revenue
    const monthlyMap = {}
    for (const order of monthlyOrders) {
      const key = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyMap[key]) monthlyMap[key] = { gross: 0, commission: 0, orders: 0 }
      monthlyMap[key].gross      += order.totalAmount
      monthlyMap[key].commission += order.commissionAmount || 0
      monthlyMap[key].orders     += 1
    }
    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    // Enrich top vendors with shop names
    const vendorIds    = topVendors.map(v => v.vendorId)
    const vendorNames  = await prisma.vendor.findMany({
      where:  { id: { in: vendorIds } },
      select: { id: true, shopName: true },
    })
    const vendorMap = Object.fromEntries(vendorNames.map(v => [v.id, v.shopName]))

    // Enrich top products with names
    const productIds   = topProducts.map(p => p.productId)
    const productNames = await prisma.product.findMany({
      where:  { id: { in: productIds } },
      select: { id: true, name: true },
    })
    const productMap = Object.fromEntries(productNames.map(p => [p.id, p.name]))

    res.json({
      success: true,
      data: {
        monthly,
        topVendors:  topVendors.map(v => ({ shopName: vendorMap[v.vendorId] || v.vendorId, revenue: v._sum.unitPrice })),
        topProducts: topProducts.map(p => ({ name: productMap[p.productId] || p.productId, orders: p._count.id })),
        customerCount,
        vendorCount,
      },
    })
  } catch (err) {
    next(err)
  }
}
