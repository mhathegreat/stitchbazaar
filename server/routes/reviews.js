import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listReviews, submitReview } from '../controllers/reviewController.js'

const router = Router()

router.get('/product/:productId', listReviews)
router.post('/',                  requireAuth, submitReview)

export default router
