import Link from "next/link";

export function CTA() {
  return (
    <section className="py-20 md:py-28 bg-axis-dark text-white border-t border-white/[0.04]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Big number */}
        <div className="inline-flex items-center gap-3 mb-6">
          <span className="text-6xl md:text-7xl font-bold text-axis-accent font-mono">6</span>
          <span className="text-left text-sm text-white/50 leading-tight">
            apps replaced<br/>by one system
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Your system is waiting.
        </h2>
        <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          Stop switching between apps. Start every morning knowing exactly what to do.
          AXIS is free — no credit card, no trial, no catch.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center text-base font-semibold bg-axis-accent text-axis-text1 px-10 py-4 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] shadow-lg shadow-axis-accent/20"
        >
          Get Started — Free
          <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        <p className="text-xs text-white/30 mt-4 font-mono">No credit card required</p>
      </div>
    </section>
  );
}
