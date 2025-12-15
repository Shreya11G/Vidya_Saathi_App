import { createContext, useContext, useEffect, useState } from "react";

/**
 * Theme Context
 * Supports: light | dark | pink-blue
 * Tailwind dark mode + CSS variables
 */

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vidyasathi-theme") || "light";
  });

  /**
   * Apply theme styles and classes
   */
  useEffect(() => {
    const root = document.documentElement; // ✅ Tailwind uses <html>

    // Remove all theme-related classes
    root.classList.remove("dark", "pink-blue");

    // Apply Tailwind dark mode
    if (theme === "dark") {
      root.classList.add("dark");
    }

    // Apply CSS variables
    switch (theme) {
      case "light":
        setLightTheme(root);
        break;
      case "dark":
        setDarkTheme(root);
        break;
      case "pink-blue":
        setPinkBlueTheme(root);
        break;
      default:
        setLightTheme(root);
    }

    localStorage.setItem("vidyasathi-theme", theme);
  }, [theme]);

  /**
   * Toggle between themes
   */
  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "light" ? "dark" : prev === "dark" ? "pink-blue" : "light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ===================== THEME DEFINITIONS ===================== */

const setLightTheme = (root) => {
  root.style.setProperty("--primary-color", "#3B82F6");
  root.style.setProperty("--secondary-color", "#8B5CF6");
  root.style.setProperty("--accent-color", "#EC4899");
  root.style.setProperty("--bg-primary", "#FFFFFF");
  root.style.setProperty("--bg-secondary", "#F9FAFB");
  root.style.setProperty("--text-primary", "#1F2937");
  root.style.setProperty("--text-secondary", "#6B7280");
  root.style.setProperty("--border-color", "#E5E7EB");
};

const setDarkTheme = (root) => {
  root.style.setProperty("--primary-color", "#3B82F6");
  root.style.setProperty("--secondary-color", "#8B5CF6");
  root.style.setProperty("--accent-color", "#EC4899");
  root.style.setProperty("--bg-primary", "#1F2937");
  root.style.setProperty("--bg-secondary", "#111827");
  root.style.setProperty("--text-primary", "#F9FAFB");
  root.style.setProperty("--text-secondary", "#D1D5DB");
  root.style.setProperty("--border-color", "#374151");
};

const setPinkBlueTheme = (root) => {
  root.style.setProperty("--primary-color", "#EC4899");
  root.style.setProperty("--secondary-color", "#3B82F6");
  root.style.setProperty("--accent-color", "#8B5CF6");
  root.style.setProperty("--bg-primary", "#FDF2F8");
  root.style.setProperty("--bg-secondary", "#FCE7F3");
  root.style.setProperty("--text-primary", "#1F2937");
  root.style.setProperty("--text-secondary", "#6B7280");
  root.style.setProperty("--border-color", "#F9A8D4");
};
