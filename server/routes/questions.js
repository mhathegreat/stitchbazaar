import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listQuestions,
  askQuestion,
  answerQuestion,
  deleteQuestion,
} from '../controllers/questionController.js'

const router = Router()

// Nested under /products/:id/questions
router.get( '/products/:id/questions',       listQuestions)
router.post('/products/:id/questions',       requireAuth, askQuestion)

// Standalone /questions/:id
router.patch( '/questions/:id/answer',       requireAuth, answerQuestion)
router.delete('/questions/:id',              requireAuth, deleteQuestion)

export default router
