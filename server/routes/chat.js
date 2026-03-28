import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import {
  startConversation, startConversationAsVendor, listConversations, getConversation,
  sendMessage, markRead,
} from '../controllers/chatController.js'

const router = Router()
router.use(generalLimiter, requireAuth)

router.post('/as-vendor',            startConversationAsVendor)
router.post('/',                     startConversation)
router.get('/',                      listConversations)
router.get('/:id',                   getConversation)
router.post('/:id/messages',         sendMessage)
router.put('/:id/read',              markRead)

export default router
