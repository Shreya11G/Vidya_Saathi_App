import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  checkAuth,
  getSession,
  getAuthConfig,
  sendOtp,
  resetPassword,
  uploadProfilePhoto,
  getProfilePhoto,
  deleteProfilePhoto,
} from '../controllers/authController.js';
import { authenticate, authRateLimit, optionalAuth, otpSendRateLimit } from '../middleware/auth.js';
import { isOtpEnabled } from '../utils/otpConfig.js';

const router = express.Router();

const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(avatarsDir, req.user._id.toString());
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  },
});


// Authentication Routes
// Handles user registration, login, logout, and profile management
// All routes use appropriate validation and rate limiting



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
    .withMessage('Interests must be an array'),

  body('otp')
    .if(() => isOtpEnabled())
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
];


// Validation Rules for Login


const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('otp')
    .if(() => isOtpEnabled())
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
];


// Validates profile information updates

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



// Validates password change request

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


 //Validates password for account deletion

const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion')
];

const sendOtpValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('purpose')
    .isIn(['register', 'login', 'reset_password'])
    .withMessage('Invalid OTP purpose'),
];

const resetPasswordValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('otp')
    .if(() => isOtpEnabled())
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
];

//Public Routes (No Authentication Required)
 

// GET /api/auth/config - Public auth feature flags
router.get('/config', getAuthConfig);

// POST /api/auth/send-otp - Send OTP to email (higher limit than login)
router.post('/send-otp', otpSendRateLimit(15 * 60 * 1000, 20), sendOtpValidation, sendOtp);

// POST /api/auth/reset-password - Reset password with OTP (public)
router.post('/reset-password', authRateLimit(15 * 60 * 1000, 5), resetPasswordValidation, resetPassword);

// POST /api/auth/register - Register new user
router.post('/register', authRateLimit(15 * 60 * 1000, 3), registerValidation, register);

// POST /api/auth/login - Login user
router.post('/login', authRateLimit(15 * 60 * 1000, 5), loginValidation, login);

// POST /api/auth/logout - Logout user 
router.post('/logout', logout);

// GET /api/auth/session - Check session without 401 for guests
router.get('/session', optionalAuth, getSession);

//Protected Routes (Authentication Required)
 

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticate, getProfile);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

// Profile photo
router.get('/profile-photo', authenticate, getProfilePhoto);
router.post('/profile-photo', authenticate, avatarUpload.single('photo'), uploadProfilePhoto);
router.delete('/profile-photo', authenticate, deleteProfilePhoto);

// PUT /api/auth/change-password - Change user password
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

// POST /api/auth/reset-password-authenticated - Reset password via OTP when logged in
router.post('/reset-password-authenticated', authenticate, authRateLimit(15 * 60 * 1000, 5), resetPasswordValidation, resetPassword);

// POST /api/auth/send-otp-authenticated - Send OTP to logged-in user's email
router.post(
  '/send-otp-authenticated',
  authenticate,
  otpSendRateLimit(15 * 60 * 1000, 20),
  async (req, res) => {
    req.body.email = req.user.email;
    req.body.purpose = 'reset_password';
    return sendOtp(req, res);
  }
);

// DELETE /api/auth/account - Delete user account
router.delete('/account', authenticate, deleteAccountValidation, deleteAccount);

// GET /api/auth/check - Check authentication status
router.get('/check', authenticate, checkAuth);


router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;