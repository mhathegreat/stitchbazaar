import { Router } from 'express'
import { requireAuth }  from '../middleware/auth.js'
import { requireRole }  from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  listVendors, getVendor, registerVendor, updateVendorProfile,
  getVendorDashboard, requestPayout, getVendorEarnings, getVendorOrders,
  updateVendorOrderStatus, getVendorDisputes, getVendorRefunds, processVendorRefund,
  getVendorCounts,
} from '../controllers/vendorController.js'
import { listVendorReviews, submitVendorReview } from '../controllers/vendorReviewController.js'

const router = Router()
router.use(generalLimiter)

// ── Public ────────────────────────────────────────────────────────
router.get('/', listVendors)

// ── Auth-required routes MUST come before /:id  ───────────────────
// (Express matches routes in order — /:id would swallow these otherwise)
router.get('/counts',          requireAuth, requireRole('vendor'), getVendorCounts)
router.post('/register',       requireAuth, registerVendor)
router.put('/profile',         requireAuth, requireRole('vendor'), updateVendorProfile)
router.get('/dashboard',       requireAuth, requireRole('vendor'), getVendorDashboard)
router.get('/earnings',        requireAuth, requireRole('vendor'), getVendorEarnings)
router.get('/orders',          requireAuth, requireRole('vendor'), getVendorOrders)
router.post('/payout-request',              requireAuth, requireRole('vendor'), requestPayout)
router.put('/orders/:itemId/status',       requireAuth, requireRole('vendor'), updateVendorOrderStatus)
router.get('/disputes',                    requireAuth, requireRole('vendor'), getVendorDisputes)
router.get('/refunds',                     requireAuth, requireRole('vendor'), getVendorRefunds)
router.put('/refunds/:id/process',         requireAuth, requireRole('vendor'), processVendorRefund)

// ── Public vendor storefront — must be LAST so named routes win ───
router.get('/:id/reviews',  listVendorReviews)
router.post('/:id/reviews', requireAuth, submitVendorReview)
router.get('/:id',          getVendor)

export default router
