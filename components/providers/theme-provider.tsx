"use client";

/**
 * Theme Provider — không dùng MUI
 * Quản lý dark/light mode thông qua CSS class trên html element
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Đọc theme từ localStorage hoặc window.__INITIAL_THEME__
    let initialTheme: Theme = "dark";
    try {
      const stored = localStorage.getItem("rpc_theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        initialTheme = stored;
      }
    } catch {
      // localStorage không available
    }
    setThemeState(initialTheme);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("rpc_theme", newTheme);
    } catch {}
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;
