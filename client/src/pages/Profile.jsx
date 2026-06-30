import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Lock,
  Palette,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Settings,
  GraduationCap,
  Target,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import api from "../api/api";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import OtpVerification from "../components/OtpVerification";
import UserAvatar from "../components/UserAvatar";

const Profile = () => {
  const { user, updateProfile, logout, otpEnabled, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("personal");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    academicLevel: "undergraduate",
    interests: [],
    subjects: [],
    careerGoals: "",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [otpResetData, setOtpResetData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resettingViaOtp, setResettingViaOtp] = useState(false);

  const [preferencesData, setPreferencesData] = useState({
    theme: "light",
    pomodoroSettings: {
      workDuration: 25,
      breakDuration: 5,
    },
    notifications: {
      emailNotifications: true,
      taskReminders: true,
      streakReminders: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const academicLevels = [
    { value: "high_school", label: "High School" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "graduate", label: "Graduate" },
    { value: "other", label: "Other" },
  ];

  const interestOptions = [
    "Technology",
    "Healthcare",
    "Education",
    "Finance",
    "Arts & Design",
    "Business",
    "Science",
    "Engineering",
    "Marketing",
    "Law",
    "Media",
    "Sports",
    "Environment",
    "Social Work",
    "Research",
    "Programming",
    "Writing",
    "Music",
    "Photography",
    "Travel",
  ];

  const subjectOptions = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Engineering",
    "Business",
    "Economics",
    "Psychology",
    "History",
    "Literature",
    "Art",
    "Music",
    "Philosophy",
    "Medicine",
    "Law",
    "Political Science",
    "Sociology",
    "Geography",
    "Statistics",
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        academicLevel: user.profile?.academicLevel || "undergraduate",
        interests: user.profile?.interests || [],
        subjects: user.profile?.subjects || [],
        careerGoals: user.profile?.careerGoals || "",
      });

      setPreferencesData({
        theme: user.preferences?.theme || "light",
        pomodoroSettings: {
          workDuration: user.preferences?.pomodoroSettings?.workDuration || 25,
          breakDuration: user.preferences?.pomodoroSettings?.breakDuration || 5,
        },
        notifications: {
          emailNotifications:
            user.preferences?.notifications?.emailNotifications ?? true,
          taskReminders:
            user.preferences?.notifications?.taskReminders ?? true,
          streakReminders:
            user.preferences?.notifications?.streakReminders ?? true,
        },
      });

      setLoading(false);
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setPreferencesData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]:
            type === "checkbox"
              ? checked
              : type === "number"
                ? parseInt(value)
                : value,
        },
      }));
    } else {
      setPreferencesData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleMultiSelectChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
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
          careerGoals: profileData.careerGoals.trim(),
        },
      };
      await updateProfile(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
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
          pomodoroSettings: preferencesData.pomodoroSettings,
          notifications: preferencesData.notifications,
        },
      };
      await updateProfile(updateData);
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!securityData.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!securityData.newPassword) {
      toast.error("New password is required");
      return;
    }
    if (securityData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await api.put("/auth/change-password", {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        confirmPassword: securityData.confirmPassword,
      });
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOtpPasswordReset = async (e) => {
    e.preventDefault();

    if (otpEnabled && (!otpResetData.otp || otpResetData.otp.length !== 6)) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    if (!otpResetData.newPassword || otpResetData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(otpResetData.newPassword)) {
      toast.error("Password must include uppercase, lowercase, and a number");
      return;
    }
    if (otpResetData.newPassword !== otpResetData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setResettingViaOtp(true);
      await api.post("/auth/reset-password-authenticated", {
        otp: otpEnabled ? otpResetData.otp : undefined,
        newPassword: otpResetData.newPassword,
        confirmPassword: otpResetData.confirmPassword,
      });
      setOtpResetData({ otp: "", newPassword: "", confirmPassword: "" });
      toast.success("Password reset successfully via email OTP");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingViaOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt("Enter your password to confirm account deletion:");
    if (!password) return;
    if (
      !window.confirm("Are you absolutely sure? This action cannot be undone.")
    )
      return;
    try {
      await api.delete("/auth/account", { data: { password } });
      toast.success("Account deleted successfully");
      await logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account");
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.post('/auth/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        await refreshUser();
        toast.success('Profile photo updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.profilePhoto) return;
    if (!window.confirm('Remove your profile photo?')) return;

    setUploadingPhoto(true);
    try {
      const response = await api.delete('/auth/profile-photo');
      if (response.data.success) {
        await refreshUser();
        toast.success('Profile photo removed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "data", label: "Profile Data", icon: Target },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Profile Settings
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Avatar */}
        <div className="relative self-start sm:self-auto">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
          />
          <UserAvatar user={user} size="md" />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            title="Change profile photo"
          >
            {uploadingPhoto ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative self-start">
            <UserAvatar user={user} size="lg" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {user?.name}
            </h2>
            <p className="text-[var(--text-secondary)]">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-50"
              >
                Change photo
              </button>
              {user?.profilePhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Remove photo
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-900/20 text-blue-600">
                <GraduationCap className="w-3 h-3 mr-1" />
                {academicLevels.find(
                  (level) => level.value === user?.profile?.academicLevel,
                )?.label || "Student"}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-900/20 text-green-600">
                🔥 {user?.streaks?.currentStreak || 0} day streak
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-900/20 text-purple-600">
                ✅ {user?.streaks?.totalTasksCompleted || 0} tasks completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        <div className="border-b border-[var(--border-color)]">
          <nav className="flex overflow-x-auto scrollbar-hide gap-1 sm:gap-0 sm:space-x-6 px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 sm:py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 px-2 sm:px-0 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Personal Information
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Update your basic account information
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={profileData.email}
                      className="w-full pl-10 pr-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] cursor-not-allowed"
                      placeholder="Email address"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Email cannot be changed for security reasons
                  </p>
                </div>

                {/* Academic Level */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Academic Level
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      name="academicLevel"
                      value={profileData.academicLevel}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    >
                      {academicLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Member Since
                  </label>
                  <div className="py-3 px-4 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-color)]">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
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
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Security Settings
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Manage your password and account security
                </p>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h4 className="font-medium text-[var(--text-primary)]">
                  Change Password
                </h4>

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={securityData.currentPassword}
                      onChange={handleSecurityChange}
                      className="w-full pl-10 pr-10 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-seondary)]"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={securityData.newPassword}
                      onChange={handleSecurityChange}
                      className="w-full pl-10 pr-10 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={securityData.confirmPassword}
                      onChange={handleSecurityChange}
                      className="w-full pl-10 pr-10 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
                  <span>
                    {changingPassword ? "Changing..." : "Change Password"}
                  </span>
                </button>
              </form>

              {otpEnabled && (
              <div className="pt-6 border-t border-[var(--border-color)]">
                <form onSubmit={handleOtpPasswordReset} className="space-y-4">
                  <h4 className="font-medium text-[var(--text-primary)]">
                    Reset Password via Email OTP
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Forgot your current password? We&apos;ll send a verification code to{" "}
                    <strong>{user?.email}</strong>
                  </p>

                  <OtpVerification
                    email={user?.email}
                    purpose="reset_password"
                    otp={otpResetData.otp}
                    onOtpChange={(val) =>
                      setOtpResetData((prev) => ({ ...prev, otp: val }))
                    }
                    disabled={resettingViaOtp}
                    useAuthenticatedEndpoint
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={otpResetData.newPassword}
                      onChange={(e) =>
                        setOtpResetData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      placeholder="Enter new password"
                      disabled={resettingViaOtp}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={otpResetData.confirmPassword}
                      onChange={(e) =>
                        setOtpResetData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                      placeholder="Confirm new password"
                      disabled={resettingViaOtp}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resettingViaOtp}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {resettingViaOtp ? (
                      <LoadingSpinner size="small" color="white" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>
                      {resettingViaOtp ? "Resetting..." : "Reset via OTP"}
                    </span>
                  </button>
                </form>
              </div>
              )}

              {/* Danger Zone */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="font-medium text-red-600 mb-4">
                  Danger Zone
                </h4>
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium text-red-600">
                        Delete Account
                      </h5>
                      <p className="text-sm text-red-500 mt-1">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
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
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  App Preferences
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  Customize your VidyaSathi experience
                </p>
              </div>

              {/* Theme Settings */}
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-4 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  Theme Preference
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      value: "light",
                      label: "Light Mode",
                      description: "Clean and bright interface",
                    },
                    {
                      value: "dark",
                      label: "Dark Mode",
                      description: "Easy on the eyes",
                    },
                    {
                      value: "pink-blue",
                      label: "Pink-Blue Mode",
                      description: "Aesthetic gradient theme",
                    },
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() =>
                        setPreferencesData((prev) => ({
                          ...prev,
                          theme: themeOption.value,
                        }))
                      }
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        preferencesData.theme === themeOption.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-medium text-[var(--text-primary)]">
                        {themeOption.label}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] mt-1">
                        {themeOption.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pomodoro Settings */}
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-4">
                  Pomodoro Timer Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Work Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="pomodoroSettings.workDuration"
                      value={preferencesData.pomodoroSettings.workDuration}
                      onChange={handlePreferencesChange}
                      min="1"
                      max="60"
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="pomodoroSettings.breakDuration"
                      value={preferencesData.pomodoroSettings.breakDuration}
                      onChange={handlePreferencesChange}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-4 flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Preferences
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  Emails are sent on schedule when SMTP is configured. Without SMTP, check the server terminal in dev mode.
                </p>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="notifications.emailNotifications"
                      checked={preferencesData.notifications.emailNotifications}
                      onChange={handlePreferencesChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-[var(--text-secondary)]">
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
                    <span className="ml-3 text-sm text-[var(--text-secondary)]">
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
                    <span className="ml-3 text-sm text-[var(--text-secondary)]">
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
                  <span>{saving ? "Saving..." : "Save Preferences"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Data Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-[var(--border-color)] rounded-lg p-3">
                  {interestOptions.map((interest) => (
                    <label
                      key={interest}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={profileData.interests.includes(interest)}
                        onChange={() =>
                          handleMultiSelectChange("interests", interest)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-[var(--text-primary)]">
                        {interest}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                  Academic Subjects
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-[var(--border-color)] rounded-lg p-3">
                  {subjectOptions.map((subject) => (
                    <label
                      key={subject}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={profileData.subjects.includes(subject)}
                        onChange={() =>
                          handleMultiSelectChange("subjects", subject)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-[var(--text-primary)]">
                        {subject}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Career Goals */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Career Goals
                </label>
                <textarea
                  name="careerGoals"
                  value={profileData.careerGoals}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  placeholder="Describe your career aspirations and goals..."
                />
              </div>

              {/* Save Profile Data Button */}
              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
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
                  <span>{saving ? "Saving..." : "Save Profile Data"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Account Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {user?.streaks?.currentStreak || 0}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Current Streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {user?.streaks?.totalTasksCompleted || 0}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Tasks Completed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {user?.streaks?.longestStreak || 0}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Best Streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {user?.profile?.interests?.length || 0}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Interests
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
