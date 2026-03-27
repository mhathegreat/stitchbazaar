import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js'

const router = Router()

router.get('/',                 requireAuth, getWishlist)
router.post('/',                requireAuth, addToWishlist)
router.delete('/:productId',    requireAuth, removeFromWishlist)

export default router
