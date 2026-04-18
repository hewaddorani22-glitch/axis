"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { CommandPaletteProvider } from "@/components/app/command-palette";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <Sidebar />
        <div className="lg:pl-[260px]">
          <Topbar />
          <main className="p-6 pb-24 lg:pb-6">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
