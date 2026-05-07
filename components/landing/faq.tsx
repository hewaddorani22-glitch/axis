"use client";

import { useState } from "react";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";
import { useLocale } from "@/lib/i18n/provider";

export function FAQ() {
  const { t } = useLocale();
  const [open, setOpen] = useState<number | null>(0);

  const FAQS = [
    { q: t("faq.q1.q"), a: t("faq.q1.a") },
    { q: t("faq.q2.q"), a: t("faq.q2.a") },
    { q: t("faq.q3.q"), a: t("faq.q3.a") },
    { q: t("faq.q4.q"), a: t("faq.q4.a") },
    { q: t("faq.q5.q"), a: t("faq.q5.a") },
    { q: t("faq.q6.q"), a: t("faq.q6.a") },
    { q: t("faq.q7.q"), a: t("faq.q7.a") },
    { q: t("faq.q8.q"), a: t("faq.q8.a") },
    { q: t("faq.q9.q"), a: t("faq.q9.a") },
  ];

  const intro = t("faq.intro").split("{email}");

  return (
    <section id="faq" className="py-20 md:py-28 bg-white border-t border-axis-border">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-axis-text3">{t("faq.tag")}</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-3">{t("faq.title")}</h2>
          <p className="text-lg text-axis-text2">
            {intro[0]}
            <a href={SUPPORT_MAILTO} className="text-axis-text1 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            {intro[1] ?? ""}
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-axis-border rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-axis-bg/50 transition-colors"
              >
                <span className="text-base font-semibold text-axis-text1">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-axis-text3 flex-shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1">
                  <p className="text-sm text-axis-text2 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
