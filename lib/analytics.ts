"use client";

type AnalyticsProps = Record<string, unknown>;

const ANON_ID_KEY = "lomoura-anon-id";
const SESSION_ID_KEY = "lomoura-session-id";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readOrCreate(storage: Storage | null, key: string) {
  if (!storage) return createId();

  try {
    const existing = storage.getItem(key);
    if (existing) return existing;

    const next = createId();
    storage.setItem(key, next);
    return next;
  } catch {
    return createId();
  }
}

function getAnonId() {
  if (typeof window === "undefined") return null;
  return readOrCreate(window.localStorage ?? null, ANON_ID_KEY);
}

function getSessionId() {
  if (typeof window === "undefined") return null;
  return readOrCreate(window.sessionStorage ?? null, SESSION_ID_KEY);
}

export function trackEvent(event: string, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    event,
    props,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    anonId: getAnonId(),
    sessionId: getSessionId(),
  };

  try {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics must never block product flows.
  }
}
