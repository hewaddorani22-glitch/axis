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
        emerald: { 500: "var(--status-emerald)" },
        orange: { 500: "var(--status-orange)" },
        amber: { 500: "var(--status-amber)" },
        red: { 500: "var(--status-red)" },
        violet: { 500: "var(--status-violet)" },
        axis: {
          accent: "var(--accent)",
          accent2: "#22C55E",
          dark: "#09090B",
          dark2: "#141418",
          dark3: "#1C1C22",
          surface: "#FFFFFF",
          bg: "#FAFAFA",
          border: "#E4E4E7",
          border2: "#D4D4D8",
          text1: "#0B0B0F",
          text2: "#52525B",
          text3: "#A1A1AA",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
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
