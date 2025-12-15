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
  User,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
    { icon: FileText, label: "Paragraph Writer", path: "/paragraph-writer" },
    { icon: HelpCircle, label: "Quiz Time", path: "/quiz-time" },
    { icon: Gamepad2, label: "Memory Game", path: "/memory-game" },
  ];

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      onClose?.();
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 
      bg-[var(--bg-secondary)] text-[var(--text-primary)]
      border-r border-[var(--border-color)]
      transform transition-transform duration-300 ease-in-out 
      lg:translate-x-0 lg:static lg:inset-0
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">VidyaSaathi</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Your Study Companion
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded hover:bg-[var(--bg-primary)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => isOpen && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition
              ${
                isActive
                  ? "bg-blue-500/10 text-blue-600"
                  : "hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[var(--border-color)] space-y-2">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-primary)]"
        >
          <User className="w-5 h-5" />
          <span className="text-sm">Profile Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
