export function cleanEnvValue(value: string | undefined | null): string {
  return (value ?? "").replace(/\\n/g, "").replace(/\n/g, "").trim();
}

export function normalizeUrl(value: string | undefined | null): string {
  let url = cleanEnvValue(value);
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, "");
}

export function getSupabaseUrl(): string {
  return normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey(): string {
  return cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStripeSecretKey(): string {
  return cleanEnvValue(process.env.STRIPE_SECRET_KEY);
}

export function getStripePriceId(): string {
  return cleanEnvValue(process.env.STRIPE_PRO_PRICE_ID);
}

export function getStripeWebhookSecret(): string {
  return cleanEnvValue(process.env.STRIPE_WEBHOOK_SECRET);
}

export function getCronSecret(): string {
  return cleanEnvValue(process.env.CRON_SECRET);
}

export function getResendApiKey(): string {
  return cleanEnvValue(process.env.RESEND_API_KEY);
}

export function getFromEmail(): string {
  return cleanEnvValue(process.env.RESEND_FROM_EMAIL) || "lomoura <noreply@lomoura.com>";
}

export function getAppUrl(fallbackOrigin?: string | null): string {
  const configured = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  const productionUrl = normalizeUrl(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
  if (productionUrl) return productionUrl;

  const vercelUrl = normalizeUrl(process.env.NEXT_PUBLIC_VERCEL_URL);
  if (vercelUrl) return vercelUrl;

  const fallback = normalizeUrl(fallbackOrigin);
  if (fallback && !fallback.includes("localhost")) return fallback;

  return "https://lomoura.com";
}

export function getBrowserAppUrl(): string {
  const configured = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  return getAppUrl();
}

export function buildAppUrl(path: string, fallbackOrigin?: string | null): string {
  const base = getAppUrl(fallbackOrigin);
  return new URL(path, `${base}/`).toString();
}
