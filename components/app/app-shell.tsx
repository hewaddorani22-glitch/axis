"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { ErrorBoundary } from "@/components/app/error-boundary";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFocusMode = pathname.startsWith("/missions/focus/");

  if (isFocusMode) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <div className="lg:pl-[260px]">
        <Topbar />
        <main className="p-6 pb-24 lg:pb-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
