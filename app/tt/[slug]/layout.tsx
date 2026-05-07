import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "lomoura",
  robots: { index: false, follow: false },
};

export default function TtLayout({ children }: { children: React.ReactNode }) {
  return children;
}
