"use client";

declare global {
  interface Window {
    ttq?: {
      load?: (id: string) => void;
      page?: () => void;
      track?: (event: string, params?: Record<string, unknown>) => void;
      identify?: (params: Record<string, unknown>) => void;
      instance?: (id: string) => unknown;
    };
    TiktokAnalyticsObject?: string;
  }
}

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ttclid",
  "tt_source",
] as const;

export type UtmRecord = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  capturedAt?: number;
  landingPath?: string;
};

const UTM_STORAGE_KEY = "lomoura-utm";

export function getTikTokPixelId(): string {
  return (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "").trim();
}

export function captureUtmsFromUrl(search: URLSearchParams, pathname?: string): UtmRecord | null {
  const captured: UtmRecord = {};
  let any = false;
  for (const key of UTM_KEYS) {
    const value = search.get(key);
    if (value) {
      captured[key] = value;
      any = true;
    }
  }
  if (!any) return null;
  captured.capturedAt = Date.now();
  if (pathname) captured.landingPath = pathname;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
    } catch {
      // ignore
    }
  }
  return captured;
}

export function getStoredUtms(): UtmRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UtmRecord;
  } catch {
    return null;
  }
}

export function trackTikTokEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!window.ttq || typeof window.ttq.track !== "function") return;
  try {
    window.ttq.track(event, params);
  } catch {
    // ignore
  }
}

export function trackTikTokPageView() {
  if (typeof window === "undefined") return;
  if (!window.ttq || typeof window.ttq.page !== "function") return;
  try {
    window.ttq.page();
  } catch {
    // ignore
  }
}
