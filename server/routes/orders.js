import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { requireRole }  from '../middleware/roleCheck.js'
import { orderLimiter } from '../middleware/rateLimiter.js'
import {
  createOrder, listOrders, getOrder,
  updateOrderStatus, raiseDispute, updateOrder,
} from '../controllers/orderController.js'

const router = Router()

router.post('/',              orderLimiter, optionalAuth, createOrder)
router.get('/',               requireAuth,               listOrders)
router.get('/:id',            requireAuth,               getOrder)
router.patch('/:id',          requireAuth,               updateOrder)
router.put('/:id/status',     requireAuth, requireRole('vendor', 'admin'), updateOrderStatus)
router.post('/:id/dispute',   requireAuth,               raiseDispute)

export default router
