import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

/**
 * Authentication Controller
 * Handles user registration, login, logout, and profile management
 * All authentication uses JWT stored in HTTP-only cookies for security
 */

/**
 * Generate JWT Token and Set Cookie
 * Creates a JWT token and sets it as an HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {string} userId - User ID to include in token
 * @returns {string} - Generated JWT token
 */
const generateTokenAndSetCookie = (res, userId) => {
  // Generate JWT token with user ID
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
  
  // Set HTTP-only cookie with security options
  res.cookie('token', token, {
    httpOnly: true, // Prevents client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/' // Available on all paths
  });
  
  return token;
};

/**
 * Register New User
 * Creates a new user account with email and password
 * Validates input and checks for existing users
 */
export const register = async (req, res) => {
  try {
    // Check validation results from express-validator middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { name, email, password, academicLevel, subjects, interests } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user with profile information
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save middleware
      profile: {
        academicLevel: academicLevel || 'undergraduate',
        subjects: subjects || [],
        interests: interests || []
      }
    });
    
    // Save user to database
    await user.save();
    
    // Generate token and set cookie
    generateTokenAndSetCookie(res, user._id);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error'
    });
  }
};

/**
 * Login User
 * Authenticates user with email and password
 * Updates login streak and sets authentication cookie
 */
export const login = async (req, res) => {
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
    
    const { email, password } = req.body;
    
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update login streak
    user.updateLoginStreak();
    await user.save({ validateBeforeSave: false });
    
    // Generate token and set cookie
    generateTokenAndSetCookie(res, user._id);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed due to server error'
    });
  }
};

/**
 * Logout User
 * Clears authentication cookie and logs out user
 */
export const logout = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Get Current User Profile
 * Returns the authenticated user's profile information
 */
export const getProfile = async (req, res) => {
  try {
    // req.user is set by authentication middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Update User Profile
 * Updates user profile information (excluding sensitive fields)
 */
export const updateProfile = async (req, res) => {
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
    
    const { name, profile, preferences } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update allowed fields
    if (name) user.name = name.trim();
    if (profile) {
      if (profile.interests) user.profile.interests = profile.interests;
      if (profile.academicLevel) user.profile.academicLevel = profile.academicLevel;
      if (profile.subjects) user.profile.subjects = profile.subjects;
      if (profile.careerGoals) user.profile.careerGoals = profile.careerGoals;
    }
    if (preferences) {
      if (preferences.theme) user.preferences.theme = preferences.theme;
      if (preferences.pomodoroSettings) {
        if (preferences.pomodoroSettings.workDuration) {
          user.preferences.pomodoroSettings.workDuration = preferences.pomodoroSettings.workDuration;
        }
        if (preferences.pomodoroSettings.breakDuration) {
          user.preferences.pomodoroSettings.breakDuration = preferences.pomodoroSettings.breakDuration;
        }
      }
    }
    
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change Password
 * Allows user to change their password with current password verification
 */
export const changePassword = async (req, res) => {
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
    
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Delete User Account
 * Permanently deletes user account and all associated data
 */
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify password before deletion
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password verification failed'
      });
    }
    
    // Delete user account
    await User.findByIdAndDelete(req.user._id);
    
    // Clear authentication cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

/**
 * Check Authentication Status
 * Verifies if user is authenticated without returning user data
 */
export const checkAuth = async (req, res) => {
  try {
    // If middleware passed, user is authenticated
    res.status(200).json({
      success: true,
      authenticated: true,
      message: 'User is authenticated'
    });
  } catch (error) {
    console.error('Check auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication check failed'
    });
  }
};