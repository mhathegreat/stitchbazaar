import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  getShippingRate, listShippingRates, upsertShippingRate, deleteShippingRate,
} from '../controllers/shippingController.js'

const router = Router()
router.use(generalLimiter)

// Public
router.get('/rate', getShippingRate)

// Admin only
router.get('/',      requireAuth, requireRole('admin'), listShippingRates)
router.post('/',     requireAuth, requireRole('admin'), upsertShippingRate)
router.delete('/:id',requireAuth, requireRole('admin'), deleteShippingRate)

export default router
