import {
  IconCommand,
  IconGoals,
  IconGlobe,
  IconHabits,
  IconPartners,
  IconProve,
  IconRevenue,
  IconReview,
  IconSettings,
  IconTarget,
} from "@/components/icons";

export const pageTitles: Record<string, string> = {
  "/dashboard": "Today",
  "/missions": "Tasks",
  "/revenue": "Revenue Tracker",
  "/systems": "Habits",
  "/goals": "Themes",
  "/network": "Network Grid",
  "/partners": "Partners",
  "/review": "Weekly Review",
  "/prove": "Public Profile",
  "/settings": "Settings",
  "/onboarding": "Setup",
};

export const primaryNavItems = [
  { href: "/dashboard", label: "Today", icon: IconCommand, shortLabel: "Today", shortcutKey: "d" },
  { href: "/missions", label: "Tasks", icon: IconTarget, shortLabel: "Tasks", shortcutKey: "m" },
  { href: "/revenue", label: "Revenue Tracker", icon: IconRevenue, shortLabel: "Revenue", shortcutKey: "r" },
  { href: "/systems", label: "Habits", icon: IconHabits, shortLabel: "Habits", shortcutKey: "s" },
  { href: "/goals", label: "Themes", icon: IconGoals, shortLabel: "Themes", shortcutKey: "o" },
  { href: "/network", label: "Network Grid", icon: IconGlobe, shortLabel: "Grid", shortcutKey: "n" },
  { href: "/review", label: "Weekly Review", icon: IconReview, shortLabel: "Review", shortcutKey: "w" },
];

export const secondaryNavItems = [
  { href: "/partners", label: "Partners", icon: IconPartners, shortcutKey: "p" },
  { href: "/prove", label: "Public Profile", icon: IconProve, shortcutKey: "v" },
  { href: "/settings", label: "Settings", icon: IconSettings, shortcutKey: "," },
];
