"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useLocale } from "@/lib/i18n/provider";
import { getPrimaryNavItems, getSecondaryNavItems } from "@/components/app/navigation";
import { SUPPORT_MAILTO } from "@/lib/support";
import {
  IconLogout,
  IconStreak,
  IconSettings,
  IconMail,
} from "@/components/icons";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const { streak } = useStreak();
  const { t } = useLocale();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryNavItems = getPrimaryNavItems({ pathname, userType: user?.user_type });
  const secondaryNavItems = getSecondaryNavItems({
    pathname,
    hasPublicProfile: Boolean(user?.prove_it_username),
  });
  const mobileMainItems = primaryNavItems.slice(0, 4);
  const mobileMoreItems = primaryNavItems.slice(4);
  const isMoreActive = [...mobileMoreItems, ...secondaryNavItems].some((item) => pathname === item.href);

  // Desktop narrow rail: primary + settings only. Other secondary items live in mobile More.
  const railItems = [...primaryNavItems, ...secondaryNavItems.filter((i) => i.href === "/settings" || i.href === "/goals")];

  return (
    <>
      {/* Desktop narrow sidebar — icon-only */}
      <aside
        className="hidden lg:flex flex-col w-[72px] h-screen fixed left-0 top-0 z-40 py-7 items-center"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-primary)",
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="mb-9 flex h-9 w-9 items-center justify-center rounded-[11px]"
          style={{
            backgroundColor: "var(--forge-iron)",
            border: "1px solid var(--forge-gold)",
            color: "var(--forge-gold)",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
          title="lomoura · the forge"
        >
          L
        </Link>

        {/* Nav rail */}
        <nav className="flex flex-col items-center gap-1">
          {railItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-[11px] transition-colors",
                )}
                style={{
                  backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                <Icon size={17} />
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-[2px]"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Streak chip */}
        {streak > 0 && (
          <Link
            href="/systems"
            title={t("sidebar.streak.title", { n: String(streak) })}
            className="mb-3 flex h-10 w-10 flex-col items-center justify-center rounded-[11px] transition-colors hover:opacity-90"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <span className="text-[13px] font-extrabold leading-none" style={{ color: "var(--accent)" }}>
              {streak}
            </span>
            <IconStreak size={9} style={{ color: "var(--soft-warm)" }} />
          </Link>
        )}

        {/* Avatar */}
        <div className="group relative">
          <Link
            href="/settings"
            title={displayName}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-[11px] font-bold"
            style={{
              backgroundColor: "var(--forge-iron)",
              border: "1px solid var(--forge-edge)",
              color: "var(--forge-bone)",
              letterSpacing: "0.04em",
            }}
          >
            {initials}
          </Link>
          {user && (
            <button
              onClick={signOut}
              className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-tertiary)",
              }}
              title={t("sidebar.signout")}
            >
              <IconLogout size={9} />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile More menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(13,13,17,0.55)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="absolute inset-x-3 rounded-2xl p-3 shadow-2xl"
            style={{
              bottom: "calc(72px + env(safe-area-inset-bottom))",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {[...mobileMoreItems, ...secondaryNavItems].map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
              <a
                href={SUPPORT_MAILTO}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <IconMail size={18} className="shrink-0" />
                <span className="truncate">{t("sidebar.support")}</span>
              </a>
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <IconLogout size={18} className="shrink-0" />
                  <span className="truncate">{t("sidebar.signout")}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tabs */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-[env(safe-area-inset-bottom)]"
        style={{
          backgroundColor: "rgba(13,13,17,0.82)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center justify-around h-16">
          {mobileMainItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showStreakBadge = item.href === "/systems" && streak > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-tertiary)",
                }}
              >
                <div className="relative">
                  <Icon size={18} />
                  {showStreakBadge && (
                    <span
                      className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold leading-none"
                      style={{
                        backgroundColor: "var(--soft-warm)",
                        color: "var(--text-inverted)",
                      }}
                    >
                      {streak >= 7 ? <IconStreak size={8} /> : streak}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors"
            style={{
              color: isMoreActive || mobileMenuOpen ? "var(--accent)" : "var(--text-tertiary)",
            }}
            aria-expanded={mobileMenuOpen}
            aria-label="Open more navigation"
          >
            <IconSettings size={18} />
            <span className="text-[10px] font-medium">{t("sidebar.more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
