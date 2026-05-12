"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ForgeNavbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all"
      style={{
        backgroundColor: scrolled ? "rgba(10, 10, 11, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--forge-edge)" : "1px solid transparent",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[9px]"
            style={{
              backgroundColor: "var(--forge-iron)",
              border: "1px solid var(--forge-gold)",
              color: "var(--forge-gold)",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            L
          </span>
          <span
            className="text-[15px] tracking-wider"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--forge-bone)", fontWeight: 500 }}
          >
            lomoura
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium transition-colors hover:opacity-80 sm:inline-block"
            style={{ color: "var(--forge-ash)" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-[9px] px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
          >
            Take the vow
          </Link>
        </div>
      </nav>
    </header>
  );
}
