import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start — lomoura",
  description: "Answer 2 quick questions and preview your lomoura dashboard in under 30 seconds.",
  robots: { index: false, follow: false },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-axis-bg overflow-x-hidden">
      {children}
    </div>
  );
}
