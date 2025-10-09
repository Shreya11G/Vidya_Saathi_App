import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  StickyNote,
  Timer,
  Bot,
  Briefcase,
  TrendingUp,
  Link,
  Gamepad2,
  FileText,
  HelpCircle,
  User,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Sidebar Component
 * Navigation sidebar with links to all application features
 * Responsive design with mobile overlay support
 */

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  /**
   * Navigation items configuration
   * Each item includes icon, label, and route path
   */
  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/',
      description: 'Overview & quick access'
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      path: '/tasks',
      description: 'Todo manager'
    },
    {
      icon: StickyNote,
      label: 'Notes',
      path: '/notes',
      description: 'Sticky notes keeper'
    },
    {
      icon: Timer,
      label: 'Pomodoro',
      path: '/pomodoro',
      description: 'Focus timer'
    },
    {
      icon: Bot,
      label: 'AI Tutor',
      path: '/ai-tutor',
      description: 'Study assistant'
    },
    {
      icon: Briefcase,
      label: 'Career',
      path: '/career',
      description: 'Career guidance'
    },
    {
      icon: TrendingUp,
      label: 'Streaks',
      path: '/streaks',
      description: 'Progress tracking'
    },
    {
      icon: Link,
      label: 'Links',
      path: '/links',
      description: 'Important resources'
    },
    {
      icon: FileText,
      label: 'Paragraph Writer',
      path: '/paragraph-writer',
      description: 'Text analysis tool'
    },
    {
      icon: HelpCircle,
      label: 'Quiz Time',
      path: '/quiz-time',
      description: 'Document-based quizzes'
    },
    {
      icon: Gamepad2,
      label: 'Memory Game',
      path: '/memory-game',
      description: 'Brain training'
    }
  ];

  /**
   * Handle logout with confirmation
   */
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                VidyaSathi
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your Study Companion
              </p>
            </div>
          </div>

          {/* Close Button (Mobile) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 text-center">
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {user.streaks?.currentStreak || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Day Streak
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 text-center">
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {user.streaks?.totalTasksCompleted || 0}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Tasks Done
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Profile Link */}
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Profile Settings</span>
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
