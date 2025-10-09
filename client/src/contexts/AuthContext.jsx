import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Authentication Context
 * Manages user authentication state and provides auth-related functions
 * Uses HTTP-only cookies for secure token storage
 */

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true; // Include cookies in requests

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if user is authenticated on app load
   * Attempts to get user profile using existing HTTP-only cookie
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/auth/profile');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log('User not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login function
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Login successful! Welcome back.');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Register function
   */
  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Registration successful! Welcome to VidyaSathi.');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully.');
    } catch (error) {
      setUser(null);
      console.error('Logout error:', error);
    }
  };

  /**
   * Update Profile function
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/auth/profile', profileData);
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully.');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to update profile.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Refresh User function
   */
  const refreshUser = async () => {
    try {
      const response = await axios.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
