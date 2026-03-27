import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  requestRefund, listMyRefunds, listRefunds, processRefund,
} from '../controllers/refundController.js'

const router = Router()
router.use(generalLimiter, requireAuth)

// Customer
router.post('/',           requireRole('customer'), requestRefund)
router.get('/mine',        requireRole('customer'), listMyRefunds)

// Admin
router.get('/',            requireRole('admin'), listRefunds)
router.put('/:id/process', requireRole('admin'), processRefund)

export default router
