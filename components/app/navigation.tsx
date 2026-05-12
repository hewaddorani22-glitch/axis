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
  IconStreak,
  IconTarget,
  IconUser,
} from "@/components/icons";

export type NavigationItem = {
  href: string;
  label: string;
  icon: typeof IconCommand;
  shortLabel?: string;
  shortcutKey: string;
};

export const pageTitles: Record<string, string> = {
  "/dashboard": "Forge",
  "/path": "The Path",
  "/self": "Self",
  "/missions": "Tasks",
  "/revenue": "Revenue Tracker",
  "/systems": "Habits",
  "/goals": "Themes",
  "/network": "Network Grid",
  "/partners": "Partners",
  "/review": "Review",
  "/prove": "Public Profile",
  "/settings": "Counsel",
  "/onboarding": "The Vow",
};

const dashboardNavItem: NavigationItem = {
  href: "/dashboard",
  label: "Forge",
  icon: IconCommand,
  shortLabel: "Forge",
  shortcutKey: "f",
};

const pathNavItem: NavigationItem = {
  href: "/path",
  label: "Path",
  icon: IconStreak,
  shortLabel: "Path",
  shortcutKey: "p",
};

const selfNavItem: NavigationItem = {
  href: "/self",
  label: "Self",
  icon: IconUser,
  shortLabel: "Self",
  shortcutKey: "u",
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

/**
 * The Forge nav is intentionally narrow: Today · Tasks · Habits · Review.
 * Themes, Revenue, Partners, Network, Prove are kept in code (routes still
 * resolve) but hidden from the sidebar/mobile menu per LOMOURA-FORGE.md §6.
 * Re-enable by adding to FORGE_PRIMARY / FORGE_SECONDARY below.
 */
const FORGE_MODE = true;

export function getPrimaryNavItems({
  pathname,
  userType,
}: {
  pathname?: string;
  userType?: string | null;
} = {}): NavigationItem[] {
  if (FORGE_MODE) {
    // The 4-tab architecture per LOMOURA-FORGE.md §6: Forge · Path · Self · Counsel.
    // Tasks / Habits / Review remain reachable for power users but live off the rail.
    return [dashboardNavItem, pathNavItem, selfNavItem];
  }

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
  if (FORGE_MODE) {
    return [settingsNavItem];
  }

  return [
    themesNavItem,
    partnersNavItem,
    networkNavItem,
    ...(hasPublicProfile || pathname === "/prove" ? [proveNavItem] : []),
    settingsNavItem,
  ];
}
