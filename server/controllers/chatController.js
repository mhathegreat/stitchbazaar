/**
 * Chat Controller
 * POST   /api/v1/conversations              — start or get conversation
 * GET    /api/v1/conversations              — list my conversations
 * GET    /api/v1/conversations/:id          — get messages (paginated)
 * POST   /api/v1/conversations/:id/messages — send message
 * PUT    /api/v1/conversations/:id/read     — mark as read
 * POST   /api/v1/conversations/as-vendor    — vendor starts convo with customer
 */

import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { pushToUser } from '../utils/sse.js'

const INCLUDE_CONVO = {
  customer: { select: { id: true, name: true } },
  vendor:   { select: { id: true, shopName: true, logo: true, userId: true } },
}

// ── Start or get existing conversation ──────────────────────────────────────
export async function startConversation(req, res, next) {
  try {
    const schema = z.object({ vendorId: z.string().min(1) })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })

    const { vendorId } = parsed.data

    // Determine customerId: the current user must be a customer (or admin),
    // but a vendor user can also initiate (customerId comes from query in that case).
    // For simplicity: if user is vendor, they can start by passing customerId.
    let customerId = req.user.id
    if (req.user.role === 'vendor') {
      const cid = z.string().min(1).safeParse(req.body.customerId)
      if (!cid.success) return res.status(400).json({ success: false, message: 'customerId required for vendor' })
      customerId = cid.data
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' })

    const conversation = await prisma.conversation.upsert({
      where:  { customerId_vendorId: { customerId, vendorId } },
      create: { customerId, vendorId },
      update: {},
      include: INCLUDE_CONVO,
    })

    res.json({ success: true, data: conversation })
  } catch (err) { next(err) }
}

// ── Vendor-initiated conversation (uses req.user to look up vendor) ──────────
export async function startConversationAsVendor(req, res, next) {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ success: false, message: 'Vendors only' })

    const { customerId } = req.body
    if (!customerId) return res.status(400).json({ success: false, message: 'customerId required' })

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' })

    const conversation = await prisma.conversation.upsert({
      where:  { customerId_vendorId: { customerId, vendorId: vendor.id } },
      create: { customerId, vendorId: vendor.id },
      update: {},
      include: {
        customer: { select: { id: true, name: true } },
        vendor:   { select: { id: true, shopName: true, logo: true, userId: true } },
      },
    })

    res.json({ success: true, data: conversation })
  } catch (err) { next(err) }
}

// ── List my conversations ────────────────────────────────────────────────────
export async function listConversations(req, res, next) {
  try {
    let where

    if (req.user.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' })
      where = { vendorId: vendor.id }
    } else {
      where = { customerId: req.user.id }
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        ...INCLUDE_CONVO,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true, senderId: true, readAt: true },
        },
      },
    })

    res.json({ success: true, data: conversations })
  } catch (err) { next(err) }
}

// ── Get conversation + messages ──────────────────────────────────────────────
export async function getConversation(req, res, next) {
  try {
    const { page = 1, limit = 500 } = req.query

    const conversation = await prisma.conversation.findUnique({
      where:   { id: req.params.id },
      include: INCLUDE_CONVO,
    })
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' })

    // Access check
    if (req.user.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
      if (!vendor || conversation.vendorId !== vendor.id) return res.status(403).json({ success: false, message: 'Access denied' })
    } else if (req.user.role === 'customer') {
      if (conversation.customerId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const pageNum  = Math.max(1, Number(page))
    const limitNum = Math.min(1000, Math.max(1, Number(limit)))  // cap at 1000

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where:   { conversationId: req.params.id },
        orderBy: { createdAt: 'asc' },
        skip:    (pageNum - 1) * limitNum,
        take:    limitNum,
        include: { sender: { select: { id: true, name: true } } },
      }),
      prisma.message.count({ where: { conversationId: req.params.id } }),
    ])

    res.json({
      success: true,
      data: {
        conversation,
        messages,
        meta: { total, page: pageNum, limit: limitNum, hasMore: pageNum * limitNum < total },
      },
    })
  } catch (err) { next(err) }
}

// ── Send a message ───────────────────────────────────────────────────────────
export async function sendMessage(req, res, next) {
  try {
    const schema = z.object({
      body:     z.string().max(2000).trim().optional().default(''),
      imageUrl: z.string().url().optional(),
    }).refine(d => d.body.length > 0 || d.imageUrl, {
      message: 'Message must have text or an image',
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ success: false, errors: parsed.error.flatten().fieldErrors })

    const conversation = await prisma.conversation.findUnique({
      where:   { id: req.params.id },
      include: { vendor: { select: { userId: true, shopName: true } } },
    })
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' })

    // Access check
    if (req.user.role === 'vendor') {
      const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
      if (!vendor || conversation.vendorId !== vendor.id) return res.status(403).json({ success: false, message: 'Access denied' })
    } else if (req.user.role === 'customer') {
      if (conversation.customerId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const { body, imageUrl } = parsed.data
    const preview = body || '📷 Image'

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: conversation.id, senderId: req.user.id, body, imageUrl },
        include: { sender: { select: { id: true, name: true } } },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data:  { lastMessage: preview.slice(0, 100), updatedAt: new Date() },
      }),
    ])

    // Push SSE to the OTHER party
    const recipientId = req.user.role === 'vendor'
      ? conversation.customerId
      : conversation.vendor.userId

    pushToUser(recipientId, {
      type: 'new_message',
      payload: {
        conversationId: conversation.id,
        senderName:     req.user.name || 'Someone',
        preview:        preview.slice(0, 60),
      },
    })

    res.status(201).json({ success: true, data: message })
  } catch (err) { next(err) }
}

// ── Mark messages as read ────────────────────────────────────────────────────
export async function markRead(req, res, next) {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' })

    await prisma.message.updateMany({
      where: {
        conversationId: req.params.id,
        senderId: { not: req.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    res.json({ success: true })
  } catch (err) { next(err) }
}
