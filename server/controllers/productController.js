/**
 * Product Controller
 * Public listing/detail + vendor CRUD.
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logger } from '../utils/logger.js'

// ── Schemas ──────────────────────────────────────────────────────

export const variantSchema = z.object({
  label:         z.string().min(1).max(100),
  priceModifier: z.number().int().default(0),
  stock:         z.number().int().min(0).default(0),
  sku:           z.string().max(50).optional(),
})

export const productSchema = z.object({
  categoryId:       z.string().cuid(),
  name:             z.string().min(2).max(200).trim(),
  nameUrdu:         z.string().max(200).optional(),
  description:      z.string().max(5000).optional(),
  descriptionUrdu:  z.string().max(5000).optional(),
  basePrice:        z.number().int().positive(),   // paisa
  salePrice:        z.number().int().positive().optional().nullable(),
  saleEndsAt:       z.string().datetime().optional().nullable(),
  stock:            z.number().int().min(0).default(0),
  images:           z.array(z.string().url()).max(8).default([]),
  tags:             z.array(z.string()).max(20).default([]),
  status:           z.enum(['active', 'inactive', 'suspended']).default('active'),
  variants:         z.array(variantSchema).optional(),
})

// ── Controllers ──────────────────────────────────────────────────

/**
 * GET /api/v1/products
 * Public — list products with filters.
 */
export async function listProducts(req, res, next) {
  try {
    const {
      q, categoryId, vendorId, minPrice, maxPrice,
      inStock, sort = 'newest', page = 1, limit = 24,
    } = req.query

    const where = { status: 'active' }
    if (q)          where.OR = [
      { name:        { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags:        { has: q } },
    ]
    if (categoryId) where.categoryId = categoryId
    if (vendorId)   where.vendorId   = vendorId
    if (minPrice)   where.basePrice  = { ...where.basePrice, gte: Number(minPrice) }
    if (maxPrice)   where.basePrice  = { ...where.basePrice, lte: Number(maxPrice) }
    if (inStock === 'true') where.stock = { gt: 0 }

    const orderBy = sort === 'price_asc'  ? { basePrice: 'asc'  }
                  : sort === 'price_desc' ? { basePrice: 'desc' }
                  : sort === 'popular'    ? { orderItems: { _count: 'desc' } }
                  :                        { createdAt: 'desc' }

    const skip = (Number(page) - 1) * Number(limit)

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy,
        include: {
          vendor:   { select: { id: true, shopName: true, colorTheme: true } },
          category: { select: { id: true, name: true, slug: true } },
          reviews:  { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Compute avg rating
    const data = products.map(p => ({
      ...p,
      avgRating: p.reviews.length
        ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
        : null,
      reviewCount: p.reviews.length,
      reviews: undefined,
    }))

    res.json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/products/:id
 * Public — full product detail with variants and reviews.
 */
export async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where:   { id: req.params.id },
      include: {
        vendor:   { select: { id: true, shopName: true, colorTheme: true, city: true, logo: true } },
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { createdAt: 'asc' } },
        reviews:  {
          take:    10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!product || product.status === 'suspended') {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const avgRating = product.reviews.length
      ? +(product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
      : null

    res.json({ success: true, data: { ...product, avgRating } })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/v1/products
 * Vendor: create a product.
 */
export async function createProduct(req, res, next) {
  try {
    const parsed = productSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor profile required' })
    }
    if (vendor.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Vendor account not active' })
    }

    const { variants: variantData, ...productData } = parsed.data

    const product = await prisma.product.create({
      data: {
        ...productData,
        vendorId: vendor.id,
        ...(variantData?.length ? {
          variants: { create: variantData },
        } : {}),
      },
      include: { category: true, variants: true },
    })

    logger.info(`Product created: ${product.id} by vendor ${vendor.id}`)
    res.status(201).json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/v1/products/:id
 * Vendor / Admin: update a product.
 */
export async function updateProduct(req, res, next) {
  try {
    const parsed = productSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }

    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    // Vendor can only edit their own products
    if (req.user.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
      if (!vendor || vendor.id !== product.vendorId) {
        return res.status(403).json({ success: false, message: 'Not your product' })
      }
    }

    const { variants: variantData, ...productData } = parsed.data

    // Replace variants if provided
    if (variantData !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: req.params.id } })
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...productData,
        ...(variantData?.length ? {
          variants: { create: variantData },
        } : {}),
      },
      include: { category: true, variants: true },
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/v1/products/:id
 * Vendor / Admin: soft-delete (set inactive).
 */
export async function deleteProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    if (req.user.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
      if (!vendor || vendor.id !== product.vendorId) {
        return res.status(403).json({ success: false, message: 'Not your product' })
      }
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data:  { status: 'inactive' },
    })

    res.json({ success: true, message: 'Product deactivated' })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/products/vendor/mine
 * Vendor: list their own products (all statuses).
 */
export async function listMyProducts(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' })
    }

    const { status, page = 1, limit = 50 } = req.query
    const where = { vendorId: vendor.id }
    if (status) where.status = status

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          _count:   { select: { orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    res.json({ success: true, data: products, meta: { total } })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/v1/products/autocomplete?q=needle
 * Returns up to 8 quick-search suggestions (name + category).
 */
export async function autocomplete(req, res, next) {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json({ success: true, data: [] })

    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        OR: [
          { name:     { contains: q, mode: 'insensitive' } },
          { tags:     { has: q.toLowerCase() } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take:    8,
      select:  { id: true, name: true, basePrice: true, images: true, category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}
