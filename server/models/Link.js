import mongoose from 'mongoose';

/**
 * Link Schema Definition
 * Defines the structure for important links/study resources in MongoDB
 * Includes link metadata, categorization, and user association
 */
const linkSchema = new mongoose.Schema({
  // Link ownership
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster user-specific queries
  },
  
  // Link basic information
  title: {
    type: String,
    required: [true, 'Link title is required'],
    trim: true,
    maxlength: [200, 'Link title cannot exceed 200 characters']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation regex
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Link categorization and organization
  category: {
    type: String,
    enum: [
      'study_material', 
      'tutorial', 
      'documentation', 
      'video_lecture', 
      'research_paper', 
      'tool',
      'reference',
      'course',
      'practice',
      'other'
    ],
    default: 'study_material'
  },
  
  // Subject/topic classification
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  
  // Tags for better organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Link status and metadata
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false // Whether other users can see this link
  },
  
  // Link interaction tracking
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastVisited: {
    type: Date,
    default: null
  },
  
  // Link validation and health
  isWorking: {
    type: Boolean,
    default: true
  },
  lastChecked: {
    type: Date,
    default: null
  },
  
  // Additional metadata that might be fetched from the URL
  metadata: {
    title: String, // Fetched page title
    description: String, // Fetched meta description
    favicon: String, // Favicon URL
    image: String, // Preview image URL
    siteName: String, // Site name from meta tags
    domain: String // Extracted domain name
  },
  
  // Priority for ordering
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Study progress tracking
  studyProgress: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'bookmarked'],
      default: 'not_started'
    },
    completedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'links'
});

/**
 * Pre-save Middleware
 * Process URL and extract metadata before saving
 */
linkSchema.pre('save', function(next) {
  // Ensure URL has protocol
  if (this.url && !this.url.startsWith('http://') && !this.url.startsWith('https://')) {
    this.url = 'https://' + this.url;
  }
  
  // Extract domain from URL
  if (this.url) {
    try {
      const urlObj = new URL(this.url);
      this.metadata.domain = urlObj.hostname;
    } catch (error) {
      // Invalid URL, will be caught by validation
    }
  }
  
  // Update completion status based on studyProgress
  if (this.studyProgress.status === 'completed' && !this.studyProgress.completedAt) {
    this.studyProgress.completedAt = new Date();
  } else if (this.studyProgress.status !== 'completed') {
    this.studyProgress.completedAt = null;
  }
  
  next();
});

/**
 * Instance Method: Record Click
 * Increments click count and updates last visited timestamp
 */
linkSchema.methods.recordClick = function() {
  this.clickCount += 1;
  this.lastVisited = new Date();
};

/**
 * Instance Method: Toggle Favorite
 * Toggles the favorite status of the link
 */
linkSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
};

/**
 * Instance Method: Update Study Progress
 * Updates the study progress status and related fields
 */
linkSchema.methods.updateStudyProgress = function(status, notes = null, rating = null) {
  this.studyProgress.status = status;
  if (notes) this.studyProgress.notes = notes;
  if (rating) this.studyProgress.rating = rating;
  
  if (status === 'completed') {
    this.studyProgress.completedAt = new Date();
  } else {
    this.studyProgress.completedAt = null;
  }
};

/**
 * Instance Method: Add Tag
 * Adds a new tag to the link if it doesn't already exist
 */
linkSchema.methods.addTag = function(tag) {
  const trimmedTag = tag.trim().toLowerCase();
  if (trimmedTag && !this.tags.includes(trimmedTag)) {
    this.tags.push(trimmedTag);
  }
};

/**
 * Instance Method: Remove Tag
 * Removes a tag from the link
 */
linkSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag.trim().toLowerCase());
};

/**
 * Static Method: Get User Link Statistics
 * Returns link statistics for a specific user
 */
linkSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          favoriteLinks: {
            $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] }
          },
          completedLinks: {
            $sum: { $cond: [{ $eq: ['$studyProgress.status', 'completed'] }, 1, 0] }
          },
          inProgressLinks: {
            $sum: { $cond: [{ $eq: ['$studyProgress.status', 'in_progress'] }, 1, 0] }
          },
          totalClicks: { $sum: '$clickCount' },
          averageRating: { $avg: '$studyProgress.rating' }
        }
      }
    ]);
    
    // Get category breakdown
    const categoryStats = await this.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return {
      ...(stats[0] || {
        totalLinks: 0,
        favoriteLinks: 0,
        completedLinks: 0,
        inProgressLinks: 0,
        totalClicks: 0,
        averageRating: 0
      }),
      categoryBreakdown: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  } catch (error) {
    throw new Error('Failed to calculate user link statistics');
  }
};

/**
 * Static Method: Search Links
 * Performs text search across link titles, descriptions, and tags
 */
linkSchema.statics.searchUserLinks = async function(userId, searchTerm, options = {}) {
  try {
    const query = {
      userId: mongoose.Types.ObjectId(userId),
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
        { subject: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    // Add additional filters
    if (options.category) {
      query.category = options.category;
    }
    if (options.isFavorite !== undefined) {
      query.isFavorite = options.isFavorite;
    }
    if (options.studyStatus) {
      query['studyProgress.status'] = options.studyStatus;
    }
    
    const links = await this.find(query)
      .sort({ updatedAt: -1 })
      .limit(options.limit || 50);
    
    return links;
  } catch (error) {
    throw new Error('Failed to search links');
  }
};

/**
 * Static Method: Get Popular Links
 * Returns most clicked links for a user
 */
linkSchema.statics.getPopularLinks = async function(userId, limit = 10) {
  try {
    const links = await this.find({ userId: mongoose.Types.ObjectId(userId) })
      .sort({ clickCount: -1, lastVisited: -1 })
      .limit(limit);
    
    return links;
  } catch (error) {
    throw new Error('Failed to get popular links');
  }
};

// Create indexes for performance optimization
linkSchema.index({ userId: 1, createdAt: -1 });
linkSchema.index({ userId: 1, isFavorite: -1 });
linkSchema.index({ userId: 1, category: 1 });
linkSchema.index({ userId: 1, 'studyProgress.status': 1 });
linkSchema.index({ userId: 1, clickCount: -1 });
linkSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Export the Link model
export default mongoose.model('Link', linkSchema);