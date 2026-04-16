"use client";

import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { IconSearch, IconBell } from "@/components/icons";

const pageTitles: Record<string, string> = {
  "/dashboard": "Command Center",
  "/missions": "Mission Control",
  "/revenue": "Revenue Tracker",
  "/systems": "Daily Systems",
  "/goals": "Goals",
  "/partners": "Partners",
  "/prove": "Prove It",
  "/settings": "Settings",
  "/onboarding": "Setup",
};

export function Topbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const title = pageTitles[pathname] || "AXIS";

  return (
    <header
      className="h-16 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        backgroundColor: theme === "dark" ? "rgba(9,9,11,0.8)" : "rgba(250,250,250,0.85)",
        borderBottom: `1px solid var(--border-primary)`,
      }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
        <p className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{formatDate(new Date())}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `1px solid var(--border-primary)`,
            color: "var(--text-tertiary)",
          }}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>

        {/* Search */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `1px solid var(--border-primary)`,
            color: "var(--text-tertiary)",
          }}
        >
          <IconSearch size={16} />
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            border: `1px solid var(--border-primary)`,
            color: "var(--text-tertiary)",
          }}
        >
          <IconBell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-axis-accent rounded-full" />
        </button>
      </div>
    </header>
  );
}
