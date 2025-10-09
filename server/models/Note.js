import mongoose from 'mongoose';

/**
 * Note Schema Definition
 * Defines the structure for notes/sticky notes data in MongoDB
 * Includes note content, formatting, and user association
 */
const noteSchema = new mongoose.Schema({
  // Note ownership
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster user-specific queries
  },
  
  // Note content
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Note title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxlength: [10000, 'Note content cannot exceed 10000 characters']
  },
  
  // Note categorization
  category: {
    type: String,
    enum: ['study', 'personal', 'work', 'ideas', 'reminders', 'other'],
    default: 'study'
  },
  
  // Note organization and tagging
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Note visual properties (for sticky notes UI)
  color: {
    type: String,
    enum: ['yellow', 'blue', 'green', 'pink', 'orange', 'purple', 'gray'],
    default: 'yellow'
  },
  position: {
    x: {
      type: Number,
      default: 0,
      min: 0
    },
    y: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  size: {
    width: {
      type: Number,
      default: 250,
      min: 150,
      max: 500
    },
    height: {
      type: Number,
      default: 250,
      min: 150,
      max: 500
    }
  },
  
  // Note status and metadata
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // Auto-save tracking
  lastAutoSaved: {
    type: Date,
    default: Date.now
  },
  autoSaveEnabled: {
    type: Boolean,
    default: true
  },
  
  // Note formatting preferences
  formatting: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    fontFamily: {
      type: String,
      enum: ['default', 'serif', 'mono'],
      default: 'default'
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'notes'
});

/**
 * Pre-save Middleware
 * Update auto-save timestamp when content changes
 */
noteSchema.pre('save', function(next) {
  // Update auto-save timestamp if content has changed
  if (this.isModified('content') || this.isModified('title')) {
    this.lastAutoSaved = new Date();
  }
  
  // Ensure position values are non-negative
  if (this.position.x < 0) this.position.x = 0;
  if (this.position.y < 0) this.position.y = 0;
  
  // Ensure size values are within bounds
  if (this.size.width < 150) this.size.width = 150;
  if (this.size.width > 500) this.size.width = 500;
  if (this.size.height < 150) this.size.height = 150;
  if (this.size.height > 500) this.size.height = 500;
  
  next();
});

/**
 * Instance Method: Toggle Pin Status
 * Toggles the pinned status of the note
 */
noteSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
};

/**
 * Instance Method: Toggle Favorite Status
 * Toggles the favorite status of the note
 */
noteSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
};

/**
 * Instance Method: Archive Note
 * Archives the note (moves to archive section)
 */
noteSchema.methods.archive = function() {
  this.isArchived = true;
  this.isPinned = false; // Archived notes cannot be pinned
};

/**
 * Instance Method: Unarchive Note
 * Removes note from archive
 */
noteSchema.methods.unarchive = function() {
  this.isArchived = false;
};

/**
 * Instance Method: Update Position
 * Updates the position of the sticky note on screen
 */
noteSchema.methods.updatePosition = function(x, y) {
  this.position.x = Math.max(0, x);
  this.position.y = Math.max(0, y);
};

/**
 * Instance Method: Update Size
 * Updates the size of the sticky note
 */
noteSchema.methods.updateSize = function(width, height) {
  this.size.width = Math.max(150, Math.min(500, width));
  this.size.height = Math.max(150, Math.min(500, height));
};

/**
 * Instance Method: Add Tag
 * Adds a new tag to the note if it doesn't already exist
 */
noteSchema.methods.addTag = function(tag) {
  const trimmedTag = tag.trim().toLowerCase();
  if (trimmedTag && !this.tags.includes(trimmedTag)) {
    this.tags.push(trimmedTag);
  }
};

/**
 * Instance Method: Remove Tag
 * Removes a tag from the note
 */
noteSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag.trim().toLowerCase());
};

/**
 * Static Method: Get User Note Statistics
 * Returns note statistics for a specific user
 */
noteSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          pinnedNotes: {
            $sum: { $cond: [{ $eq: ['$isPinned', true] }, 1, 0] }
          },
          archivedNotes: {
            $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] }
          },
          favoriteNotes: {
            $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] }
          },
          averageContentLength: { $avg: { $strLenCP: '$content' } }
        }
      }
    ]);
    
    return stats[0] || {
      totalNotes: 0,
      pinnedNotes: 0,
      archivedNotes: 0,
      favoriteNotes: 0,
      averageContentLength: 0
    };
  } catch (error) {
    throw new Error('Failed to calculate user note statistics');
  }
};

/**
 * Static Method: Search Notes
 * Performs text search across note titles and content
 */
noteSchema.statics.searchUserNotes = async function(userId, searchTerm, options = {}) {
  try {
    const query = {
      userId: mongoose.Types.ObjectId(userId),
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    // Add additional filters
    if (options.category) {
      query.category = options.category;
    }
    if (options.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }
    if (options.isArchived !== undefined) {
      query.isArchived = options.isArchived;
    }
    
    const notes = await this.find(query)
      .sort({ updatedAt: -1 })
      .limit(options.limit || 50);
    
    return notes;
  } catch (error) {
    throw new Error('Failed to search notes');
  }
};

// Create indexes for performance optimization
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isPinned: -1 });
noteSchema.index({ userId: 1, isArchived: 1 });
noteSchema.index({ userId: 1, category: 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Export the Note model
export default mongoose.model('Note', noteSchema);