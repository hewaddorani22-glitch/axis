"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import {
  AxisLogo,
  IconCommand,
  IconTarget,
  IconRevenue,
  IconHabits,
  IconGoals,
  IconPartners,
  IconProve,
  IconSettings,
  IconUpgrade,
  IconLogout,
} from "@/components/icons";

const navItems = [
  { href: "/dashboard", label: "Command Center", icon: IconCommand, shortLabel: "Home" },
  { href: "/missions", label: "Mission Control", icon: IconTarget, shortLabel: "Missions" },
  { href: "/revenue", label: "Revenue Tracker", icon: IconRevenue, shortLabel: "Revenue" },
  { href: "/systems", label: "Daily Systems", icon: IconHabits, shortLabel: "Habits" },
  { href: "/goals", label: "Goals", icon: IconGoals, shortLabel: "Goals" },
  { href: "/partners", label: "Partners", icon: IconPartners, shortLabel: "Partners" },
];

const bottomItems = [
  { href: "/prove", label: "Prove It", icon: IconProve },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-axis-dark border-r border-white/[0.06] fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/[0.06]">
          <AxisLogo size={28} />
          <span className="text-base font-bold text-white tracking-tight">AXIS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 axis-scrollbar overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                <Icon size={18} className={cn("w-5 flex-shrink-0", isActive ? "text-axis-accent" : "")} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-axis-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-1">
          <div className="border-t border-white/[0.06] my-2" />

          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                )}
              >
                <Icon size={18} className={cn("w-5 flex-shrink-0", isActive ? "text-axis-accent" : "")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Upgrade CTA */}
          {user?.plan !== "pro" && (
            <div className="mt-3 p-4 rounded-xl bg-axis-accent/10 border border-axis-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <IconUpgrade size={14} className="text-axis-accent" />
                <p className="text-xs font-semibold text-axis-accent">Upgrade to Pro</p>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed mb-3">Unlimited everything. $9/mo.</p>
              <button
                onClick={async () => {
                  const res = await fetch("/api/stripe/checkout", { method: "POST" });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="block w-full text-center text-xs font-semibold bg-axis-accent text-axis-dark px-4 py-2 rounded-lg hover:bg-axis-accent/90 transition-all"
              >
                Upgrade
              </button>
            </div>
          )}

          {user?.plan === "pro" && (
            <div className="mt-3 px-3 py-2">
              <span className="text-[10px] font-mono font-bold bg-axis-accent text-axis-dark px-2.5 py-1 rounded-md">
                PRO
              </span>
            </div>
          )}

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-3 mt-2 group">
            <div className="w-8 h-8 rounded-full bg-axis-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold font-mono text-axis-accent">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all"
              title="Sign out"
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-axis-dark border-t border-white/[0.06] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive ? "text-axis-accent" : "text-white/40"
                )}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
