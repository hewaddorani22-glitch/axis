"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEMED_APP_PREFIXES = [
  "/dashboard",
  "/missions",
  "/systems",
  "/revenue",
  "/goals",
  "/review",
  "/network",
  "/partners",
  "/prove",
  "/settings",
  "/onboarding",
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const canUseDashboardTheme = THEMED_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("lomoura-theme") || localStorage.getItem("axis-theme")) as Theme;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", canUseDashboardTheme ? theme : "light");
    localStorage.setItem("lomoura-theme", theme);
  }, [theme, mounted, canUseDashboardTheme]);

  const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
