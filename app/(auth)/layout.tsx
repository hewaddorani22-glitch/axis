import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 sm:py-12"
      style={{ backgroundColor: "var(--forge-void)", color: "var(--forge-bone)" }}
    >
      <Link href="/" className="mb-10 flex items-center gap-2.5">
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
          className="tracking-wider"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "var(--forge-bone)",
            fontWeight: 500,
          }}
        >
          lomoura
        </span>
      </Link>

      <div className="w-full max-w-[420px]">{children}</div>

      <p
        className="mt-10 font-mono text-[10px] uppercase tracking-[0.24em]"
        style={{ color: "var(--forge-shadow)" }}
      >
        © {new Date().getFullYear()} lomoura — the forge
      </p>
    </div>
  );
}
