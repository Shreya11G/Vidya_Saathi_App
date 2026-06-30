import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/emailService.js';
import {
  createAndStoreOtp,
  verifyOtpCode,
  normalizeEmail,
  canonicalEmail,
  findUserByEmail,
  isValidEmail,
} from '../utils/otpService.js';
import { isOtpEnabled } from '../utils/otpConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATARS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');

const getAvatarFilePath = (storedPath) => path.join(AVATARS_DIR, storedPath);

const removeAvatarFile = async (storedPath) => {
  if (!storedPath) return;
  await fs.unlink(getAvatarFilePath(storedPath)).catch(() => {});
};


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

export const getAuthConfig = (req, res) => {
  res.status(200).json({
    success: true,
    otpEnabled: isOtpEnabled(),
  });
};

// Send OTP to email for register, login, or password reset
export const sendOtp = async (req, res) => {
  try {
    if (!isOtpEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification is currently disabled',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, purpose } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    let user = null;
    let deliveryEmail = normalizedEmail;

    if (purpose === 'register') {
      user = await User.findOne({ email: canonicalEmail(normalizedEmail) });
      if (user) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }
      deliveryEmail = canonicalEmail(normalizedEmail);
    } else if (purpose === 'login' || purpose === 'reset_password') {
      user = await findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'No account found with this email address',
        });
      }
      if (!user.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
      }
      deliveryEmail = user.email;
    }

    if (purpose === 'reset_password' && req.user) {
      if (canonicalEmail(normalizedEmail) !== canonicalEmail(req.user.email)) {
        return res.status(400).json({
          success: false,
          message: 'OTP can only be sent to your registered email',
        });
      }
    }

    const otp = await createAndStoreOtp(deliveryEmail, purpose);
    const result = await sendOtpEmail(deliveryEmail, otp, purpose);

    console.log(`📧 OTP [${purpose}] sent to ${deliveryEmail} (requested: ${normalizedEmail})`);

    res.status(200).json({
      success: true,
      message: result.devMode
        ? 'OTP generated (check server console in dev mode)'
        : 'OTP sent to your email successfully',
      devMode: result.devMode || false,
      sentTo: deliveryEmail,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to send OTP. Please try again later.',
    });
  }
};

// Reset password using email OTP
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, otp, newPassword } = req.body;
    const normalizedEmail = req.user
      ? req.user.email
      : normalizeEmail(email);

    if (isOtpEnabled()) {
      const otpResult = await verifyOtpCode(normalizedEmail, 'reset_password', otp);
      if (!otpResult.valid) {
        return res.status(400).json({
          success: false,
          message: otpResult.message,
        });
      }
    }

    const user = req.user || (await findUserByEmail(normalizedEmail));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.password = newPassword;
    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

//  Register New User
//   Creates a new user account with email and password
//   Validates input and checks for existing users
 
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
    
    const { name, email, password, academicLevel, subjects, interests, otp } = req.body;
    const normalizedEmail = canonicalEmail(email);

    if (isOtpEnabled()) {
      const otpResult = await verifyOtpCode(normalizedEmail, 'register', otp);
      if (!otpResult.valid) {
        return res.status(400).json({
          success: false,
          message: otpResult.message,
        });
      }
    }
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user with profile information
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      isEmailVerified: true,
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

//  Login User
//   Authenticates user with email and password
//   Updates login streak and sets authentication cookie
 
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
    
    const { email, password, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (isOtpEnabled()) {
      const otpResult = await verifyOtpCode(normalizedEmail, 'login', otp);
      if (!otpResult.valid) {
        return res.status(400).json({
          success: false,
          message: otpResult.message,
        });
      }
    }
    
    // Find user by email (include password for comparison)
    const user = await findUserByEmail(email);
    
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
    user.isEmailVerified = true;
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


  //Logout User
  //Clears authentication cookie and logs out user

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

// Get Current User Profile
  //Returns the authenticated user's profile information
 
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

    user.validateCurrentStreak();
    await user.save({ validateBeforeSave: false });
    
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


//  Update User Profile
//  Updates user profile information (excluding sensitive fields)
 
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
      if (preferences.notifications) {
        user.preferences.notifications = user.preferences.notifications || {};
        if (typeof preferences.notifications.emailNotifications === 'boolean') {
          user.preferences.notifications.emailNotifications = preferences.notifications.emailNotifications;
        }
        if (typeof preferences.notifications.taskReminders === 'boolean') {
          user.preferences.notifications.taskReminders = preferences.notifications.taskReminders;
        }
        if (typeof preferences.notifications.streakReminders === 'boolean') {
          user.preferences.notifications.streakReminders = preferences.notifications.streakReminders;
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

// Change Password
//  Allows user to change their password with current password verification
 
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

// Delete User Account
 //Permanently deletes user account and all associated data
 
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
    await removeAvatarFile(user.profilePhoto);
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


 // Check Authentication Status
 // Verifies if user is authenticated without returning user data
 
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

// Returns session status without 401 for guests (used on app load)
export const getSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        authenticated: false,
      });
    }

    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      authenticated: true,
      user: userResponse,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Session check failed',
    });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profilePhoto) {
      await removeAvatarFile(user.profilePhoto);
    }

    const relativePath = path.join(req.user._id.toString(), req.file.filename);
    user.profilePhoto = relativePath;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      user: userResponse,
    });
  } catch (error) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    console.error('Upload profile photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile photo' });
  }
};

export const getProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('profilePhoto');
    if (!user?.profilePhoto) {
      return res.status(404).json({ success: false, message: 'No profile photo' });
    }

    const filePath = getAvatarFilePath(user.profilePhoto);
    await fs.access(filePath);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Get profile photo error:', error);
    res.status(404).json({ success: false, message: 'Profile photo not found' });
  }
};

export const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profilePhoto) {
      await removeAvatarFile(user.profilePhoto);
      user.profilePhoto = null;
      await user.save();
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile photo removed',
      user: userResponse,
    });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove profile photo' });
  }
};