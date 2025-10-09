import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body } from 'express-validator';
import {
  generateQuiz,
  startQuiz,
  submitQuiz,
  getQuizResult,
  getUserQuizHistory
} from '../controllers/quizController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ✅ Ensure upload folder exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure multer for file uploads
 * Supports: PDF, Word, PowerPoint
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // cross-platform safe
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];

    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, Word, and PowerPoint files are allowed.'));
  }
});

// ✅ Authentication middleware for all quiz routes
router.use(authenticate);

/**
 * Validation Rules
 */
const startQuizValidation = [
  body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
  body('numberOfQuestions')
    .isInt({ min: 30, max: 100 })
    .isIn([30, 60, 90, 100])
    .withMessage('Number of questions must be 30, 60, 90, or 100')
];

const submitQuizValidation = [
  body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
  body('answers').isArray({ min: 1 }).withMessage('Answers must be a non-empty array'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer')
];

/**
 * Quiz Routes
 */
router.post('/generate', upload.single('file'), generateQuiz);
router.post('/start', startQuizValidation, startQuiz);
router.post('/submit', submitQuizValidation, submitQuiz);
router.get('/result/:resultId', getQuizResult);
router.get('/history', getUserQuizHistory);

export default router;
