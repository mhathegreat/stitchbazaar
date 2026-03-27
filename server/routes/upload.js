import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { uploadLimiter } from '../middleware/rateLimiter.js'
import { uploadImage } from '../utils/cloudinary.js'

const router  = Router()
const storage = multer.memoryStorage()
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
  },
})

/**
 * POST /api/v1/upload
 * Upload a single image to Cloudinary.
 * Returns { url, publicId }
 */
router.post('/', uploadLimiter, requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' })
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    const folder  = req.query.folder || 'stitchbazaar'
    const result  = await uploadImage(base64, folder)

    res.json({ success: true, data: result, message: 'Image uploaded successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
