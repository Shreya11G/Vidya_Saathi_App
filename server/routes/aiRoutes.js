import express from 'express';
import { body } from 'express-validator';
import {
  askTutor,
  getCareerAdvice,
  getChatHistory,
  deleteChatHistory
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all AI routes
router.use(authenticate);

/**
 * Validation Rules for AI Tutor Questions
 */
const tutorValidation = [
  body('question')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject cannot exceed 100 characters'),
  
  body('context')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Context cannot exceed 500 characters')
];

/**
 * Validation Rules for Career Advice
 */
const careerValidation = [
  body('question')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters'),
  
  body('careerField')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Career field cannot exceed 100 characters')
];

/**
 * AI Routes
 */

// POST /api/ai/tutor - Ask AI tutor a question
router.post('/tutor', tutorValidation, askTutor);

// POST /api/ai/career - Get AI career advice
router.post('/career', careerValidation, getCareerAdvice);

// GET /api/ai/history - Get chat history
router.get('/history', getChatHistory);

// DELETE /api/ai/history - Clear chat history
router.delete('/history', deleteChatHistory);

export default router;