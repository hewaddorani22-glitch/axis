"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getBrowserAppUrl } from "@/lib/env";
import { useLocale } from "@/lib/i18n/provider";

interface StreakShareProps {
  streak: number;
  name: string;
  score?: number;
}

export function StreakShare({ streak, name, score }: StreakShareProps) {
  const { t, locale } = useLocale();
  const [sharing, setSharing] = useState(false);

  if (streak < 3) return null;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    const base = getBrowserAppUrl();
    const ogUrl = `${base}/api/og?username=${encodeURIComponent(name)}&streak=${streak}${score != null ? `&score=${score}` : ""}`;

    const shareData: ShareData = {
      title: locale === "de"
        ? `${streak}-Tage Streak auf lomoura 🔥`
        : `${streak}-day streak on lomoura 🔥`,
      text: locale === "de"
        ? `Ich hab einen ${streak}-Tage Streak! Missions, Habits, Ziele — alles auf lomoura. Kostenlos starten 👇`
        : `I'm on a ${streak}-day streak! Missions, habits, goals — all in lomoura. Start free 👇`,
      url: `${base}/start`,
    };

    try {
      if (navigator.canShare && navigator.canShare({ url: shareData.url })) {
        await navigator.share(shareData);
        toast.success(t("share.success"));
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success(t("share.copied"));
      }
    } catch (err) {
      // User cancelled or error
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        try {
          await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
          toast.success(t("share.copied"));
        } catch {
          toast.error(t("share.error"));
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      title={t("share.tooltip")}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-axis-text3 hover:text-orange-500 transition-colors disabled:opacity-50"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {t("share.cta")}
    </button>
  );
}
