import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { syncCart } from '../controllers/cartController.js'

const router = Router()

router.post('/sync', requireAuth, syncCart)

export default router
