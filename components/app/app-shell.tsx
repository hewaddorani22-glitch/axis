"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFocusMode = pathname.startsWith("/missions/focus/");

  if (isFocusMode) {
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <div className="min-w-0 lg:pl-[260px]">
        <Topbar />
        <main className="min-w-0 overflow-x-hidden px-4 py-4 pb-28 sm:p-6 sm:pb-28 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
