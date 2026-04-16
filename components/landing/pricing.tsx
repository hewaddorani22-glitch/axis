import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Start free. <span className="axis-highlight">Upgrade when ready.</span>
          </h2>
          <p className="text-lg text-axis-text2">No credit card required. No trial expiry.</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-axis-border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="mb-6">
              <span className="text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider">Free</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-axis-text3 text-sm">/forever</span>
              </div>
              <p className="text-sm text-axis-text2 mt-2">Everything you need to get started.</p>
            </div>

            <Link
              href="/signup"
              className="w-full flex items-center justify-center text-sm font-medium bg-axis-bg text-axis-text1 border border-axis-border px-6 py-3 rounded-xl hover:border-axis-border2 hover:shadow-sm transition-all mb-8"
            >
              Get Started Free
            </Link>

            <ul className="space-y-3">
              {[
                "5 daily missions",
                "3 habit trackers",
                "1 revenue stream",
                "2 goals",
                "Command Center",
                "Prove It profile",
                "1 accountability partner",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-axis-text2">
                  <svg className="w-4 h-4 text-axis-text3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-axis-text1 text-white rounded-2xl p-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-axis-accent text-axis-text1 text-xs font-mono font-bold px-4 py-1.5 rounded-full">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6">
              <span className="text-xs font-mono font-semibold text-white/50 uppercase tracking-wider">Pro</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-white/50 text-sm">/month</span>
              </div>
              <p className="text-sm text-white/60 mt-2">For those who are serious about their system.</p>
            </div>

            <Link
              href="/signup"
              className="w-full flex items-center justify-center text-sm font-semibold bg-axis-accent text-axis-text1 px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] mb-8"
            >
              Start Pro — $9/mo
            </Link>

            <ul className="space-y-3">
              {[
                "Unlimited missions",
                "Unlimited habits",
                "Unlimited revenue streams",
                "Unlimited goals",
                "AI Daily Briefing",
                "Focus Score history",
                "Weekly Review system",
                "Streak Freeze (1x/month)",
                "Unlimited partners",
                "CSV data export",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                  <svg className="w-4 h-4 text-axis-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
