import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  checkAuth
} from '../controllers/authController.js';
import { authenticate, authRateLimit } from '../middleware/auth.js';

const router = express.Router();

/**
 * Authentication Routes
 * Handles user registration, login, logout, and profile management
 * All routes use appropriate validation and rate limiting
 */

/**
 * Validation Rules for Registration
 * Validates user input for account creation
 */
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('academicLevel')
    .optional()
    .isIn(['high_school', 'undergraduate', 'graduate', 'other'])
    .withMessage('Invalid academic level'),
  
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array')
];

/**
 * Validation Rules for Login
 * Validates user credentials
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation Rules for Profile Update
 * Validates profile information updates
 */
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('profile.academicLevel')
    .optional()
    .isIn(['high_school', 'undergraduate', 'graduate', 'other'])
    .withMessage('Invalid academic level'),
  
  body('profile.subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array'),
  
  body('profile.interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('profile.careerGoals')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Career goals cannot exceed 500 characters'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'pink-blue'])
    .withMessage('Invalid theme selection'),
  
  body('preferences.pomodoroSettings.workDuration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Work duration must be between 1 and 60 minutes'),
  
  body('preferences.pomodoroSettings.breakDuration')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Break duration must be between 1 and 30 minutes')
];

/**
 * Validation Rules for Password Change
 * Validates password change request
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation Rules for Account Deletion
 * Validates password for account deletion
 */
const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion')
];

/**
 * Public Routes (No Authentication Required)
 */

// POST /api/auth/register - Register new user
router.post('/register', authRateLimit(15 * 60 * 1000, 3), registerValidation, register);

// POST /api/auth/login - Login user
router.post('/login', authRateLimit(15 * 60 * 1000, 5), loginValidation, login);

// POST /api/auth/logout - Logout user (can be called without auth)
router.post('/logout', logout);

/**
 * Protected Routes (Authentication Required)
 */

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticate, getProfile);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

// PUT /api/auth/change-password - Change user password
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

// DELETE /api/auth/account - Delete user account
router.delete('/account', authenticate, deleteAccountValidation, deleteAccount);

// GET /api/auth/check - Check authentication status
router.get('/check', authenticate, checkAuth);

/**
 * Health Check Route
 * Simple endpoint to check if auth service is working
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;