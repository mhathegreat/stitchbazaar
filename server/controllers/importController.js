/**
 * Bulk CSV import for vendors.
 * POST /api/v1/import/products  (vendor only)
 *
 * CSV columns (header row required):
 *   name, categorySlug, basePrice, stock, description, tags, images
 *
 * basePrice in Rs. (converted to paisa internally)
 * tags = comma-separated within the cell (use | to separate)
 * images = | separated URLs
 */

import prisma from '../utils/prisma.js'
import { logger } from '../utils/logger.js'

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim())
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']))
  })
}

export async function importProducts(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file required (field: file)' })
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor || vendor.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Active vendor account required' })
    }

    const text = req.file.buffer.toString('utf-8')
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV is empty or has no data rows' })
    }
    if (rows.length > 200) {
      return res.status(400).json({ success: false, message: 'Maximum 200 products per import' })
    }

    // Fetch all categories once
    const slugs      = [...new Set(rows.map(r => r.categoryslug || r.categorySlug || r.category_slug))]
    const categories = await prisma.category.findMany({ where: { slug: { in: slugs } } })
    const catMap     = Object.fromEntries(categories.map(c => [c.slug, c.id]))

    const created = []
    const errors  = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2  // 1-indexed, accounting for header
      try {
        const name     = row.name?.trim()
        const slug     = row.categoryslug || row.category_slug || ''
        const catId    = catMap[slug]
        const price    = Math.round(parseFloat(row.baseprice || row.base_price || 0) * 100)
        const stock    = parseInt(row.stock || 0, 10)

        if (!name)   { errors.push({ row: rowNum, error: 'name is required' }); continue }
        if (!catId)  { errors.push({ row: rowNum, error: `category "${slug}" not found` }); continue }
        if (price < 1) { errors.push({ row: rowNum, error: 'basePrice must be positive' }); continue }

        const tags   = row.tags   ? row.tags.split('|').map(t => t.trim()).filter(Boolean) : []
        const images = row.images ? row.images.split('|').map(u => u.trim()).filter(Boolean) : []

        const product = await prisma.product.create({
          data: {
            vendorId:    vendor.id,
            categoryId:  catId,
            name,
            description: row.description || '',
            basePrice:   price,
            stock:       isNaN(stock) ? 0 : stock,
            tags,
            images,
          },
        })
        created.push(product.id)
      } catch (err) {
        errors.push({ row: rowNum, error: err.message })
      }
    }

    logger.info(`CSV import by vendor ${vendor.id}: ${created.length} created, ${errors.length} errors`)

    res.json({
      success: true,
      data: { created: created.length, failed: errors.length, errors },
    })
  } catch (err) {
    next(err)
  }
}
