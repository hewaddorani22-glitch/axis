"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/provider";

const SCROLL_REVEAL_PX = 320;

/**
 * Sticky bottom CTA visible on mobile only, after scrolling past the hero.
 * The TikTok-driven audience never scrolls back to the top, so a persistent
 * thumb-reach CTA keeps the funnel one tap away.
 */
export function StickyCTA() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_REVEAL_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-md rounded-2xl bg-axis-text1/95 backdrop-blur-md shadow-2xl shadow-axis-text1/30 border border-white/[0.08]">
        <Link
          href="/start"
          className="flex items-center justify-between gap-3 px-5 py-3.5 text-white"
        >
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
              {t("hero.trust")}
            </span>
            <span className="text-base font-semibold">{t("hero.cta")}</span>
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-axis-accent text-axis-text1 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
