import { IconCommand, IconTarget, IconStreak } from "@/components/icons";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Set up in minutes",
      description: "Tell AXIS who you are, set your daily missions, pick your habits, and connect your public profile. You're live.",
      visual: <IconCommand size={32} className="text-axis-text2" />,
    },
    {
      step: "02",
      title: "Run your day with clarity",
      description: "Every morning, your Command Center shows exactly what to focus on. Complete missions, log habits, track revenue.",
      visual: <IconTarget size={32} className="text-axis-text2" />,
    },
    {
      step: "03",
      title: "Build accountability",
      description: "Invite a partner, share your Prove It profile, screenshot your daily scorecard. Let the system hold you accountable.",
      visual: <IconStreak size={32} className="text-axis-text2" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">How it works</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            From zero to <span className="axis-highlight">full system</span> in one session
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className="group relative flex flex-col md:flex-row items-start gap-6 md:gap-10 p-8 border border-axis-border rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 bg-axis-bg"
            >
              {/* Step number */}
              <div className="flex-shrink-0 w-14 h-14 bg-axis-text1 text-white rounded-2xl flex items-center justify-center">
                <span className="text-lg font-bold font-mono">{item.step}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-base text-axis-text2 leading-relaxed max-w-xl">{item.description}</p>
              </div>

              {/* Visual accent */}
              <div className="hidden md:flex items-center justify-center w-16 h-16 text-3xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">
                {item.visual}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -bottom-4 left-[2.3rem] w-px h-8 bg-axis-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
