import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema Definition
 * Defines the structure for user data in MongoDB
 * Includes authentication fields, profile data, and streak tracking
 */
const userSchema = new mongoose.Schema({
  // Authentication fields
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // User role for access control
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  
  // Profile information for AI personalization
  profile: {
    interests: [{
      type: String,
      trim: true
    }],
    academicLevel: {
      type: String,
      enum: ['high_school', 'undergraduate', 'graduate', 'other'],
      default: 'undergraduate'
    },
    subjects: [{
      type: String,
      trim: true
    }],
    careerGoals: {
      type: String,
      trim: true,
      maxlength: [500, 'Career goals cannot exceed 500 characters']
    }
  },
  
  // Streak tracking for gamification
  streaks: {
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastLoginDate: {
      type: Date,
      default: null
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    tasksCompletedToday: {
      type: Number,
      default: 0,
      min: 0
    },
    lastTaskCompletionDate: {
      type: Date,
      default: null
    }
  },
  
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'pink-blue'],
      default: 'light'
    },
    pomodoroSettings: {
      workDuration: {
        type: Number,
        default: 25, // minutes
        min: 1,
        max: 60
      },
      breakDuration: {
        type: Number,
        default: 5, // minutes
        min: 1,
        max: 30
      }
    }
  },
  
  // Account status and verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  collection: 'users'
});

/**
 * Pre-save Middleware
 * Hash password before saving to database
 * Only hash if password is modified
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt with cost factor of 12 for security
    const salt = await bcrypt.genSalt(12);
    
    // Hash password with generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Compare Password
 * Compares provided password with hashed password in database
 * @param {string} candidatePassword - Password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance Method: Update Login Streak
 * Updates user's login streak based on current date
 * Maintains streak if logged in consecutive days, resets if gap exists
 */
userSchema.methods.updateLoginStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const lastLogin = this.streaks.lastLoginDate;
  
  if (!lastLogin) {
    // First login
    this.streaks.currentStreak = 1;
    this.streaks.longestStreak = 1;
    this.streaks.lastLoginDate = today;
  } else {
    const lastLoginDate = new Date(lastLogin);
    lastLoginDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - lastLoginDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      // Consecutive day login - increment streak
      this.streaks.currentStreak += 1;
      this.streaks.longestStreak = Math.max(
        this.streaks.currentStreak,
        this.streaks.longestStreak
      );
      this.streaks.lastLoginDate = today;
    } else if (diffDays > 1) {
      // Gap in login - reset streak
      this.streaks.currentStreak = 1;
      this.streaks.lastLoginDate = today;
    }
    // If diffDays === 0, it's the same day, no change needed
  }
};

/**
 * Instance Method: Update Task Completion Streak
 * Updates daily task completion tracking
 * Resets daily counter if it's a new day
 */
userSchema.methods.updateTaskCompletion = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastTaskDate = this.streaks.lastTaskCompletionDate;
  
  if (!lastTaskDate || lastTaskDate < today) {
    // New day - reset daily counter
    this.streaks.tasksCompletedToday = 1;
    this.streaks.lastTaskCompletionDate = today;
  } else {
    // Same day - increment counter
    this.streaks.tasksCompletedToday += 1;
  }
  
  // Always increment total tasks completed
  this.streaks.totalTasksCompleted += 1;
};

// Create indexes for performance optimization
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'streaks.currentStreak': -1 });

// Export the User model
export default mongoose.model('User', userSchema);