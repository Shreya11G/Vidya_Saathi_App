import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  getTaskStats,
  searchTasks
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Task Routes
 * All routes require authentication
 * Handles CRUD operations for tasks/todos
 */

// Apply authentication middleware to all task routes
router.use(authenticate);

/**
 * Validation Rules for Task Creation
 */
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['academic', 'personal', 'career', 'health', 'other'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid due date format'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Estimated duration must be between 1 and 1440 minutes')
];

/**
 * Validation Rules for Task Update
 */
const updateTaskValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['academic', 'personal', 'career', 'health', 'other'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid due date format'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Estimated duration must be between 1 and 1440 minutes'),
  
  body('actualDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Actual duration must be a positive number')
];

/**
 * Validation Rules for Task ID Parameter
 */
const taskIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID')
];

/**
 * Validation Rules for Task Search
 */
const searchValidation = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isIn(['academic', 'personal', 'career', 'health', 'other'])
    .withMessage('Invalid category filter'),
  
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Task CRUD Routes
 */

// GET /api/tasks - Get all tasks for authenticated user
router.get('/', getTasks);

// GET /api/tasks/stats - Get task statistics for authenticated user
router.get('/stats', getTaskStats);

// GET /api/tasks/search - Search tasks
router.get('/search', searchValidation, searchTasks);

// GET /api/tasks/:id - Get specific task
router.get('/:id', taskIdValidation, getTask);

// POST /api/tasks - Create new task
router.post('/', createTaskValidation, createTask);

// PUT /api/tasks/:id - Update task
router.put('/:id', updateTaskValidation, updateTask);

// PATCH /api/tasks/:id/toggle - Toggle task completion
router.patch('/:id/toggle', taskIdValidation, toggleTaskCompletion);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', taskIdValidation, deleteTask);

export default router;