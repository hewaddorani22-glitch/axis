import {
  IconCommand,
  IconGoals,
  IconHabits,
  IconNetwork,
  IconPartners,
  IconProve,
  IconRevenue,
  IconReview,
  IconSettings,
  IconTarget,
} from "@/components/icons";

export const pageTitles: Record<string, string> = {
  "/dashboard": "Command Center",
  "/missions": "Mission Control",
  "/revenue": "Revenue Tracker",
  "/systems": "Daily Systems",
  "/goals": "Goals",
  "/partners": "Partners",
  "/network": "The Grid",
  "/review": "Weekly Review",
  "/prove": "Prove It",
  "/settings": "Settings",
  "/onboarding": "Setup",
};

export const primaryNavItems = [
  { href: "/dashboard", label: "Command Center", icon: IconCommand, shortLabel: "Home", shortcutKey: "d" },
  { href: "/missions", label: "Mission Control", icon: IconTarget, shortLabel: "Missions", shortcutKey: "m" },
  { href: "/revenue", label: "Revenue Tracker", icon: IconRevenue, shortLabel: "Revenue", shortcutKey: "r" },
  { href: "/systems", label: "Daily Systems", icon: IconHabits, shortLabel: "Habits", shortcutKey: "s" },
  { href: "/goals", label: "Goals", icon: IconGoals, shortLabel: "Goals", shortcutKey: "o" },
  { href: "/partners", label: "Partners", icon: IconPartners, shortLabel: "Partners", shortcutKey: "p" },
  { href: "/network", label: "The Grid", icon: IconNetwork, shortLabel: "Grid", shortcutKey: "x" },
  { href: "/review", label: "Weekly Review", icon: IconReview, shortLabel: "Review", shortcutKey: "w" },
];

export const secondaryNavItems = [
  { href: "/prove", label: "Prove It", icon: IconProve, shortcutKey: "v" },
  { href: "/settings", label: "Settings", icon: IconSettings, shortcutKey: "," },
];
