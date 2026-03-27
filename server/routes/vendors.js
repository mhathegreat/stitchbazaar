import { Router } from 'express'
import { requireAuth }  from '../middleware/auth.js'
import { requireRole }  from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  listVendors, getVendor, registerVendor, updateVendorProfile,
  getVendorDashboard, requestPayout, getVendorEarnings, getVendorOrders,
} from '../controllers/vendorController.js'

const router = Router()
router.use(generalLimiter)

// Public
router.get('/',    listVendors)
router.get('/:id', getVendor)

// Auth required
router.post('/register',       requireAuth, registerVendor)
router.put('/profile',         requireAuth, requireRole('vendor'), updateVendorProfile)
router.get('/dashboard',       requireAuth, requireRole('vendor'), getVendorDashboard)
router.get('/earnings',        requireAuth, requireRole('vendor'), getVendorEarnings)
router.get('/orders',          requireAuth, requireRole('vendor'), getVendorOrders)
router.post('/payout-request', requireAuth, requireRole('vendor'), requestPayout)

export default router
