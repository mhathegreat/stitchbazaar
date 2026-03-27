import { Router } from 'express'
import { listCategories, getCategory } from '../controllers/categoryController.js'

const router = Router()

router.get('/',          listCategories)
router.get('/:slug',     getCategory)

export default router
