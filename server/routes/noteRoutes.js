import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  toggleFavorite,
  searchNotes,
  getNoteStats
} from '../controllers/noteController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Note Routes
 * All routes require authentication
 * Handles CRUD operations for notes/sticky notes
 */

// Apply authentication middleware to all note routes
router.use(authenticate);

/**
 * Validation Rules for Note Creation
 */
const createNoteValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Note title must be between 1 and 200 characters'),
  
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Note content must be between 1 and 10000 characters'),
  
  body('category')
    .optional()
    .isIn(['study', 'personal', 'work', 'ideas', 'reminders', 'other'])
    .withMessage('Invalid category'),
  
  body('color')
    .optional()
    .isIn(['yellow', 'blue', 'green', 'pink', 'orange', 'purple', 'gray'])
    .withMessage('Invalid color'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

/**
 * Validation Rules for Note Update
 */
const updateNoteValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid note ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Note title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Note content must be between 1 and 10000 characters'),
  
  body('category')
    .optional()
    .isIn(['study', 'personal', 'work', 'ideas', 'reminders', 'other'])
    .withMessage('Invalid category'),
  
  body('color')
    .optional()
    .isIn(['yellow', 'blue', 'green', 'pink', 'orange', 'purple', 'gray'])
    .withMessage('Invalid color'),
  
  body('position.x')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position X must be a non-negative integer'),
  
  body('position.y')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position Y must be a non-negative integer'),
  
  body('size.width')
    .optional()
    .isInt({ min: 150, max: 500 })
    .withMessage('Width must be between 150 and 500 pixels'),
  
  body('size.height')
    .optional()
    .isInt({ min: 150, max: 500 })
    .withMessage('Height must be between 150 and 500 pixels')
];

/**
 * Note CRUD Routes
 */

// GET /api/notes - Get all notes for authenticated user
router.get('/', getNotes);

// GET /api/notes/stats - Get note statistics
router.get('/stats', getNoteStats);

// GET /api/notes/search - Search notes
router.get('/search', searchNotes);

// GET /api/notes/:id - Get specific note
router.get('/:id', param('id').isMongoId().withMessage('Invalid note ID'), getNote);

// POST /api/notes - Create new note
router.post('/', createNoteValidation, createNote);

// PUT /api/notes/:id - Update note
router.put('/:id', updateNoteValidation, updateNote);

// PATCH /api/notes/:id/pin - Toggle note pin status
router.patch('/:id/pin', param('id').isMongoId().withMessage('Invalid note ID'), togglePin);

// PATCH /api/notes/:id/favorite - Toggle note favorite status
router.patch('/:id/favorite', param('id').isMongoId().withMessage('Invalid note ID'), toggleFavorite);

// DELETE /api/notes/:id - Delete note
router.delete('/:id', param('id').isMongoId().withMessage('Invalid note ID'), deleteNote);

export default router;