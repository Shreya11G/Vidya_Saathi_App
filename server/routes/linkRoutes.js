import express from 'express';
import { body, param } from 'express-validator';
import {
  getLinks,
  getLink,
  createLink,
  updateLink,
  deleteLink,
  recordClick,
  toggleFavorite,
  searchLinks,
  getLinkStats
} from '../controllers/linkController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all link routes
router.use(authenticate);

/**
 * Validation Rules for Link Creation
 */
const createLinkValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Link title must be between 1 and 200 characters'),
  
  body('url')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: false })
    .withMessage('Please provide a valid URL'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn(['study_material', 'tutorial', 'documentation', 'video_lecture', 'research_paper', 'tool', 'reference', 'course', 'practice', 'other'])
    .withMessage('Invalid category')
];

/**
 * Link CRUD Routes
 */

// GET /api/links - Get all links for authenticated user
router.get('/', getLinks);

// GET /api/links/stats - Get link statistics
router.get('/stats', getLinkStats);

// GET /api/links/search - Search links
router.get('/search', searchLinks);

// GET /api/links/:id - Get specific link
router.get('/:id', param('id').isMongoId().withMessage('Invalid link ID'), getLink);

// POST /api/links - Create new link
router.post('/', createLinkValidation, createLink);

// PUT /api/links/:id - Update link
router.put('/:id', param('id').isMongoId().withMessage('Invalid link ID'), updateLink);

// POST /api/links/:id/click - Record link click
router.post('/:id/click', param('id').isMongoId().withMessage('Invalid link ID'), recordClick);

// PATCH /api/links/:id/favorite - Toggle link favorite status
router.patch('/:id/favorite', param('id').isMongoId().withMessage('Invalid link ID'), toggleFavorite);

// DELETE /api/links/:id - Delete link
router.delete('/:id', param('id').isMongoId().withMessage('Invalid link ID'), deleteLink);

export default router;