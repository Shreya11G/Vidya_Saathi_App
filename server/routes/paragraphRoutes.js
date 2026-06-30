import express from 'express';
import { body, param } from 'express-validator';
import {
  getParagraphs,
  createParagraph,
  updateParagraph,
  deleteParagraph,
} from '../controllers/paragraphController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

const paragraphBodyValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Paragraph must be between 1 and 50000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
];

router.get('/', getParagraphs);
router.post('/', paragraphBodyValidation, createParagraph);
router.put('/:id', param('id').isMongoId(), paragraphBodyValidation, updateParagraph);
router.delete('/:id', param('id').isMongoId(), deleteParagraph);

export default router;
