"use client";

import { IconCommand, IconTarget, IconRevenue, IconHabits, IconGoals, IconPartners } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";

export function Features() {
  const { t } = useLocale();

  const features = [
    {
      icon: <IconCommand size={24} />,
      title: t("feat.cmd.title"),
      description: t("feat.cmd.desc"),
      badge: t("feat.cmd.badge"),
    },
    {
      icon: <IconTarget size={24} />,
      title: t("feat.miss.title"),
      description: t("feat.miss.desc"),
      badge: t("feat.miss.badge"),
    },
    {
      icon: <IconRevenue size={24} />,
      title: t("feat.rev.title"),
      description: t("feat.rev.desc"),
      badge: t("feat.rev.badge"),
    },
    {
      icon: <IconHabits size={24} />,
      title: t("feat.hab.title"),
      description: t("feat.hab.desc"),
      badge: t("feat.hab.badge"),
    },
    {
      icon: <IconGoals size={24} />,
      title: t("feat.goal.title"),
      description: t("feat.goal.desc"),
      badge: t("feat.goal.badge"),
    },
    {
      icon: <IconPartners size={24} />,
      title: t("feat.acc.title"),
      description: t("feat.acc.desc"),
      badge: t("feat.acc.badge"),
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">
            {t("feat.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("feat.title.a")} <span className="axis-highlight">{t("feat.title.b")}</span>
          </h2>
          <p className="text-lg text-axis-text2 max-w-xl mx-auto">{t("feat.sub")}</p>
        </div>

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
