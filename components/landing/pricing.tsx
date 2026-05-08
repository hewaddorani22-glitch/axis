"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/provider";
import { trackEvent } from "@/lib/analytics";

export function Pricing() {
  const { t } = useLocale();
  const router = useRouter();
  const [yearly, setYearly] = useState(true);
  const [proLoading, setProLoading] = useState(false);

  const handleProCta = async () => {
    if (proLoading) return;
    trackEvent("pro_cta_clicked", { source: "pricing", plan: yearly ? "yearly" : "monthly" });
    setProLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: yearly ? "yearly" : "monthly" }),
      });
      if (res.status === 401) {
        router.push("/signup?next=upgrade");
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      router.push("/signup?next=upgrade");
    } catch {
      router.push("/signup?next=upgrade");
    } finally {
      setProLoading(false);
    }
  };

  const proAmount = yearly ? t("price.pro.amount.yearly") : t("price.pro.amount.monthly");
  const proUnit = yearly ? t("price.pro.unit.yearly") : t("price.pro.unit.monthly");

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">
            {t("price.tag")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("price.title.a")} <span className="axis-highlight">{t("price.title.b")}</span>
          </h2>
          <p className="text-lg text-axis-text2">{t("price.sub")}</p>
        </div>

        {/* Monthly / Yearly toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-axis-bg border border-axis-border rounded-full p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                !yearly ? "bg-white shadow-sm text-axis-text1" : "text-axis-text3"
              }`}
            >
              {t("price.toggle.monthly")}
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                yearly ? "bg-white shadow-sm text-axis-text1" : "text-axis-text3"
              }`}
            >
              {t("price.toggle.yearly")}
              <span className="ml-2 inline-flex items-center text-[9px] font-mono font-semibold text-axis-text1 bg-axis-accent px-1.5 py-0.5 rounded">
                {t("price.toggle.save")}
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-axis-border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="mb-6">
              <span className="text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider">
                {t("price.free.label")}
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">{t("price.free.amount")}</span>
                <span className="text-axis-text3 text-sm">{t("price.free.unit")}</span>
              </div>
              <p className="text-sm text-axis-text2 mt-2">{t("price.free.tagline")}</p>
            </div>

            <Link
              href="/start"
              className="w-full flex items-center justify-center text-sm font-medium bg-axis-bg text-axis-text1 border border-axis-border px-6 py-3 rounded-xl hover:border-axis-border2 hover:shadow-sm transition-all mb-8"
            >
              {t("price.free.cta")}
            </Link>

            <ul className="space-y-3">
              {[
                t("price.free.f1"),
                t("price.free.f2"),
                t("price.free.f3"),
                t("price.free.f4"),
                t("price.free.f5"),
                t("price.free.f6"),
                t("price.free.f7"),
                t("price.free.f8"),
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-axis-text2">
                  <svg className="w-4 h-4 text-axis-text3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-axis-text1 text-white rounded-2xl p-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border-2 border-axis-accent">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-axis-accent text-axis-text1 text-xs font-mono font-bold px-4 py-1.5 rounded-full">
                {t("price.pro.badge")}
              </span>
            </div>

            <div className="mb-6">
              <span className="text-xs font-mono font-semibold text-white/50 uppercase tracking-wider">
                {t("price.pro.label")}
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">{proAmount}</span>
                <span className="text-white/50 text-sm">{proUnit}</span>
              </div>
              {yearly && (
                <p className="text-[11px] font-mono text-axis-accent mt-1">{t("price.pro.yearly.note")}</p>
              )}
              <p className="text-sm text-white/60 mt-2">{t("price.pro.tagline")}</p>
            </div>

            <button
              type="button"
              onClick={handleProCta}
              disabled={proLoading}
              className="w-full flex items-center justify-center text-sm font-semibold bg-axis-accent text-axis-text1 px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {proLoading ? t("sidebar.upgrade.opening") : t("price.pro.cta")}
            </button>
            <p className="text-[11px] text-center text-white/40 mb-6">{t("price.refund")}</p>

            <ul className="space-y-3">
              {[
                t("price.pro.f1"),
                t("price.pro.f2"),
                t("price.pro.f3"),
                t("price.pro.f4"),
                t("price.pro.f5"),
                t("price.pro.f6"),
                t("price.pro.f7"),
                t("price.pro.f8"),
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                  <svg className="w-4 h-4 text-axis-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Anchor: replaces 6 apps */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-axis-bg border border-axis-border rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-axis-text1 mb-1">{t("price.anchor.title")}</p>
            <p className="text-sm text-axis-text2 leading-relaxed">{t("price.anchor.line")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
