"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";

export function Hero() {
  const { t } = useLocale();
  const [personaIndex, setPersonaIndex] = useState(0);

  const personas = [
    { name: t("hero.persona.hustler"), line: t("hero.persona.hustler.line") },
    { name: t("hero.persona.climber"), line: t("hero.persona.climber.line") },
    { name: t("hero.persona.creator"), line: t("hero.persona.creator.line") },
    { name: t("hero.persona.builder"), line: t("hero.persona.builder.line") },
  ];

  useEffect(() => {
    const id = window.setInterval(() => {
      setPersonaIndex((i) => (i + 1) % personas.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [personas.length]);

  const persona = personas[personaIndex];

  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-32 md:pt-40 md:pb-24">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#0B0B0F 1px, transparent 1px), linear-gradient(90deg, #0B0B0F 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-axis-border rounded-full px-4 py-1.5 mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-axis-accent2 rounded-full animate-pulse-soft" />
          <span className="text-xs font-mono font-medium text-axis-text2">{t("hero.badge")}</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-slide-up text-balance">
          {t("hero.title.a")}{" "}
          <span className="axis-highlight">{t("hero.title.b")}</span>
        </h1>

        {/* Subtext */}
        <p
          className="text-base md:text-xl text-axis-text2 max-w-2xl mx-auto mb-8 leading-relaxed animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {t("hero.sub")}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            href="/start"
            onClick={() => trackEvent("hero_cta_clicked", { location: "hero" })}
            className="inline-flex w-full items-center justify-center text-base font-semibold bg-axis-text1 text-white px-8 py-4 rounded-xl hover:bg-axis-text1/90 transition-all active:scale-[0.98] shadow-lg shadow-axis-text1/10 sm:w-auto"
          >
            {t("hero.cta")}
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex w-full items-center justify-center text-base font-medium text-axis-text2 hover:text-axis-text1 transition-colors px-6 py-4 sm:w-auto"
          >
            {t("hero.secondary")}
            <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>

        {/* Trust line */}
        <p className="text-sm font-mono text-axis-text3 mb-3 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          {t("hero.trust")}
        </p>

        {/* Live persona ticker (social proof, broad audience) */}
        <div
          className="text-xs text-axis-text3 mb-12 animate-slide-up min-h-[1.5em]"
          style={{ animationDelay: "0.28s" }}
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-axis-text2">{persona.name}</span>
            <span>·</span>
            <span>{persona.line}</span>
          </span>
        </div>

        {/* Mobile-first phone mockup */}
        <div className="relative mx-auto max-w-[340px] sm:max-w-md animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="relative mx-auto rounded-[2.6rem] border-[10px] border-axis-text1 bg-axis-text1 shadow-2xl shadow-axis-text1/30">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-28 h-6 bg-axis-text1 rounded-b-2xl" />
            <div className="rounded-[1.9rem] overflow-hidden bg-axis-dark text-white">
              <div className="px-5 pt-8 pb-5">
                <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                  {t("preview.briefing")}
                </p>
                <h3 className="text-base font-semibold text-white">{t("preview.morning")}</h3>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-2.5">
                    <p className="text-[9px] font-mono text-white/40 uppercase">{t("preview.streak")}</p>
                    <p className="text-base font-bold text-orange-400">17 {t("preview.streak.units")}</p>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-2.5">
                    <p className="text-[9px] font-mono text-white/40 uppercase">{t("preview.completion")}</p>
                    <p className="text-base font-bold text-emerald-400">3/4</p>
                  </div>
                </div>

                <div className="mt-3 bg-white/[0.04] border border-white/[0.05] rounded-lg p-3">
                  <p className="text-[9px] font-mono text-white/40 uppercase mb-2">
                    {t("preview.mission.today")}
                  </p>
                  {[
                    { title: persona.line, done: false, hi: true },
                    { title: "30 min focus", done: true, hi: false },
                    { title: "Workout 20 min", done: true, hi: false },
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1.5">
                      <div
                        className={`w-3.5 h-3.5 rounded border ${
                          m.done ? "bg-axis-accent border-axis-accent" : "border-white/25"
                        } flex items-center justify-center shrink-0`}
                      >
                        {m.done && (
                          <svg className="w-2.5 h-2.5 text-axis-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs flex-1 truncate ${m.done ? "text-white/30 line-through" : "text-white/85"}`}>
                        {m.title}
                      </span>
                      {m.hi && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                          {t("preview.mission.priority.high")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom proof line */}
          <p className="mt-6 text-xs text-axis-text3">{t("hero.proof")}</p>
        </div>
      </div>
    </section>
  );
}
