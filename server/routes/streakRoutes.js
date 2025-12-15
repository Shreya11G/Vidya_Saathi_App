import express from 'express';
import { getUserStreaks, updateStreak } from '../controllers/streakController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all streak routes
router.use(authenticate);


//   Streak Routes
//   Handles user streak tracking and statistics


// GET /api/streaks - Get user streak information
router.get('/', getUserStreaks);

// POST /api/streaks/update - Update user streak (for manual updates)
router.post('/update', updateStreak);

export default router;