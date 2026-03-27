/**
 * Product Variants CRUD — /api/v1/variants
 * Vendor or Admin only.
 */

import { Router } from 'express'
import { z }      from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import prisma          from '../utils/prisma.js'

const router = Router()

const variantSchema = z.object({
  productId:     z.string().cuid(),
  label:         z.string().min(1).max(100),
  priceModifier: z.number().int().default(0),
  stock:         z.number().int().min(0).default(0),
  sku:           z.string().max(100).optional(),
})

const variantUpdateSchema = variantSchema.omit({ productId: true }).partial()

/** Returns the vendor record if the user owns the given productId. */
async function assertOwnership(userId, productId, res) {
  const vendor = await prisma.vendor.findUnique({ where: { userId } })
  if (!vendor) { res.status(404).json({ success: false, message: 'Vendor not found' }); return null }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.vendorId !== vendor.id) {
    res.status(403).json({ success: false, message: 'Not your product' }); return null
  }
  return vendor
}

// POST /api/v1/variants — create a variant
router.post('/', requireAuth, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const parsed = variantSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    if (req.user.role === 'vendor') {
      const ok = await assertOwnership(req.user.id, parsed.data.productId, res)
      if (!ok) return
    }
    const variant = await prisma.productVariant.create({ data: parsed.data })
    res.status(201).json({ success: true, data: variant })
  } catch (err) { next(err) }
})

// PUT /api/v1/variants/:id — update a variant
router.put('/:id', requireAuth, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const parsed = variantUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })
    }
    const existing = await prisma.productVariant.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Variant not found' })
    if (req.user.role === 'vendor') {
      const ok = await assertOwnership(req.user.id, existing.productId, res)
      if (!ok) return
    }
    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data:  parsed.data,
    })
    res.json({ success: true, data: variant })
  } catch (err) { next(err) }
})

// DELETE /api/v1/variants/:id — delete a variant
router.delete('/:id', requireAuth, requireRole('vendor', 'admin'), async (req, res, next) => {
  try {
    const existing = await prisma.productVariant.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Variant not found' })
    if (req.user.role === 'vendor') {
      const ok = await assertOwnership(req.user.id, existing.productId, res)
      if (!ok) return
    }
    await prisma.productVariant.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Variant deleted' })
  } catch (err) { next(err) }
})

export default router
