import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPaletteProvider } from "@/components/app/command-palette";
import { PageTracker } from "@/components/tracking/page-tracker";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/provider";
import { detectLocaleFromHeader, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/dict";

export const metadata: Metadata = {
  metadataBase: new URL("https://lomoura.com"),
  applicationName: "lomoura",
  title: {
    default: "lomoura | Tasks, Habits, Goals, Revenue",
    template: "%s | lomoura",
  },
  description:
    "lomoura helps you know what to do today with tasks, habits, goals, revenue tracking, and simple daily accountability.",
  keywords: [
    "lomoura",
    "productivity app",
    "daily planner",
    "task planner",
    "habit tracker",
    "revenue tracker",
    "goal tracker",
    "accountability",
  ],
  authors: [{ name: "lomoura" }],
  creator: "lomoura",
  publisher: "lomoura",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/lomoura-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "lomoura | Tasks, Habits, Goals, Revenue",
    description:
      "Know what to do today in under a minute. Tasks, habits, goals, revenue, and daily accountability in one app.",
    url: "https://lomoura.com",
    siteName: "lomoura",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "lomoura dashboard preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lomoura | Tasks, Habits, Goals, Revenue",
    description:
      "Know what to do today in under a minute. Tasks, habits, goals, revenue, and daily accountability in one app.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "lomoura",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0B0F",
};

function resolveInitialLocale(): Locale {
  const cookieStore = cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = headers().get("accept-language");
  return detectLocaleFromHeader(accept);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = resolveInitialLocale();
  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className="font-display antialiased">
        <LocaleProvider initialLocale={initialLocale}>
          <ThemeProvider>
            <CommandPaletteProvider>
              <PageTracker />
              {children}
            </CommandPaletteProvider>
            <Toaster position="bottom-right" theme="system" />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
