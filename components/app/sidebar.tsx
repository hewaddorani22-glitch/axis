"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useAxisScore } from "@/hooks/useAxisScore";
import { AxisScoreWidget } from "@/components/app/axis-score-widget";
import { primaryNavItems, secondaryNavItems } from "@/components/app/navigation";
import {
  AxisLogo,
  IconUpgrade,
  IconLogout,
  IconStreak,
} from "@/components/icons";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const { streak } = useStreak();
  const axisScore = useAxisScore();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const [startingCheckout, setStartingCheckout] = useState(false);

  const hasStreak = streak > 0;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen overflow-hidden bg-axis-dark border-r border-white/[0.06] fixed left-0 top-0 z-40">
        {/* Logo + Streak */}
        <div className="flex shrink-0 items-center justify-between px-6 h-16 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <AxisLogo size={28} />
            <span className="text-base font-bold text-white tracking-tight">AXIS</span>
          </div>
          {hasStreak && (
            <Link
              href="/systems"
              title={`${streak}-day streak`}
              className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1 hover:bg-orange-500/20 transition-all"
            >
              <IconStreak size={12} className="text-orange-400" />
              <span className="text-xs font-mono font-bold text-orange-400">{streak}</span>
            </Link>
          )}
        </div>

        <div className="flex-1 min-h-0 axis-scrollbar overflow-y-auto">
          <div className="flex min-h-full flex-col px-3 py-3">
            <AxisScoreWidget {...axisScore} compact className="bg-white/[0.03] shadow-none" />

            {/* Navigation */}
            <nav className="mt-4 space-y-1">
              {primaryNavItems.map((item) => {
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
            <div className="mt-auto space-y-1 border-t border-white/[0.06] pt-4">

              {secondaryNavItems.map((item) => {
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
                <div className="mt-3 rounded-2xl border border-axis-accent/20 bg-axis-accent/10 p-3.5">
                  <div className="mb-1 flex items-center gap-2">
                    <IconUpgrade size={13} className="text-axis-accent" />
                    <p className="text-xs font-semibold text-axis-accent">Upgrade to Pro</p>
                  </div>
                  <p className="mb-3 text-[11px] leading-relaxed text-white/45">Unlimited everything. $9/mo.</p>
                  <button
                    onClick={async () => {
                      try {
                        setStartingCheckout(true);
                        const res = await fetch("/api/stripe/checkout", { method: "POST" });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                          return;
                        }

                        alert(data.error || "Failed to start checkout.");
                      } catch {
                        alert("Network error. Please try again.");
                      } finally {
                        setStartingCheckout(false);
                      }
                    }}
                    disabled={startingCheckout}
                    className="block w-full rounded-xl bg-axis-accent px-4 py-2.5 text-center text-xs font-semibold text-axis-dark transition-all hover:bg-axis-accent/90"
                  >
                    {startingCheckout ? "Opening..." : "Upgrade"}
                  </button>
                </div>
              )}

              {user?.plan === "pro" && (
                <div className="mt-3 px-3 py-2">
                  <span className="rounded-md bg-axis-accent px-2.5 py-1 text-[10px] font-mono font-bold text-axis-dark">
                    PRO
                  </span>
                </div>
              )}

              {/* User */}
              <div className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-3 group hover:bg-white/[0.03] transition-all">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-axis-accent/20">
                  <span className="text-xs font-bold font-mono text-axis-accent">{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{displayName}</p>
                  <p className="truncate text-[11px] text-white/30">{user?.email}</p>
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
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tabs: streak badge on Habits tab */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 axis-glass border-t-0 border-b-0 border-x-0 border-white/[0.06] rounded-none px-2 pb-[env(safe-area-inset-bottom)]" style={{ background: "rgba(11, 11, 15, 0.8)", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div className="flex items-center justify-around h-16">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showStreakBadge = item.href === "/systems" && streak > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive ? "text-axis-accent" : "text-white/40"
                )}
              >
                <div className="relative">
                  <Icon size={18} />
                  {showStreakBadge && (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center bg-orange-500 text-axis-dark text-[9px] font-mono font-bold leading-none w-4 h-4 rounded-full">
                      {streak >= 7 ? <IconStreak size={8} /> : streak}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
