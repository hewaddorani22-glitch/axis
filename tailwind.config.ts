import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: "var(--soft-green-dim)",
          200: "var(--soft-green-dim)",
          400: "var(--status-emerald)",
          500: "var(--status-emerald)",
          600: "var(--status-emerald)",
          700: "var(--status-emerald)",
        },
        orange: {
          400: "var(--status-orange)",
          500: "var(--status-orange)",
          600: "var(--status-orange)",
        },
        amber: {
          400: "var(--status-amber)",
          500: "var(--status-amber)",
          600: "var(--status-amber)",
          700: "var(--status-amber)",
        },
        red: {
          50: "var(--soft-coral-dim)",
          200: "var(--soft-coral-dim)",
          300: "var(--status-red)",
          400: "var(--status-red)",
          500: "var(--status-red)",
          600: "var(--status-red)",
          700: "var(--status-red)",
        },
        blue: {
          400: "var(--soft-lav)",
          500: "var(--soft-lav)",
          600: "var(--soft-lav)",
        },
        violet: { 500: "var(--status-violet)" },
        forge: {
          void: "var(--forge-void)",
          stone: "var(--forge-stone)",
          iron: "var(--forge-iron)",
          edge: "var(--forge-edge)",
          bone: "var(--forge-bone)",
          ash: "var(--forge-ash)",
          shadow: "var(--forge-shadow)",
          gold: "var(--forge-gold)",
          pulse: "var(--forge-pulse)",
          warn: "var(--forge-warn)",
          fail: "var(--forge-fail)",
        },
        axis: {
          accent: "var(--accent)",
          accent2: "var(--forge-pulse)",
          dark: "var(--forge-void)",
          dark2: "var(--forge-stone)",
          dark3: "var(--forge-iron)",
          surface: "var(--forge-stone)",
          bg: "var(--forge-void)",
          border: "var(--forge-edge)",
          border2: "var(--border-secondary)",
          text1: "var(--forge-bone)",
          text2: "var(--forge-ash)",
          text3: "var(--forge-shadow)",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        serif: ["Cormorant Garamond", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
