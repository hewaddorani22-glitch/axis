import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPaletteProvider } from "@/components/app/command-palette";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AXIS — Your Business OS",
  description:
    "One system for everything you do — missions, revenue, habits, goals. Replace 6+ apps with one clean dashboard.",
  keywords: ["productivity", "business OS", "habit tracker", "revenue tracker", "mission control", "goals"],
  openGraph: {
    title: "AXIS — Your Business OS",
    description: "One system for everything you do — missions, revenue, habits, goals.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-display antialiased">
        <ThemeProvider>
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
          <Toaster position="bottom-right" theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
