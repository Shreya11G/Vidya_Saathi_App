import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme Context
 * Manages application theme (Dark, Light, Pink-Blue modes)
 * Persists theme preference in localStorage
 */

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'light'
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('vidyasathi-theme');
    return savedTheme || 'light';
  });

  /**
   * Apply theme to document and CSS variables
   */
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    const body = document.body;

    body.classList.remove('light', 'dark', 'pink-blue');
    body.classList.add(newTheme);

    switch (newTheme) {
      case 'light':
        root.style.setProperty('--primary-color', '#3B82F6');
        root.style.setProperty('--secondary-color', '#8B5CF6');
        root.style.setProperty('--accent-color', '#EC4899');
        root.style.setProperty('--success-color', '#10B981');
        root.style.setProperty('--warning-color', '#F59E0B');
        root.style.setProperty('--error-color', '#EF4444');
        root.style.setProperty('--bg-primary', '#FFFFFF');
        root.style.setProperty('--bg-secondary', '#F9FAFB');
        root.style.setProperty('--text-primary', '#1F2937');
        root.style.setProperty('--text-secondary', '#6B7280');
        root.style.setProperty('--border-color', '#E5E7EB');
        root.style.setProperty('--toast-bg', '#FFFFFF');
        root.style.setProperty('--toast-color', '#1F2937');
        root.style.setProperty('--toast-border', '#E5E7EB');
        break;

      case 'dark':
        root.style.setProperty('--primary-color', '#3B82F6');
        root.style.setProperty('--secondary-color', '#8B5CF6');
        root.style.setProperty('--accent-color', '#EC4899');
        root.style.setProperty('--success-color', '#10B981');
        root.style.setProperty('--warning-color', '#F59E0B');
        root.style.setProperty('--error-color', '#EF4444');
        root.style.setProperty('--bg-primary', '#1F2937');
        root.style.setProperty('--bg-secondary', '#111827');
        root.style.setProperty('--text-primary', '#F9FAFB');
        root.style.setProperty('--text-secondary', '#D1D5DB');
        root.style.setProperty('--border-color', '#374151');
        root.style.setProperty('--toast-bg', '#1F2937');
        root.style.setProperty('--toast-color', '#F9FAFB');
        root.style.setProperty('--toast-border', '#374151');
        break;

      case 'pink-blue':
        root.style.setProperty('--primary-color', '#EC4899');
        root.style.setProperty('--secondary-color', '#3B82F6');
        root.style.setProperty('--accent-color', '#8B5CF6');
        root.style.setProperty('--success-color', '#10B981');
        root.style.setProperty('--warning-color', '#F59E0B');
        root.style.setProperty('--error-color', '#EF4444');
        root.style.setProperty('--bg-primary', '#FDF2F8');
        root.style.setProperty('--bg-secondary', '#FCE7F3');
        root.style.setProperty('--text-primary', '#1F2937');
        root.style.setProperty('--text-secondary', '#6B7280');
        root.style.setProperty('--border-color', '#F9A8D4');
        root.style.setProperty('--toast-bg', '#FDF2F8');
        root.style.setProperty('--toast-color', '#1F2937');
        root.style.setProperty('--toast-border', '#F9A8D4');
        break;
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('vidyasathi-theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const themeOrder = ['light', 'dark', 'pink-blue'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
