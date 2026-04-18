import { IconCommand, IconTarget, IconRevenue, IconHabits, IconGoals, IconPartners } from "@/components/icons";

export function Features() {
  const features = [
    {
      icon: <IconCommand size={24} />,
      title: "Command Center",
      description: "Your morning briefing. See what matters today — revenue, missions, streaks, and focus score in one glance.",
      badge: "Dashboard",
    },
    {
      icon: <IconTarget size={24} />,
      title: "Mission Control",
      description: "Daily missions with priorities and categories. Not a to-do list — a system that tells you what to focus on.",
      badge: "Tasks",
    },
    {
      icon: <IconRevenue size={24} />,
      title: "Revenue Tracker",
      description: "Track every income stream. See your MTD revenue, monthly trends, and stream breakdown at a glance.",
      badge: "Money",
    },
    {
      icon: <IconHabits size={24} />,
      title: "Daily Systems",
      description: "Build habits that stick. Streak counters, weekly heatmaps, and one-tap logging make it effortless.",
      badge: "Habits",
    },
    {
      icon: <IconGoals size={24} />,
      title: "Goals",
      description: "Set targets with deadlines. Track your milestones and see your progress at a glance.",
      badge: "Goals",
    },
    {
      icon: <IconPartners size={24} />,
      title: "Accountability",
      description: "Invite partners, compare progress, send nudges. Social pressure that actually works.",
      badge: "Social",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Six modules. <span className="axis-highlight">Zero clutter.</span>
          </h2>
          <p className="text-lg text-axis-text2 max-w-xl mx-auto">
            Everything you need to run your life — nothing you don&apos;t.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white border border-axis-border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-axis-border2"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-axis-bg rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <span className="text-[10px] font-mono font-medium text-axis-text3 uppercase tracking-wider bg-axis-bg px-2 py-1 rounded-md">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-axis-text2 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
