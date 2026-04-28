"use client";

import { useState } from "react";
import Link from "next/link";

const MONTHLY_PRICE = 9;
const ANNUAL_PRICE = 7; // billed as $84/yr

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider mb-3">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Start free. <span className="axis-highlight">Upgrade when ready.</span>
          </h2>
          <p className="text-lg text-axis-text2">No credit card required. No trial expiry.</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-axis-text1" : "text-axis-text3"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            aria-label="Toggle annual billing"
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? "bg-axis-accent" : "bg-axis-border2"}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${annual ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 transition-colors ${annual ? "text-axis-text1" : "text-axis-text3"}`}>
            Annual
            <span className="text-[10px] font-mono font-bold bg-axis-accent text-axis-text1 px-2 py-0.5 rounded-full">
              SAVE 22%
            </span>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-axis-border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="mb-6">
              <span className="text-xs font-mono font-semibold text-axis-text3 uppercase tracking-wider">Free</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-axis-text3 text-sm">/forever</span>
              </div>
              <p className="text-sm text-axis-text2 mt-2">Everything you need to get started.</p>
            </div>

            <Link
              href="/signup"
              className="w-full flex items-center justify-center text-sm font-medium bg-axis-bg text-axis-text1 border border-axis-border px-6 py-3 rounded-xl hover:border-axis-border2 hover:shadow-sm transition-all mb-8"
            >
              Get Started Free
            </Link>

            <ul className="space-y-3">
              {[
                "5 daily missions",
                "3 habit trackers",
                "1 revenue stream",
                "2 themes",
                "Command Center",
                "Prove It profile",
                "1 accountability partner",
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
          <div className="relative bg-axis-text1 text-white rounded-2xl p-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            {annual && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-axis-accent text-axis-text1 text-xs font-mono font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  BEST VALUE
                </span>
              </div>
            )}

            <div className="mb-6">
              <span className="text-xs font-mono font-semibold text-white/50 uppercase tracking-wider">Pro</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">${annual ? ANNUAL_PRICE : MONTHLY_PRICE}</span>
                <span className="text-white/50 text-sm">/mo{annual ? ", billed annually" : ""}</span>
              </div>
              {annual && (
                <p className="text-xs font-mono text-white/40 mt-1">
                  $84/yr — save ${(MONTHLY_PRICE - ANNUAL_PRICE) * 12} vs monthly
                </p>
              )}
              <p className="text-sm text-white/60 mt-2">For those who are serious about their system.</p>
            </div>

            <Link
              href={`/signup?plan=pro${annual ? "&billing=annual" : ""}`}
              className="w-full flex items-center justify-center text-sm font-semibold bg-axis-accent text-axis-text1 px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] mb-8"
            >
              {annual ? `Start Pro: $84/yr` : `Start Pro: $${MONTHLY_PRICE}/mo`}
            </Link>

            <ul className="space-y-3">
              {[
                "Unlimited missions",
                "Unlimited habits",
                "Unlimited revenue streams",
                "Unlimited themes",
                "Weekly Review system",
                "Focus Score history",
                "Streak Freeze (1x/month)",
                "Unlimited partners",
                "CSV data export",
                "Priority support",
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

        <p className="text-center text-xs text-axis-text3 mt-8 font-mono">
          Annual plan billed as a single charge of $84. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
