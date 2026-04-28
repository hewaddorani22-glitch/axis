"use client";

import { useState } from "react";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

const FAQS = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan gives you 5 missions, 3 habits, 1 revenue stream, and 2 goals: no card, no trial, no expiration. Upgrade only when you're ready.",
  },
  {
    q: "Why $9/month for Pro?",
    a: "Because you replace 4-6 apps (task manager, habit tracker, revenue spreadsheet, goal planner, review doc). Most of those are $8-20/month on their own. lomoura Pro is unlimited everything: missions, habits, streams, goals, partners: plus Weekly Review, Streak Freeze, CSV export, and priority support.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Settings / Plan / Manage Subscription. Cancellation takes effect at the end of your current billing cycle. We also offer a 14-day refund on your first charge: no questions asked.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Everything is stored encrypted on Supabase (same infrastructure used by thousands of production apps). We never sell your data, never share it with advertisers, and never read your mission titles or revenue notes. Pro users can export all data as CSV anytime.",
  },
  {
    q: "What happens to my data if I cancel or delete my account?",
    a: "Downgrade to Free: your data stays intact, you just lose access beyond free-plan limits. Delete account: everything is permanently erased within 24 hours: no backups, no recovery.",
  },
  {
    q: "How is lomoura different from Notion or Todoist?",
    a: "Notion is a blank canvas: you build the system yourself. Todoist is tasks only. lomoura is opinionated: it bundles daily missions, habits, revenue tracking, and goals with a built-in scoring system (Focus Score + Grade) so you know exactly where you stand every morning.",
  },
  {
    q: "Does lomoura work on mobile?",
    a: "Yes. The web app is fully responsive and works great on iOS / Android browsers. Native apps are on the roadmap for 2026.",
  },
  {
    q: "What's the accountability partner feature?",
    a: "You can connect with 1 (Free) or unlimited (Pro) partners who also use lomoura. You see each other's daily grade, streak, and focus score: and can nudge them when they're slipping. It's the same principle as running with a gym partner: you show up more often.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 bg-white border-t border-axis-border">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-axis-text3">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-3">
            Questions? We've got answers.
          </h2>
          <p className="text-lg text-axis-text2">
            Still curious? Email{" "}
            <a href={SUPPORT_MAILTO} className="text-axis-text1 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
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
