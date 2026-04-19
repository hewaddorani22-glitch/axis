import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-axis-bg/80 backdrop-blur-xl border-b border-axis-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <line x1="4" y1="20" x2="36" y2="20" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="20" y1="4" x2="20" y2="36" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="3.5" fill="#0B0B0F"/>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">AXIS</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-axis-text2 hover:text-axis-text1 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-axis-text2 hover:text-axis-text1 transition-colors">How it works</a>
          <a href="#pricing" className="text-sm text-axis-text2 hover:text-axis-text1 transition-colors">Pricing</a>
          <a href="#faq" className="text-sm text-axis-text2 hover:text-axis-text1 transition-colors">FAQ</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-axis-text2 hover:text-axis-text1 transition-colors hidden sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center text-sm font-medium bg-axis-text1 text-white px-5 py-2.5 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
