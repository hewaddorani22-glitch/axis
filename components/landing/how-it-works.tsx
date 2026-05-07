"use client";

import { IconCommand, IconTarget, IconStreak } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";

export function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    {
      step: "01",
      title: t("how.step1.title"),
      description: t("how.step1.desc"),
      visual: <IconCommand size={32} className="text-axis-text2" />,
    },
    {
      step: "02",
      title: t("how.step2.title"),
      description: t("how.step2.desc"),
      visual: <IconTarget size={32} className="text-axis-text2" />,
    },
    {
      step: "03",
      title: t("how.step3.title"),
      description: t("how.step3.desc"),
      visual: <IconStreak size={32} className="text-axis-text2" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">
            {t("how.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("how.title.a")} <span className="axis-highlight">{t("how.title.b")}</span> {t("how.title.c")}
          </h2>
        </div>

        <div className="space-y-6">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className="group relative flex flex-col md:flex-row items-start gap-6 md:gap-10 p-8 border border-axis-border rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 bg-axis-bg"
            >
              <div className="flex-shrink-0 w-14 h-14 bg-axis-text1 text-white rounded-2xl flex items-center justify-center">
                <span className="text-lg font-bold font-mono">{item.step}</span>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-base text-axis-text2 leading-relaxed max-w-xl">{item.description}</p>
              </div>

              <div className="hidden md:flex items-center justify-center w-16 h-16 text-3xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">
                {item.visual}
              </div>

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
