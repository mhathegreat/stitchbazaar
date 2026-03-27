import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { requireAuth } from '../middleware/auth.js'
import {
  register, registerSchema,
  login,    loginSchema,
  logout, refresh,
  forgotPassword, forgotSchema,
  resetPassword,  resetSchema,
  updateProfile,
} from '../controllers/authController.js'

const router = Router()

router.post('/register',        authLimiter, validate(registerSchema), register)
router.post('/login',           authLimiter, validate(loginSchema),    login)
router.post('/logout',          logout)
router.post('/refresh',         refresh)
router.post('/forgot-password', authLimiter, validate(forgotSchema),   forgotPassword)
router.post('/reset-password',  authLimiter, validate(resetSchema),    resetPassword)
router.put('/profile',          requireAuth, updateProfile)

export default router
