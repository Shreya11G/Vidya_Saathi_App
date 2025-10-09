import { validationResult } from 'express-validator';
import Link from '../models/Link.js';

/**
 * Link Controller
 * Handles all link-related operations including CRUD, search, and statistics
 * All operations are scoped to the authenticated user
 */

/**
 * Get All Links for User
 * Retrieves links with optional filtering and pagination
 */
export const getLinks = async (req, res) => {
  try {
    const {
      category,
      isFavorite,
      studyStatus,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query object
    const query = { userId: req.user._id };
    
    // Apply filters
    if (category) query.category = category;
    if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
    if (studyStatus) query['studyProgress.status'] = studyStatus;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const [links, totalLinks] = await Promise.all([
      Link.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Link.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalLinks / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    res.status(200).json({
      success: true,
      data: {
        links,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLinks,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve links'
    });
  }
};

/**
 * Get Single Link
 * Retrieves a specific link by ID
 */
export const getLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { link }
    });
    
  } catch (error) {
    console.error('Get link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve link'
    });
  }
};

/**
 * Create New Link
 * Creates a new link for the authenticated user
 */
export const createLink = async (req, res) => {
  try {
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
      url,
      description,
      category,
      subject,
      tags,
      priority
    } = req.body;
    
    // Create new link
    const link = new Link({
      userId: req.user._id,
      title: title.trim(),
      url: url.trim(),
      description: description?.trim(),
      category: category || 'study_material',
      subject: subject?.trim(),
      tags: tags || [],
      priority: priority || 'medium'
    });
    
    await link.save();
    
    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      data: { link }
    });
    
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create link'
    });
  }
};

/**
 * Update Link
 * Updates an existing link with new information
 */
export const updateLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    // Update link fields
    const allowedUpdates = [
      'title', 'url', 'description', 'category', 'subject',
      'tags', 'priority', 'studyProgress'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['title', 'url', 'description', 'subject'].includes(field)) {
          link[field] = req.body[field]?.trim();
        } else {
          link[field] = req.body[field];
        }
      }
    });
    
    await link.save();
    
    res.status(200).json({
      success: true,
      message: 'Link updated successfully',
      data: { link }
    });
    
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update link'
    });
  }
};

/**
 * Record Link Click
 * Increments click count and updates last visited timestamp
 */
export const recordClick = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    // Record click
    link.recordClick();
    await link.save();
    
    res.status(200).json({
      success: true,
      message: 'Click recorded successfully',
      data: { 
        clickCount: link.clickCount,
        lastVisited: link.lastVisited
      }
    });
    
  } catch (error) {
    console.error('Record click error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record click'
    });
  }
};

/**
 * Toggle Link Favorite Status
 * Toggles the favorite status of a link
 */
export const toggleFavorite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const link = await Link.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    // Toggle favorite status
    link.toggleFavorite();
    await link.save();
    
    res.status(200).json({
      success: true,
      message: `Link ${link.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { link }
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
 * Delete Link
 * Permanently deletes a link
 */
export const deleteLink = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const link = await Link.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Link deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete link'
    });
  }
};

/**
 * Search Links
 * Performs text search across link titles, descriptions, and tags
 */
export const searchLinks = async (req, res) => {
  try {
    const { q, category, isFavorite, studyStatus, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Build search options
    const options = { limit: parseInt(limit) };
    if (category) options.category = category;
    if (isFavorite !== undefined) options.isFavorite = isFavorite === 'true';
    if (studyStatus) options.studyStatus = studyStatus;
    
    const links = await Link.searchUserLinks(req.user._id, q, options);
    
    res.status(200).json({
      success: true,
      data: {
        links,
        query: q,
        resultsCount: links.length
      }
    });
    
  } catch (error) {
    console.error('Search links error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search links'
    });
  }
};

/**
 * Get Link Statistics
 * Returns comprehensive link statistics for the user
 */
export const getLinkStats = async (req, res) => {
  try {
    const stats = await Link.getUserStats(req.user._id);
    
    // Get additional statistics
    const [recentLinks, popularLinks] = await Promise.all([
      Link.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title url createdAt')
        .lean(),
      
      Link.getPopularLinks(req.user._id, 5)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats,
        recentLinks,
        popularLinks
      }
    });
    
  } catch (error) {
    console.error('Get link stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve link statistics'
    });
  }
};