import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '../controllers/couponController.js'

const router = Router()
router.use(generalLimiter)

// Public — validate & compute discount
router.post('/validate', validateCoupon)

// Admin only
router.get('/',      requireAuth, requireRole('admin'), listCoupons)
router.post('/',     requireAuth, requireRole('admin'), createCoupon)
router.put('/:id',   requireAuth, requireRole('admin'), updateCoupon)
router.delete('/:id',requireAuth, requireRole('admin'), deleteCoupon)

export default router
