import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPaletteProvider } from "@/components/app/command-palette";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/provider";
import { detectLocaleFromHeader, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/dict";

export const metadata: Metadata = {
  metadataBase: new URL("https://lomoura.com"),
  applicationName: "lomoura",
  title: {
    default: "lomoura | Missions, Habits, Revenue, Goals",
    template: "%s | lomoura",
  },
  description:
    "lomoura is a focused operating system for daily missions, habit streaks, revenue tracking, goals, public accountability, and partner check-ins.",
  keywords: [
    "lomoura",
    "productivity app",
    "business OS",
    "daily missions",
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
    title: "lomoura | Missions, Habits, Revenue, Goals",
    description:
      "Run your day from one clean system: missions, habit streaks, revenue, goals, accountability partners, and public proof.",
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
    title: "lomoura | Missions, Habits, Revenue, Goals",
    description:
      "Run your day from one clean system: missions, habit streaks, revenue, goals, accountability partners, and public proof.",
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
            <CommandPaletteProvider>{children}</CommandPaletteProvider>
            <Toaster position="bottom-right" theme="system" />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
