import mongoose from 'mongoose';

/**
 * Task Schema Definition
 * Defines the structure for task/todo data in MongoDB
 * Includes task details, status tracking, and user association
 */
const taskSchema = new mongoose.Schema({
  // Task identification and ownership
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster user-specific queries
  },
  
  // Task content
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  
  // Task categorization and prioritization
  category: {
    type: String,
    enum: ['academic', 'personal', 'career', 'health', 'other'],
    default: 'academic'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Task status and completion tracking
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Task scheduling
  dueDate: {
    type: Date,
    default: null
  },
  reminderDate: {
    type: Date,
    default: null
  },
  
  // Task metadata
  estimatedDuration: {
    type: Number, // in minutes
    min: 1,
    max: 1440 // max 24 hours
  },
  actualDuration: {
    type: Number, // in minutes
    min: 0
  },
  
  // Task organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Subtasks for complex tasks
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Subtask title cannot exceed 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  
  // Task progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'tasks'
});

/**
 * Pre-save Middleware
 * Automatically update task status and completion tracking
 */
taskSchema.pre('save', function(next) {
  // Auto-update completion status based on completed field
  if (this.completed && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
    this.progress = 100;
  } else if (!this.completed && this.status === 'completed') {
    this.status = 'pending';
    this.completedAt = null;
    this.progress = 0;
  }
  
  // Calculate progress based on subtasks
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
    this.progress = Math.round((completedSubtasks / this.subtasks.length) * 100);
    
    // Auto-complete main task if all subtasks are done
    if (completedSubtasks === this.subtasks.length && !this.completed) {
      this.completed = true;
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  
  next();
});

/**
 * Instance Method: Toggle Task Completion
 * Toggles task completion status and updates relevant fields
 */
taskSchema.methods.toggleCompletion = function() {
  this.completed = !this.completed;
  
  if (this.completed) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.progress = 100;
  } else {
    this.status = 'pending';
    this.completedAt = null;
    // Reset progress based on subtasks if any
    if (this.subtasks && this.subtasks.length > 0) {
      const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
      this.progress = Math.round((completedSubtasks / this.subtasks.length) * 100);
    } else {
      this.progress = 0;
    }
  }
};

/**
 * Instance Method: Add Subtask
 * Adds a new subtask to the task
 */
taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({
    title: title.trim(),
    completed: false
  });
};

/**
 * Instance Method: Toggle Subtask Completion
 * Toggles completion status of a specific subtask
 */
taskSchema.methods.toggleSubtask = function(subtaskId) {
  const subtask = this.subtasks.id(subtaskId);
  if (subtask) {
    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;
  }
};

/**
 * Static Method: Get User Statistics
 * Returns task completion statistics for a specific user
 */
taskSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          averageProgress: { $avg: '$progress' }
        }
      }
    ]);
    
    return stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      averageProgress: 0
    };
  } catch (error) {
    throw new Error('Failed to calculate user task statistics');
  }
};

// Create indexes for performance optimization
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });

// Export the Task model
export default mongoose.model('Task', taskSchema);