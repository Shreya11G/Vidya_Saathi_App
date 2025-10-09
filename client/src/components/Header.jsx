import React from 'react';
import { Menu, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Header Component
 * Top navigation bar with theme switcher and mobile menu toggle
 * Displays current page title and provides theme controls
 */

const Header = ({ title, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  /**
   * Get theme icon based on current theme
   */
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'pink-blue':
        return <Palette className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  /**
   * Get theme label for tooltip/accessibility
   */
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to Dark Mode';
      case 'dark':
        return 'Switch to Pink-Blue Mode';
      case 'pink-blue':
        return 'Switch to Light Mode';
      default:
        return 'Toggle Theme';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Page Title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 relative group"
            aria-label={getThemeLabel()}
            title={getThemeLabel()}
          >
            <div className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              {getThemeIcon()}
            </div>

            {/* Theme Indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800">
              {theme === 'light' && (
                <div className="w-full h-full bg-yellow-400 rounded-full"></div>
              )}
              {theme === 'dark' && (
                <div className="w-full h-full bg-blue-600 rounded-full"></div>
              )}
              {theme === 'pink-blue' && (
                <div className="w-full h-full bg-gradient-to-r from-pink-500 to-blue-500 rounded-full"></div>
              )}
            </div>
          </button>

          {/* Current Time Display */}
          <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
            <CurrentTime />
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Current Time Component
 * Displays live updating current time
 */
const CurrentTime = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className="font-mono text-lg text-gray-900 dark:text-white">
        {time.toLocaleTimeString('en-US', {
          hour12: true,
          hour: 'numeric',
          minute: '2-digit'
        })}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {time.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}
      </div>
    </div>
  );
};

export default Header;
