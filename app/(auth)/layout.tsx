import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-x-hidden bg-axis-bg px-4 py-10 sm:px-6 sm:py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <line x1="4" y1="20" x2="36" y2="20" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="20" y1="4" x2="20" y2="36" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="20" cy="20" r="3.5" fill="#0B0B0F"/>
        </svg>
        <span className="text-lg font-bold tracking-tight">lomoura</span>
      </Link>

      {/* Auth form container */}
      <div className="w-full max-w-[420px]">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-axis-text3">
        © 2026 lomoura. All rights reserved.
      </p>
    </div>
  );
}
