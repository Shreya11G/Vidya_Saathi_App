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

  profilePhoto: {
    type: String,
    default: null,
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
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      taskReminders: {
        type: Boolean,
        default: true
      },
      streakReminders: {
        type: Boolean,
        default: true
      }
    }
  },

  // Tracks when notification emails were last sent (prevents duplicates)
  notificationMeta: {
    lastStreakReminderAt: {
      type: Date,
      default: null
    },
    lastWeeklyDigestAt: {
      type: Date,
      default: null
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
 * Instance Method: Validate Current Streak
 * Resets streak if the user missed more than one day of task activity
 */
userSchema.methods.validateCurrentStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.streaks.lastTaskCompletionDate) {
    if (this.streaks.currentStreak > 0) {
      this.streaks.currentStreak = 0;
    }
    this.streaks.tasksCompletedToday = 0;
    return;
  }

  const last = new Date(this.streaks.lastTaskCompletionDate);
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    this.streaks.currentStreak = 0;
  }

  if (diffDays >= 1) {
    this.streaks.tasksCompletedToday = 0;
  }
};

/**
 * Instance Method: Update Login Streak
 * Records login and validates streak expiry (streak is earned via tasks)
 */
userSchema.methods.updateLoginStreak = function() {
  this.validateCurrentStreak();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  this.streaks.lastLoginDate = today;
};

/**
 * Instance Method: Update Task Completion Streak
 * Updates daily counters and consecutive-day streak on task completion
 */
userSchema.methods.updateTaskCompletion = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastTaskDate = this.streaks.lastTaskCompletionDate;

  if (!lastTaskDate) {
    this.streaks.currentStreak = 1;
    this.streaks.longestStreak = Math.max(1, this.streaks.longestStreak);
    this.streaks.tasksCompletedToday = 1;
    this.streaks.lastTaskCompletionDate = today;
  } else {
    const last = new Date(lastTaskDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      this.streaks.tasksCompletedToday += 1;
    } else if (diffDays === 1) {
      this.streaks.currentStreak += 1;
      this.streaks.longestStreak = Math.max(
        this.streaks.currentStreak,
        this.streaks.longestStreak
      );
      this.streaks.tasksCompletedToday = 1;
      this.streaks.lastTaskCompletionDate = today;
    } else {
      this.streaks.currentStreak = 1;
      this.streaks.longestStreak = Math.max(
        1,
        this.streaks.longestStreak
      );
      this.streaks.tasksCompletedToday = 1;
      this.streaks.lastTaskCompletionDate = today;
    }
  }

  this.streaks.totalTasksCompleted += 1;
};

// Create indexes for performance optimization
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'streaks.currentStreak': -1 });

export default mongoose.model('User', userSchema);