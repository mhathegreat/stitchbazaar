/**
 * Shipping Rate Controller
 * GET  /api/v1/shipping/rate?city=karachi   — public, used at checkout
 * GET  /api/v1/shipping                     — admin: list all rates
 * POST /api/v1/shipping                     — admin: create/upsert rate
 * PUT  /api/v1/shipping/:id                 — admin: update rate
 * DELETE /api/v1/shipping/:id               — admin: delete rate
 */

import prisma from '../utils/prisma.js'

// ── Public: look up shipping cost for a city ─────────────────────
export async function getShippingRate(req, res, next) {
  try {
    const city = (req.query.city || '').toLowerCase().trim()

    let rate = city
      ? await prisma.shippingRate.findUnique({ where: { city } })
      : null

    // Fall back to "default" rate
    if (!rate) {
      rate = await prisma.shippingRate.findUnique({ where: { city: 'default' } })
    }

    res.json({
      success: true,
      data: rate
        ? { city: rate.city, rate: rate.rate, freeAbove: rate.freeAbove }
        : { city: city || 'default', rate: 0, freeAbove: 0 },
    })
  } catch (err) {
    next(err)
  }
}

// ── Admin: list all rates ────────────────────────────────────────
export async function listShippingRates(req, res, next) {
  try {
    const rates = await prisma.shippingRate.findMany({ orderBy: { city: 'asc' } })
    res.json({ success: true, data: rates })
  } catch (err) {
    next(err)
  }
}

// ── Admin: upsert a rate ─────────────────────────────────────────
export async function upsertShippingRate(req, res, next) {
  try {
    const { city, rate, freeAbove = 0 } = req.body
    if (!city || rate === undefined) {
      return res.status(400).json({ success: false, message: 'city and rate required' })
    }
    const saved = await prisma.shippingRate.upsert({
      where:  { city: city.toLowerCase() },
      update: { rate: Number(rate), freeAbove: Number(freeAbove) },
      create: { city: city.toLowerCase(), rate: Number(rate), freeAbove: Number(freeAbove) },
    })
    res.json({ success: true, data: saved })
  } catch (err) {
    next(err)
  }
}

// ── Admin: delete a rate ─────────────────────────────────────────
export async function deleteShippingRate(req, res, next) {
  try {
    await prisma.shippingRate.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Rate deleted' })
  } catch (err) {
    next(err)
  }
}
