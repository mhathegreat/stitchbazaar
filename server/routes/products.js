import { Router } from 'express'
import { requireAuth }    from '../middleware/auth.js'
import { requireRole }    from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  listProducts, getProduct, createProduct,
  updateProduct, deleteProduct, listMyProducts, autocomplete,
} from '../controllers/productController.js'

const router = Router()
router.use(generalLimiter)

// Named routes MUST come before /:id wildcard
router.get('/autocomplete', autocomplete)
router.get('/vendor/mine', requireAuth, requireRole('vendor'), listMyProducts)
router.get('/',            listProducts)
router.post('/',           requireAuth, requireRole('vendor', 'admin'), createProduct)
router.put('/:id',         requireAuth, requireRole('vendor', 'admin'), updateProduct)
router.delete('/:id',      requireAuth, requireRole('vendor', 'admin'), deleteProduct)
router.get('/:id',         getProduct)

export default router
