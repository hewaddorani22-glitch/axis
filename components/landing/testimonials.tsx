"use client";

import { IconRevenue, IconFocus, IconEdit, IconTarget } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";

/**
 * Use Cases section reframed for the 4 target segments:
 * Hustler / Climber / Creator / Builder.
 */
export function Testimonials() {
  const { t } = useLocale();

  const useCases = [
    {
      role: t("uc.hustler.role"),
      avatar: <IconRevenue size={24} className="text-axis-accent" />,
      problem: t("uc.hustler.before"),
      outcome: t("uc.hustler.after"),
      stats: [t("uc.hustler.tag1"), t("uc.hustler.tag2"), t("uc.hustler.tag3")],
    },
    {
      role: t("uc.climber.role"),
      avatar: <IconTarget size={24} className="text-emerald-400" />,
      problem: t("uc.climber.before"),
      outcome: t("uc.climber.after"),
      stats: [t("uc.climber.tag1"), t("uc.climber.tag2"), t("uc.climber.tag3")],
    },
    {
      role: t("uc.creator.role"),
      avatar: <IconFocus size={24} className="text-violet-400" />,
      problem: t("uc.creator.before"),
      outcome: t("uc.creator.after"),
      stats: [t("uc.creator.tag1"), t("uc.creator.tag2"), t("uc.creator.tag3")],
    },
    {
      role: t("uc.builder.role"),
      avatar: <IconEdit size={24} className="text-sky-400" />,
      problem: t("uc.builder.before"),
      outcome: t("uc.builder.after"),
      stats: [t("uc.builder.tag1"), t("uc.builder.tag2"), t("uc.builder.tag3")],
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-axis-dark text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-3">
            {t("uc.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("uc.title.a")} <span className="text-axis-accent">{t("uc.title.b")}</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">{t("uc.sub")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {useCases.map((uc) => (
            <div
              key={uc.role}
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {uc.avatar}
                </div>
                <p className="text-sm font-semibold text-white">{uc.role}</p>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">{t("uc.before")}</p>
                  <p className="text-sm text-white/50 leading-relaxed">{uc.problem}</p>
                </div>
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] font-mono text-axis-accent uppercase tracking-wider mb-1">{t("uc.with")}</p>
                  <p className="text-sm text-white/80 leading-relaxed">{uc.outcome}</p>
                </div>
              </div>

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

        <div className="text-center mt-12">
          <p className="text-sm text-white/40 mb-4">{t("uc.cta.line")}</p>
          <a
            href="/start"
            className="inline-flex items-center text-sm font-semibold bg-axis-accent text-axis-dark px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all"
          >
            {t("uc.cta.button")}
          </a>
        </div>
      </div>
    </section>
  );
}
