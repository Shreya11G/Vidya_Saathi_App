import { validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import mongoose from 'mongoose';


/**
 * Task Controller
 * Handles all task-related operations including CRUD, search, and statistics
 * All operations are scoped to the authenticated user
 */

/**
 * Get All Tasks for User
 * Retrieves tasks with optional filtering and pagination
 */
export const getTasks = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      completed,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query object
    const query = { userId: req.user._id };
    
    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (completed !== undefined) query.completed = completed === 'true';
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const [tasks, totalTasks] = await Promise.all([
      Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalTasks / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks'
    });
  }
};

/**
 * Get Single Task
 * Retrieves a specific task by ID
 */
export const getTask = async (req, res) => {
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
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { task }
    });
    
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task'
    });
  }
};

/**
 * Create New Task
 * Creates a new task for the authenticated user
 */
export const createTask = async (req, res) => {
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
      description,
      category,
      priority,
      dueDate,
      estimatedDuration,
      tags,
      subtasks
    } = req.body;
    
    // Create new task
    const task = new Task({
      userId: req.user._id,
      title: title.trim(),
      description: description?.trim(),
      category: category || 'academic',
      priority: priority || 'medium',
      dueDate,
      estimatedDuration,
      tags: tags || [],
      subtasks: subtasks || []
    });
    
    await task.save();
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
};

/**
 * Update Task
 * Updates an existing task with new information
 */
export const updateTask = async (req, res) => {
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
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Update task fields
    const allowedUpdates = [
      'title', 'description', 'category', 'priority', 'status',
      'dueDate', 'estimatedDuration', 'actualDuration', 'tags',
      'subtasks', 'completed'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'title' || field === 'description') {
          task[field] = req.body[field]?.trim();
        } else {
          task[field] = req.body[field];
        }
      }
    });
    
    await task.save();
    
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
    
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
};

/**
 * Toggle Task Completion
 * Toggles the completion status of a task and updates user streak
 */
export const toggleTaskCompletion = async (req, res) => {
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
    
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Toggle completion status
    task.toggleCompletion();
    await task.save();
    
    // Update user task completion streak if task was completed
    if (task.completed) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.updateTaskCompletion();
        await user.save({ validateBeforeSave: false });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Task ${task.completed ? 'completed' : 'uncompleted'} successfully`,
      data: { task }
    });
    
  } catch (error) {
    console.error('Toggle task completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle task completion'
    });
  }
};

/**
 * Delete Task
 * Permanently deletes a task
 */
export const deleteTask = async (req, res) => {
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
    
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
};

/**
 * Get Task Statistics
 * Returns comprehensive task statistics for the user
 */
export const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.getUserStats(req.user._id);
    
    // Get additional statistics
    const [dueTodayTasks, overdueTasks, recentTasks] = await Promise.all([
      Task.countDocuments({
        userId: req.user._id,
        dueDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        },
        completed: false
      }),
      Task.countDocuments({
        userId: req.user._id,
        dueDate: { $lt: new Date() },
        completed: false
      }),
      Task.find({
        userId: req.user._id
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt')
        .lean()
    ]);
    
    // Calculate completion rate
    const completionRate = stats.totalTasks > 0 
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;
    
    // Get category breakdown
    const categoryStats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          ...stats,
          completionRate,
          dueTodayTasks,
          overdueTasks
        },
        categoryBreakdown: categoryStats.reduce((acc, cat) => {
          acc[cat._id] = {
            total: cat.total,
            completed: cat.completed,
            completionRate: Math.round((cat.completed / cat.total) * 100)
          };
          return acc;
        }, {}),
        recentTasks
      }
    });
    
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task statistics'
    });
  }
};

/**
 * Search Tasks
 * Performs text search across task titles and descriptions
 */
export const searchTasks = async (req, res) => {
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
    
    const { q, category, status, priority, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Build search query
    const query = {
      userId: req.user._id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    };
    
    // Add filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const tasks = await Task.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.status(200).json({
      success: true,
      data: {
        tasks,
        query: q,
        resultsCount: tasks.length
      }
    });
    
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tasks'
    });
  }
};