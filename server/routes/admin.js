import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import {
  getAdminDashboard, getAnalytics,
  listAllVendors, approveVendor, rejectVendor,
  listPayouts, processPayout,
  listDisputes, resolveDispute,
  listCategories, createCategory, updateCategory, deleteCategory,
  listAllOrders, listAllProducts, moderateProduct,
  updateOrderStatus, listAuditLogs,
} from '../controllers/adminController.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

// Dashboard
router.get('/dashboard',             getAdminDashboard)
router.get('/analytics',             getAnalytics)

// Vendors
router.get('/vendors',               listAllVendors)
router.put('/vendors/:id/approve',   approveVendor)
router.put('/vendors/:id/reject',    rejectVendor)

// Payouts
router.get('/payouts',               listPayouts)
router.put('/payouts/:id/process',   processPayout)

// Disputes
router.get('/disputes',              listDisputes)
router.put('/disputes/:id/resolve',  resolveDispute)

// Categories
router.get('/categories',            listCategories)
router.post('/categories',           createCategory)
router.put('/categories/:id',        updateCategory)
router.delete('/categories/:id',     deleteCategory)

// All orders
router.get('/orders',                listAllOrders)
router.put('/orders/:id/status',     updateOrderStatus)

// All products (moderation)
router.get('/products',              listAllProducts)
router.put('/products/:id/moderate', moderateProduct)

// Audit log
router.get('/audit-logs',            listAuditLogs)

export default router
