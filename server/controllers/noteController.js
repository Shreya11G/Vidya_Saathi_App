import { validationResult } from 'express-validator';
import Note from '../models/Note.js';

/**
 * Note Controller
 * Handles all note-related operations including CRUD, search, and statistics
 * All operations are scoped to the authenticated user
 */

/**
 * Get All Notes for User
 * Retrieves notes with optional filtering and pagination
 */
export const getNotes = async (req, res) => {
  try {
    const {
      category,
      isPinned,
      isArchived,
      isFavorite,
      page = 1,
      limit = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query object
    const query = { userId: req.user._id };
    
    // Apply filters
    if (category) query.category = category;
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';
    if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // If sorting by pinned status, prioritize pinned notes
    if (sortBy === 'isPinned') {
      sort.isPinned = -1; // Pinned notes first
      sort.updatedAt = -1; // Then by update time
    }
    
    // Execute query with pagination
    const [notes, totalNotes] = await Promise.all([
      Note.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Note.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalNotes / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalNotes,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notes'
    });
  }
};

/**
 * Get Single Note
 * Retrieves a specific note by ID
 */
export const getNote = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { note }
    });
    
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve note'
    });
  }
};

/**
 * Create New Note
 * Creates a new note for the authenticated user
 */
export const createNote = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const {
      title,
      content,
      category,
      color,
      tags,
      position,
      size,
      formatting
    } = req.body;
    
    // Create new note
    const note = new Note({
      userId: req.user._id,
      title: title.trim(),
      content: content.trim(),
      category: category || 'study',
      color: color || 'yellow',
      tags: tags || [],
      position: position || { x: 0, y: 0 },
      size: size || { width: 250, height: 250 },
      formatting: formatting || {}
    });
    
    await note.save();
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note }
    });
    
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note'
    });
  }
};

/**
 * Update Note
 * Updates an existing note with new information
 */
export const updateNote = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Update note fields
    const allowedUpdates = [
      'title', 'content', 'category', 'color', 'tags',
      'position', 'size', 'formatting', 'isPinned',
      'isFavorite', 'isArchived'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'title' || field === 'content') {
          note[field] = req.body[field].trim();
        } else if (field === 'position' || field === 'size' || field === 'formatting') {
          // Merge nested objects
          note[field] = { ...note[field].toObject(), ...req.body[field] };
        } else {
          note[field] = req.body[field];
        }
      }
    });
    
    await note.save();
    
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note }
    });
    
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
};

/**
 * Toggle Note Pin Status
 * Toggles the pinned status of a note
 */
export const togglePin = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Toggle pin status
    note.togglePin();
    await note.save();
    
    res.status(200).json({
      success: true,
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: { note }
    });
    
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle pin status'
    });
  }
};

/**
 * Toggle Note Favorite Status
 * Toggles the favorite status of a note
 */
export const toggleFavorite = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Toggle favorite status
    note.toggleFavorite();
    await note.save();
    
    res.status(200).json({
      success: true,
      message: `Note ${note.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { note }
    });
    
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite status'
    });
  }
};

/**
 * Delete Note
 * Permanently deletes a note
 */
export const deleteNote = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
};

/**
 * Search Notes
 * Performs text search across note titles, content, and tags
 */
export const searchNotes = async (req, res) => {
  try {
    const { q, category, isPinned, isArchived, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Build search options
    const options = { limit: parseInt(limit) };
    if (category) options.category = category;
    if (isPinned !== undefined) options.isPinned = isPinned === 'true';
    if (isArchived !== undefined) options.isArchived = isArchived === 'true';
    
    const notes = await Note.searchUserNotes(req.user._id, q, options);
    
    res.status(200).json({
      success: true,
      data: {
        notes,
        query: q,
        resultsCount: notes.length
      }
    });
    
  } catch (error) {
    console.error('Search notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search notes'
    });
  }
};

/**
 * Get Note Statistics
 * Returns comprehensive note statistics for the user
 */
export const getNoteStats = async (req, res) => {
  try {
    const stats = await Note.getUserStats(req.user._id);
    
    // Get additional statistics
    const [recentNotes, popularTags] = await Promise.all([
      Note.find({ userId: req.user._id, isArchived: false })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title updatedAt')
        .lean(),
      
      Note.aggregate([
        { $match: { userId: req.user._id } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    // Get category breakdown
    const categoryStats = await Note.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats,
        categoryBreakdown: categoryStats.reduce((acc, cat) => {
          acc[cat._id] = cat.count;
          return acc;
        }, {}),
        popularTags: popularTags.map(tag => ({
          name: tag._id,
          count: tag.count
        })),
        recentNotes
      }
    });
    
  } catch (error) {
    console.error('Get note stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve note statistics'
    });
  }
};