/**
 * Category Controller (public read)
 */
import prisma from '../utils/prisma.js'

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

export async function getCategory(req, res, next) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          where:   { status: 'active' },
          take:    24,
          orderBy: { createdAt: 'desc' },
          include: { vendor: { select: { shopName: true } } },
        },
      },
    })
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' })
    }
    res.json({ success: true, data: category })
  } catch (err) {
    next(err)
  }
}
