import Link from "next/link";
import { IconUser, IconStreak } from "@/components/icons";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#0B0B0F 1px, transparent 1px), linear-gradient(90deg, #0B0B0F 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-axis-border rounded-full px-4 py-1.5 mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-axis-accent2 rounded-full animate-pulse-soft" />
          <span className="text-xs font-mono font-medium text-axis-text2">Now in public beta</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-slide-up text-balance">
          Track revenue, missions, and habits in{" "}
          <span className="axis-highlight">one system</span>.
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-axis-text2 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Built for freelancers, founders, and creators who want to see exactly{" "}
          <span className="text-axis-text1 font-medium">what they earned, what they shipped, and what's next</span>
          {" "}— every single day.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/signup"
            className="inline-flex items-center text-base font-semibold bg-axis-text1 text-white px-8 py-4 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] shadow-lg shadow-axis-text1/10"
          >
            Get Started — Free
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center text-base font-medium text-axis-text2 hover:text-axis-text1 transition-colors px-6 py-4"
          >
            See how it works
            <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>

        {/* Trust line */}
        <p className="text-sm font-mono text-axis-text3 mb-16 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          No credit card · Setup in 90 seconds · Free forever plan
        </p>

        {/* App preview mockup */}
        <div className="relative max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="bg-axis-dark rounded-2xl border border-white/[0.08] shadow-2xl shadow-axis-text1/20 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 flex justify-center">
                <div className="bg-white/[0.06] rounded-lg px-4 py-1">
                  <span className="text-[11px] font-mono text-white/30">axis.app/dashboard</span>
                </div>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-axis-accent/20 flex items-center justify-center">
                  <IconUser size={20} className="text-axis-accent" />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-mono">COMMAND CENTER</p>
                  <h3 className="text-white text-lg font-semibold">Good morning, King</h3>
                </div>
              </div>

              {/* Mock stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "MTD Revenue", value: "$12,840", change: "+18%", color: "text-axis-accent" },
                  { label: "Missions Done", value: "24/28", change: "86%", color: "text-emerald-400" },
                  { label: "Streak", value: "17 days", change: <span className="flex items-center gap-1"><IconStreak size={12} className="text-orange-400" /> Best</span>, color: "text-orange-400" },
                  { label: "Focus Score", value: "87", change: "A", color: "text-axis-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-[10px] font-mono text-white/40 uppercase mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs font-mono text-white/30 mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>

              {/* Mock mission list */}
              <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-4">
                <p className="text-[10px] font-mono text-white/40 uppercase mb-3">TODAY&apos;S MISSIONS</p>
                {[
                  { title: "Review Q2 strategy deck", done: true, priority: "high" },
                  { title: "Record TikTok batch content", done: true, priority: "med" },
                  { title: "Ship landing page v2", done: false, priority: "high" },
                ].map((m) => (
                  <div key={m.title} className="flex items-center gap-3 py-2">
                    <div className={`w-4.5 h-4.5 rounded border ${m.done ? 'bg-axis-accent border-axis-accent' : 'border-white/20'} flex items-center justify-center`}>
                      {m.done && <svg className="w-3 h-3 text-axis-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-sm ${m.done ? 'text-white/30 line-through' : 'text-white/80'}`}>{m.title}</span>
                    <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded ${m.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.06] text-white/30'}`}>
                      {m.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
