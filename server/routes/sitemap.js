import { Router } from 'express'
import { generateSitemap } from '../utils/sitemap.js'
import { logger } from '../utils/logger.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const xml = await generateSitemap()
    res.header('Content-Type', 'application/xml')
    res.header('Cache-Control', 'public, max-age=3600')
    res.send(xml)
  } catch (err) {
    logger.error(`Sitemap generation failed: ${err.message}`)
    next(err)
  }
})

export default router
