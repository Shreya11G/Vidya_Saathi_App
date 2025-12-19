import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout Component
 * Provides the main application layout with sidebar and header
 * Handles responsive sidebar behavior and page structure
 */

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  /**
   * Get page title based on current route
   */
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/tasks':
        return 'Tasks';
      case '/notes':
        return 'Notes';
      case '/pomodoro':
        return 'Pomodoro Timer';
      case '/ai-tutor':
        return 'AI Tutor';
      case '/career':
        return 'Career Consultant';
      case '/streaks':
        return 'Streaks & Progress';
      case '/links':
        return 'Important Links';
      case '/memory-game':
        return 'Memory Game';
      case '/profile':
        return 'Profile';
      default:
        return 'VidyaSathi';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <Header
          title={getPageTitle()}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
