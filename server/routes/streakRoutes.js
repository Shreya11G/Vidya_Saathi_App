import express from 'express';
import { getUserStreaks, updateStreak } from '../controllers/streakController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all streak routes
router.use(authenticate);


//   Streak Routes



// GET /api/streaks - Get user streak information
router.get('/', getUserStreaks);

// POST /api/streaks/update - Update user streak 
router.post('/update', updateStreak);

export default router;