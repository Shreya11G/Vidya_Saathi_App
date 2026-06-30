import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/api';
import toast from 'react-hot-toast';

//  Authentication Context
//  Manages user authentication state and provides auth-related functions
//  Uses HTTP-only cookies for secure token storage

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
  const [otpEnabled, setOtpEnabled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [sessionRes, configRes] = await Promise.all([
          api.get('/auth/session'),
          api.get('/auth/config'),
        ]);
        if (sessionRes.data.authenticated && sessionRes.data.user) {
          setUser(sessionRes.data.user);
        }
        if (configRes.data.success) {
          setOtpEnabled(configRes.data.otpEnabled);
        }
      } catch {
        // Server unreachable — treat as logged out
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  //  Login function
  
  const login = async (email, password, otp) => {
    try {
      const payload = { email, password };
      if (otpEnabled && otp) payload.otp = otp;
      const response = await api.post('/auth/login', payload);
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

  
  //  Register function
   
  const register = async (userData) => {
    try {
      const payload = { ...userData };
      if (!otpEnabled) delete payload.otp;
      const response = await api.post('/auth/register', payload);
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

 
  //  Logout function

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully.');
    } catch (error) {
      setUser(null);
      console.error('Logout error:', error);
    }
  };

  
    // Update Profile function
   
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
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

  
  //  Refresh User function
   
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    loading,
    otpEnabled,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
