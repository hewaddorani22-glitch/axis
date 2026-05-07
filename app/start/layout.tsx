import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start — lomoura",
  description: "Build your personal lomoura system in 15 seconds.",
  robots: { index: false, follow: false },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-axis-bg overflow-x-hidden">
      {children}
    </div>
  );
}
