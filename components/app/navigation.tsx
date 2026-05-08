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

export type NavigationItem = {
  href: string;
  label: string;
  icon: typeof IconCommand;
  shortLabel?: string;
  shortcutKey: string;
};

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

const dashboardNavItem: NavigationItem = {
  href: "/dashboard",
  label: "Today",
  icon: IconCommand,
  shortLabel: "Today",
  shortcutKey: "d",
};

const tasksNavItem: NavigationItem = {
  href: "/missions",
  label: "Tasks",
  icon: IconTarget,
  shortLabel: "Tasks",
  shortcutKey: "m",
};

const habitsNavItem: NavigationItem = {
  href: "/systems",
  label: "Habits",
  icon: IconHabits,
  shortLabel: "Habits",
  shortcutKey: "s",
};

const revenueNavItem: NavigationItem = {
  href: "/revenue",
  label: "Revenue Tracker",
  icon: IconRevenue,
  shortLabel: "Revenue",
  shortcutKey: "r",
};

const reviewNavItem: NavigationItem = {
  href: "/review",
  label: "Weekly Review",
  icon: IconReview,
  shortLabel: "Review",
  shortcutKey: "w",
};

const themesNavItem: NavigationItem = {
  href: "/goals",
  label: "Themes",
  icon: IconGoals,
  shortLabel: "Themes",
  shortcutKey: "o",
};

const partnersNavItem: NavigationItem = {
  href: "/partners",
  label: "Partners",
  icon: IconPartners,
  shortcutKey: "p",
};

const networkNavItem: NavigationItem = {
  href: "/network",
  label: "Network Grid",
  icon: IconGlobe,
  shortcutKey: "n",
};

const proveNavItem: NavigationItem = {
  href: "/prove",
  label: "Public Profile",
  icon: IconProve,
  shortcutKey: "v",
};

const settingsNavItem: NavigationItem = {
  href: "/settings",
  label: "Settings",
  icon: IconSettings,
  shortcutKey: ",",
};

export function getPrimaryNavItems({
  pathname,
  userType,
}: {
  pathname?: string;
  userType?: string | null;
} = {}): NavigationItem[] {
  const showRevenue = userType === "entrepreneur" || userType === "creator" || pathname === "/revenue";

  return [
    dashboardNavItem,
    tasksNavItem,
    habitsNavItem,
    ...(showRevenue ? [revenueNavItem] : []),
    reviewNavItem,
  ];
}

export function getSecondaryNavItems({
  pathname,
  hasPublicProfile,
}: {
  pathname?: string;
  hasPublicProfile?: boolean;
} = {}): NavigationItem[] {
  return [
    themesNavItem,
    partnersNavItem,
    networkNavItem,
    ...(hasPublicProfile || pathname === "/prove" ? [proveNavItem] : []),
    settingsNavItem,
  ];
}
