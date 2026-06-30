import React from 'react';
import { Menu, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ title, onMenuClick, sidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();

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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 sm:px-5 lg:px-6 py-3 sm:py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-3">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          {!sidebarOpen && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors flex-shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={false}
            >
              <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] truncate">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 truncate hidden sm:block">
              {today}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors duration-200 relative group"
            aria-label={getThemeLabel()}
            title={getThemeLabel()}
          >
            <div className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              {getThemeIcon()}
            </div>

            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[var(--border-color)]">
              {theme === 'light' && (
                <div className="w-full h-full bg-yellow-400 rounded-full" />
              )}
              {theme === 'dark' && (
                <div className="w-full h-full bg-blue-600 rounded-full" />
              )}
              {theme === 'pink-blue' && (
                <div className="w-full h-full bg-gradient-to-r from-pink-500 to-blue-500 rounded-full" />
              )}
            </div>
          </button>

          <div className="hidden sm:block">
            <CurrentTime />
          </div>
        </div>
      </div>
    </header>
  );
};

const CurrentTime = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className="font-mono text-base lg:text-lg text-[var(--text-primary)]">
        {time.toLocaleTimeString('en-US', {
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

export default Header;
