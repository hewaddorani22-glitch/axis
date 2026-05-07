"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/lib/i18n/provider";

type Platform = "android" | "ios" | null;

const DISMISS_KEY = "lomoura-pwa-dismissed-until";
const DAY_MS = 24 * 60 * 60 * 1000;
const REDISMISS_DAYS = 14;
const SHOW_DELAY_MS = 4000;

function getDismissedUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch { return 0; }
}

function snooze() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + REDISMISS_DAYS * DAY_MS));
  } catch { /* ignore */ }
}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua)) {
    return "ios";
  }
  // Android handled via beforeinstallprompt — return null here,
  // prompt ref is set in event listener
  return null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS
    (navigator.standalone === true)
  );
}

export function PwaInstallPrompt() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const deferredPromptRef = useRef<Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (Date.now() < getDismissedUntil()) return;

    // Android: intercept beforeinstallprompt
    const handleInstallable = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as typeof deferredPromptRef.current;
      window.setTimeout(() => {
        if (Date.now() >= getDismissedUntil()) {
          setPlatform("android");
          setOpen(true);
        }
      }, SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", handleInstallable);

    // iOS: show manual instructions
    const ios = detectPlatform();
    if (ios === "ios") {
      const timer = window.setTimeout(() => {
        if (Date.now() >= getDismissedUntil()) {
          setPlatform("ios");
          setOpen(true);
        }
      }, SHOW_DELAY_MS);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleInstallable);
        window.clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallable);
    };
  }, []);

  const handleAndroidInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt?.prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    snooze();
    setOpen(false);
    if (choice?.outcome === "accepted") {
      deferredPromptRef.current = null;
    }
  };

  const handleDismiss = () => {
    snooze();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
        >
          {/* Backdrop — tap to dismiss */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleDismiss} />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-sm bg-axis-dark text-white rounded-t-3xl sm:rounded-3xl border border-white/10 px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center gap-3 mb-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-axis-accent/15 flex items-center justify-center shrink-0">
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                  <line x1="4" y1="20" x2="36" y2="20" stroke="#CDFF4F" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="20" y1="4" x2="20" y2="36" stroke="#CDFF4F" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="20" cy="20" r="3.5" fill="#CDFF4F"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-base leading-tight">{t("pwa.title")}</p>
                <p className="text-xs text-white/50 mt-0.5">{t("pwa.sub")}</p>
              </div>
              <button onClick={handleDismiss} className="ml-auto text-white/30 hover:text-white/70 transition-colors shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {platform === "android" && (
              <button
                onClick={handleAndroidInstall}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-axis-accent text-axis-text1 px-5 py-3.5 rounded-xl hover:bg-axis-accent/90 active:scale-[0.98] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {t("pwa.install")}
              </button>
            )}

            {platform === "ios" && (
              <div className="space-y-3">
                {[
                  { icon: "⬆️", text: t("pwa.ios.step1") },
                  { icon: "➕", text: t("pwa.ios.step2") },
                  { icon: "✅", text: t("pwa.ios.step3") },
                ].map((step) => (
                  <div key={step.text} className="flex items-center gap-3 bg-white/[0.06] rounded-xl px-4 py-3">
                    <span className="text-lg shrink-0">{step.icon}</span>
                    <span className="text-sm text-white/80">{step.text}</span>
                  </div>
                ))}
                <button
                  onClick={handleDismiss}
                  className="w-full mt-1 text-xs text-white/40 hover:text-white/70 transition-colors py-2"
                >
                  {t("pwa.later")}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
