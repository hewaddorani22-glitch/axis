import { IconEdit, IconFocus, IconRevenue } from "@/components/icons";

/**
 * Use Cases section: replaces fake testimonials.
 * Shows real personas and what they track, without fabricated quotes.
 * Swap this out for real testimonials once you have beta users.
 */
export function Testimonials() {
  const useCases = [
    {
      role: "Freelance Designer",
      avatar: <IconEdit size={24} className="text-axis-accent" />,
      problem: "Tracking clients in DMs, revenue in Notes, tasks in Notion.",
      outcome: "One system for revenue, missions, and habits. Less switching, more doing.",
      stats: ["Revenue tracking", "Daily missions", "Habit streaks"],
    },
    {
      role: "E-Commerce Founder",
      avatar: <IconRevenue size={24} className="text-emerald-400" />,
      problem: "Sales spreadsheets, a task app, and a separate goal tracker: none connected.",
      outcome: "MTD revenue visible at a glance. Partner accountability every morning.",
      stats: ["Multiple streams", "Goal deadlines", "Partner nudges"],
    },
    {
      role: "Content Creator",
      avatar: <IconFocus size={24} className="text-violet-400" />,
      problem: "No system for posting consistency, collab tracking, or income visibility.",
      outcome: "Daily posting habit tracked. Prove It Mode shared on TikTok every morning.",
      stats: ["Habit streaks", "Prove It profile", "Focus Score"],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-axis-dark text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-3">
            Built for
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            One system. <span className="text-axis-accent">Every type of builder.</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Whether you freelance, run a store, or grow an audience: lomoura adapts to how you work.
          </p>
        </div>

        {/* Use case cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {useCases.map((uc) => (
            <div
              key={uc.role}
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {uc.avatar}
                </div>
                <p className="text-sm font-semibold text-white">{uc.role}</p>
              </div>

              {/* Problem / Outcome */}
              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">Before</p>
                  <p className="text-sm text-white/50 leading-relaxed">{uc.problem}</p>
                </div>
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] font-mono text-axis-accent uppercase tracking-wider mb-1">With lomoura</p>
                  <p className="text-sm text-white/80 leading-relaxed">{uc.outcome}</p>
                </div>
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2">
                {uc.stats.map((tag) => (
                  <span key={tag} className="text-[10px] font-mono text-white/40 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-white/40 mb-4">Public beta: free to join, no credit card needed.</p>
          <a
            href="/signup"
            className="inline-flex items-center text-sm font-semibold bg-axis-accent text-axis-dark px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all"
          >
            Start Free
          </a>
        </div>
      </div>
    </section>
  );
}
