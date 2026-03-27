/**
 * Question controller — Product Q&A
 */

import prisma from '../utils/prisma.js'

/** GET /products/:id/questions — public */
export async function listQuestions(req, res, next) {
  try {
    const { id: productId } = req.params
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 20
    const skip  = (page - 1) * limit

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer:   { select: { name: true } },
          answeredBy: { select: { name: true } },
        },
      }),
      prisma.question.count({ where: { productId } }),
    ])

    res.json({ success: true, data: questions, meta: { total, page, limit } })
  } catch (err) { next(err) }
}

/** POST /products/:id/questions — authenticated customer */
export async function askQuestion(req, res, next) {
  try {
    const { id: productId } = req.params
    const { question } = req.body

    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' })
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: { include: { user: { select: { email: true, name: true } } } } },
    })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const q = await prisma.question.create({
      data: {
        productId,
        customerId: req.user.id,
        question:   question.trim(),
      },
      include: {
        customer:   { select: { name: true } },
        answeredBy: { select: { name: true } },
      },
    })

    res.status(201).json({ success: true, data: q })
  } catch (err) { next(err) }
}

/** PATCH /questions/:id/answer — vendor who owns the product */
export async function answerQuestion(req, res, next) {
  try {
    const { id } = req.params
    const { answer } = req.body

    if (!answer?.trim()) {
      return res.status(400).json({ success: false, message: 'Answer is required' })
    }

    const q = await prisma.question.findUnique({
      where: { id },
      include: { product: { select: { vendorId: true } } },
    })
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' })

    // Only the product's vendor (or admin) can answer
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    const isAdmin = req.user.role === 'admin'
    if (!isAdmin && (!vendor || vendor.id !== q.product.vendorId)) {
      return res.status(403).json({ success: false, message: 'Not authorised' })
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        answer:      answer.trim(),
        answeredAt:  new Date(),
        answeredById: req.user.id,
      },
      include: {
        customer:   { select: { name: true } },
        answeredBy: { select: { name: true } },
      },
    })

    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
}

/** DELETE /questions/:id — customer (own) or admin */
export async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params
    const q = await prisma.question.findUnique({ where: { id } })
    if (!q) return res.status(404).json({ success: false, message: 'Not found' })

    if (req.user.role !== 'admin' && q.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised' })
    }

    await prisma.question.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) { next(err) }
}
