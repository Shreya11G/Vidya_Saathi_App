import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Palette, Bell, Shield, Save, Eye, EyeOff, Camera, Trash2, Settings, GraduationCap, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('personal');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    academicLevel: 'undergraduate',
    interests: [],
    subjects: [],
    careerGoals: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferencesData, setPreferencesData] = useState({
    theme: 'light',
    pomodoroSettings: {
      workDuration: 25,
      breakDuration: 5
    },
    notifications: {
      emailNotifications: true,
      taskReminders: true,
      streakReminders: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const academicLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'other', label: 'Other' }
  ];

  const interestOptions = [
    'Technology', 'Healthcare', 'Education', 'Finance', 'Arts & Design',
    'Business', 'Science', 'Engineering', 'Marketing', 'Law',
    'Media', 'Sports', 'Environment', 'Social Work', 'Research',
    'Programming', 'Writing', 'Music', 'Photography', 'Travel'
  ];

  const subjectOptions = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'Engineering', 'Business', 'Economics', 'Psychology', 'History',
    'Literature', 'Art', 'Music', 'Philosophy', 'Medicine', 'Law',
    'Political Science', 'Sociology', 'Geography', 'Statistics'
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        academicLevel: user.profile?.academicLevel || 'undergraduate',
        interests: user.profile?.interests || [],
        subjects: user.profile?.subjects || [],
        careerGoals: user.profile?.careerGoals || ''
      });

      setPreferencesData({
        theme: user.preferences?.theme || 'light',
        pomodoroSettings: {
          workDuration: user.preferences?.pomodoroSettings?.workDuration || 25,
          breakDuration: user.preferences?.pomodoroSettings?.breakDuration || 5
        },
        notifications: {
          emailNotifications: true,
          taskReminders: true,
          streakReminders: true
        }
      });

      setLoading(false);
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPreferencesData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
        }
      }));
    } else {
      setPreferencesData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleMultiSelectChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updateData = {
        name: profileData.name.trim(),
        profile: {
          academicLevel: profileData.academicLevel,
          interests: profileData.interests,
          subjects: profileData.subjects,
          careerGoals: profileData.careerGoals.trim()
        }
      };
      await updateProfile(updateData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setTheme(preferencesData.theme);
      const updateData = {
        preferences: {
          theme: preferencesData.theme,
          pomodoroSettings: preferencesData.pomodoroSettings
        }
      };
      await updateProfile(updateData);
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!securityData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!securityData.newPassword) {
      toast.error('New password is required');
      return;
    }
    if (securityData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await axios.put('/auth/change-password', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        confirmPassword: securityData.confirmPassword
      });
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Enter your password to confirm account deletion:');
    if (!password) return;
    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) return;
    try {
      await axios.delete('/auth/account', { data: { password } });
      toast.success('Account deleted successfully');
      await logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'data', label: 'Profile Data', icon: Target }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>
        
        {/* Profile Avatar */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {getUserInitials()}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors">
            <Camera className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {getUserInitials()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                <GraduationCap className="w-3 h-3 mr-1" />
                {academicLevels.find(level => level.value === user?.profile?.academicLevel)?.label || 'Student'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                🔥 {user?.streaks?.currentStreak || 0} day streak
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">
                ✅ {user?.streaks?.totalTasksCompleted || 0} tasks completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
{tabs.map((tab) => (
  <button
    key={tab.id}
    onClick={() => setActiveTab(tab.id)}
    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
      activeTab === tab.id
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
    }`}
  >
    <tab.icon className="w-4 h-4" />
    <span>{tab.label}</span>
  </button>
))}

          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Update your basic account information
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={profileData.email}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      placeholder="Email address"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email cannot be changed for security reasons
                  </p>
                </div>

                {/* Academic Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Academic Level
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      name="academicLevel"
                      value={profileData.academicLevel}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {academicLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Since
                  </label>
                  <div className="py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Manage your password and account security
                </p>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Change Password</h4>
                
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={securityData.currentPassword}
                      onChange={handleSecurityChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={securityData.newPassword}
                      onChange={handleSecurityChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={securityData.confirmPassword}
                      onChange={handleSecurityChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Change Password Button */}
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {changingPassword ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>{changingPassword ? 'Changing...' : 'Change Password'}</span>
                </button>
              </form>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium text-red-800 dark:text-red-400">
                        Delete Account
                      </h5>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  App Preferences
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Customize your VidyaSathi experience
                </p>
              </div>

              {/* Theme Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  Theme Preference
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light Mode', description: 'Clean and bright interface' },
                    { value: 'dark', label: 'Dark Mode', description: 'Easy on the eyes' },
                    { value: 'pink-blue', label: 'Pink-Blue Mode', description: 'Aesthetic gradient theme' }
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setPreferencesData(prev => ({ ...prev, theme: themeOption.value }))}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        preferencesData.theme === themeOption.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {themeOption.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {themeOption.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pomodoro Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Pomodoro Timer Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Work Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="pomodoroSettings.workDuration"
                      value={preferencesData.pomodoroSettings.workDuration}
                      onChange={handlePreferencesChange}
                      min="1"
                      max="60"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="pomodoroSettings.breakDuration"
                      value={preferencesData.pomodoroSettings.breakDuration}
                      onChange={handlePreferencesChange}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Preferences
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="notifications.emailNotifications"
                      checked={preferencesData.notifications.emailNotifications}
                      onChange={handlePreferencesChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Email notifications for important updates
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="notifications.taskReminders"
                      checked={preferencesData.notifications.taskReminders}
                      onChange={handlePreferencesChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Task deadline reminders
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="notifications.streakReminders"
                      checked={preferencesData.notifications.streakReminders}
                      onChange={handlePreferencesChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Daily streak maintenance reminders
                    </span>
                  </label>
                </div>
              </div>

              {/* Save Preferences Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Academic Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Help us personalize your learning experience
                </p>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Areas of Interest
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {interestOptions.map(interest => (
                    <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.interests.includes(interest)}
                        onChange={() => handleMultiSelectChange('interests', interest)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {interest}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Academic Subjects
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {subjectOptions.map(subject => (
                    <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.subjects.includes(subject)}
                        onChange={() => handleMultiSelectChange('subjects', subject)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {subject}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Career Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Career Goals
                </label>
                <textarea
                  name="careerGoals"
                  value={profileData.careerGoals}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your career aspirations and goals..."
                />
              </div>

              {/* Save Profile Data Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Profile Data'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {user?.streaks?.currentStreak || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Current Streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user?.streaks?.totalTasksCompleted || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tasks Completed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {user?.streaks?.longestStreak || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Best Streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {user?.profile?.interests?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Interests
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
