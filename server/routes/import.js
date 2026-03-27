import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roleCheck.js'
import { generalLimiter } from '../middleware/rateLimiter.js'
import { importProducts } from '../controllers/importController.js'

const router = Router()
router.use(generalLimiter)

// Accept CSV as memory buffer (not saved to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },  // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only .csv files are allowed'))
    }
  },
})

router.post('/products', requireAuth, requireRole('vendor', 'admin'), upload.single('file'), importProducts)

export default router
