export function Testimonials() {
  const testimonials = [
    {
      name: "Marcus Chen",
      role: "Freelance Designer",
      avatar: "MC",
      quote: "I was using Notion, Todoist, and a spreadsheet for revenue. AXIS replaced all three. My mornings went from chaos to clarity.",
      stat: "23-day streak",
    },
    {
      name: "Sarah Okafor",
      role: "E-Commerce Founder",
      avatar: "SO",
      quote: "The accountability partner feature is insane. My business partner and I push each other daily. Revenue is up 40% since we started.",
      stat: "$28K MTD",
    },
    {
      name: "James Rivera",
      role: "Content Creator",
      avatar: "JR",
      quote: "Prove It Mode is genius. I screenshot my scorecard every morning for TikTok. It keeps me honest and my audience loves it.",
      stat: "Grade: A+",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-axis-dark text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-3">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            People who run their life <span className="text-axis-accent">the AXIS way</span>
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-200"
            >
              {/* Quote */}
              <p className="text-sm text-white/70 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Divider */}
              <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-axis-accent/20 flex items-center justify-center">
                    <span className="text-xs font-bold font-mono text-axis-accent">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
                {/* Stat */}
                <span className="text-xs font-mono font-medium text-axis-accent bg-axis-accent/10 px-2.5 py-1 rounded-lg">
                  {t.stat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
