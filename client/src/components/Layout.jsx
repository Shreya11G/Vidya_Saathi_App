import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/notes': 'Notes',
  '/pomodoro': 'Pomodoro Timer',
  '/ai-tutor': 'AI Tutor',
  '/career': 'Career Consultant',
  '/streaks': 'Streaks & Progress',
  '/links': 'Important Links',
  '/documents': 'My Documents',
  '/memory-game': 'Memory Game',
  '/paragraph-writer': 'Paragraph Writer',
  '/quiz/upload': 'AI Quiz',
  '/profile': 'Profile',
  '/quiz/setup': 'Quiz Setup',
  '/quiz/take': 'Take Quiz',
  '/quiz/result': 'Quiz Results',
  '/quiz/history': 'Quiz History',
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const location = useLocation();

  const getPageTitle = () => PAGE_TITLES[location.pathname] || 'VidyaSaathi';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-[margin] duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : ''
        }`}
      >
        <Header
          title={getPageTitle()}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
