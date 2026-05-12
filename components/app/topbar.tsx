"use client";

import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { useCommandPalette } from "@/components/app/command-palette";
import { pageTitles } from "@/components/app/navigation";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";
import { IconCommand, IconMail } from "@/components/icons";

export function Topbar() {
  const pathname = usePathname();
  const { openPalette } = useCommandPalette();
  const title = pageTitles[pathname] || "lomoura";

  return (
    <header
      className="h-16 backdrop-blur-xl flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-30"
      style={{
        backgroundColor: "rgba(10, 10, 11, 0.82)",
        borderBottom: "1px solid var(--border-primary)",
      }}
    >
      <div className="min-w-0">
        <h1
          className="truncate text-base font-semibold sm:text-lg"
          style={{ color: "var(--text-primary)", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.04em" }}
        >
          {title}
        </h1>
        <p className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {formatDate(new Date())}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <a
          href={SUPPORT_MAILTO}
          className="flex h-9 items-center gap-2 rounded-xl px-2.5 transition-colors sm:px-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-tertiary)",
          }}
          title={`Email support: ${SUPPORT_EMAIL}`}
        >
          <IconMail size={15} />
          <span className="hidden text-sm font-medium md:inline">Support</span>
        </a>

        <button
          onClick={openPalette}
          className="flex h-9 items-center gap-2 rounded-xl px-2.5 transition-colors sm:px-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-tertiary)",
          }}
          title="Open command palette"
        >
          <IconCommand size={15} />
          <span className="hidden text-sm font-medium md:inline">Quick Actions</span>
          <span
            className="hidden rounded-lg px-2 py-1 font-mono text-[10px] uppercase sm:inline"
            style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-tertiary)" }}
          >
            Mod K
          </span>
        </button>
      </div>
    </header>
  );
}
