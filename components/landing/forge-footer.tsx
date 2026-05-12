import Link from "next/link";

export function ForgeFooter() {
  return (
    <footer
      className="mt-32 border-t pb-12 pt-16"
      style={{ borderColor: "var(--forge-edge)" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                style={{
                  backgroundColor: "var(--forge-iron)",
                  border: "1px solid var(--forge-gold)",
                  color: "var(--forge-gold)",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                L
              </span>
              <span
                className="text-base tracking-wider"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--forge-bone)", fontWeight: 500 }}
              >
                lomoura
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              A 90-day transformation system for men who want to forge body, mind, and intellect.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p
                className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--forge-shadow)" }}
              >
                The Forge
              </p>
              <ul className="space-y-2" style={{ color: "var(--forge-ash)" }}>
                <li><Link href="/signup" className="hover:text-[var(--forge-bone)]">Take the vow</Link></li>
                <li><Link href="/login" className="hover:text-[var(--forge-bone)]">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p
                className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--forge-shadow)" }}
              >
                Legal
              </p>
              <ul className="space-y-2" style={{ color: "var(--forge-ash)" }}>
                <li><Link href="/privacy" className="hover:text-[var(--forge-bone)]">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--forge-bone)]">Terms</Link></li>
                <li><Link href="/support" className="hover:text-[var(--forge-bone)]">Support</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="mt-12 border-t pt-8 text-xs"
          style={{ borderColor: "var(--forge-edge)", color: "var(--forge-shadow)" }}
        >
          © {new Date().getFullYear()} lomoura — the forge. Built quietly.
        </div>
      </div>
    </footer>
  );
}
