import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Verifies JWT tokens from HTTP-only cookies and attaches user to request
 * Provides different levels of authentication checking
 */

/**
 * Primary authentication middleware
 * Verifies JWT token from cookies and attaches user to req.user
 * Returns 401 if token is invalid or user not found
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from HTTP-only cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Clear invalid token cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please login again.'
      });
    }
    
    // Find user by ID from token payload
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      // Clear token cookie if user doesn't exist
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }
    
    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Attach user to request object for use in route handlers
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error.'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't return error if no token
 * Used for routes that can work with or without authentication
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
        // Clear invalid token
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
    } catch (jwtError) {
      // Invalid token, continue without user
      req.user = null;
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role
 * Must be used after authenticate middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this action.'
      });
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Admin-only authorization middleware
 * Convenience middleware for admin-only routes
 */
export const adminOnly = authorize('admin');

/**
 * Student authorization middleware
 * Allows both students and admins (admins have all student permissions)
 */
export const studentAccess = authorize('student', 'admin');

/**
 * User ownership verification middleware factory
 * Verifies that the authenticated user owns the requested resource
 * Expects resource user ID to be available in req.params or req.body
 */
export const verifyOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Get resource user ID from params or body
    const resourceUserId = req.params[userIdField] || 
                          req.body[userIdField] || 
                          req.params.userId ||
                          req.body.userId;
    
    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check ownership
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

/**
 * Rate limiting middleware for authentication attempts
 * Prevents brute force attacks on login/register endpoints
 */
export const authRateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }
    
    // Check current IP attempts
    const ipAttempts = attempts.get(ip);
    
    if (!ipAttempts) {
      // First attempt from this IP
      attempts.set(ip, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (now - ipAttempts.firstAttempt > windowMs) {
      // Window expired, reset counter
      attempts.set(ip, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (ipAttempts.count >= max) {
      // Too many attempts
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Please try again in ${Math.ceil(windowMs / 60000)} minutes.`
      });
    }
    
    // Increment attempt counter
    ipAttempts.count += 1;
    next();
  };
};

/**
 * Middleware to update user login streak
 * Should be used after successful authentication
 */
export const updateLoginStreak = async (req, res, next) => {
  try {
    if (req.user) {
      // Update login streak
      req.user.updateLoginStreak();
      await req.user.save({ validateBeforeSave: false });
    }
    next();
  } catch (error) {
    console.error('Error updating login streak:', error);
    // Don't fail the request if streak update fails
    next();
  }
};