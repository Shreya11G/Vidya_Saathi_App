import React from "react";
import { NavLink } from "react-router-dom";
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
  FolderOpen,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import UserAvatar from "../components/UserAvatar";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: StickyNote, label: "Notes", path: "/notes" },
    { icon: Timer, label: "Pomodoro", path: "/pomodoro" },
    { icon: Bot, label: "AI Tutor", path: "/ai-tutor" },
    { icon: Briefcase, label: "Career", path: "/career" },
    { icon: TrendingUp, label: "Streaks", path: "/streaks" },
    { icon: Link, label: "Links", path: "/links" },
    { icon: FolderOpen, label: "My Documents", path: "/documents" },
    { icon: FileText, label: "Paragraph Writer", path: "/paragraph-writer" },
    { icon: HelpCircle, label: "Quiz", path: "/quiz/upload" },
    { icon: Gamepad2, label: "Memory Game", path: "/memory-game" },
  ];

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      onClose?.();
    }
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 h-screen flex flex-col
        bg-[var(--bg-secondary)] text-[var(--text-primary)]
        border-r border-[var(--border-color)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">VidyaSaathi</h1>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              Your Study Companion
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] transition-colors flex-shrink-0"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar user={user} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${
                isActive
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 sm:p-4 border-t border-[var(--border-color)] space-y-1 flex-shrink-0">
        <NavLink
          to="/profile"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
            ${
              isActive
                ? "bg-blue-500/10 text-blue-600"
                : "hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            }`
          }
        >
          <User className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Profile Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
