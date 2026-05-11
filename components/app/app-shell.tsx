"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { Celebrations } from "@/components/app/celebrations";
import { PwaInstallPrompt } from "@/components/app/pwa-install-prompt";
import { StreakRecoveryModal } from "@/components/app/streak-recovery-modal";
import { StreakRestorePromptModal } from "@/components/app/streak-restore-prompt-modal";
import { PushSubscribePrompt } from "@/components/app/push-subscribe-prompt";
import { UpgradeModal } from "@/components/app/upgrade-modal";
import { AchievementUnlockModal } from "@/components/app/achievement-unlock-modal";
import { HabitPickModal } from "@/components/app/habit-pick-modal";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFocusMode = pathname.startsWith("/missions/focus/");

  if (isFocusMode) {
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <Celebrations />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Celebrations />
      <PwaInstallPrompt />
      <StreakRecoveryModal />
      <StreakRestorePromptModal />
      <UpgradeModal />
      <AchievementUnlockModal />
      <HabitPickModal />
      <PushSubscribePrompt vapidPublicKey={VAPID_PUBLIC_KEY} />
      <Sidebar />
      <div className="min-w-0 lg:pl-[72px]">
        <Topbar />
        <main className="min-w-0 overflow-x-hidden px-4 py-4 pb-28 sm:p-6 sm:pb-28 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
