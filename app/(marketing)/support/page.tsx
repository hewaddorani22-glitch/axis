import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

export const metadata = {
  title: "Support | lomoura",
  description: "Get help with lomoura.",
};

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-28 sm:px-6 sm:py-32">
      <h1 className="text-3xl font-bold tracking-tight mb-3 sm:text-4xl">Support</h1>
      <p className="text-base text-axis-text2 mb-12 sm:text-lg">
        Running into something? We'll get back to you within 24 hours.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <a
          href={SUPPORT_MAILTO}
          className="group bg-white border border-axis-border rounded-2xl p-6 hover:border-axis-text1 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-axis-accent/20 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-axis-text1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">Email support</h3>
          <p className="text-sm text-axis-text3 mb-3">Best for bugs, account issues, billing</p>
          <span className="break-all text-sm font-medium text-axis-text1 group-hover:underline">{SUPPORT_EMAIL}</span>
        </a>

        <a
          href="https://twitter.com/lomoura"
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white border border-axis-border rounded-2xl p-6 hover:border-axis-text1 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-axis-accent/20 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-axis-text1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">Twitter / X</h3>
          <p className="text-sm text-axis-text3 mb-3">For quick questions + feature requests</p>
          <span className="text-sm font-medium text-axis-text1 group-hover:underline">@lomoura</span>
        </a>
      </div>

      <div className="bg-axis-dark text-white rounded-2xl p-5 sm:p-8">
        <h2 className="text-xl font-bold mb-4">Common questions</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold mb-1">How do I cancel my Pro subscription?</h3>
            <p className="text-sm text-white/60">Settings / Plan / Manage Subscription. Takes effect at the end of your current billing cycle.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Can I get a refund?</h3>
            <p className="text-sm text-white/60">Yes: within 14 days of your first Pro charge, no questions asked. Email {SUPPORT_EMAIL}.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">How do I export my data?</h3>
            <p className="text-sm text-white/60">Settings / Data / Export Data (CSV). Pro feature.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">I deleted my account by mistake. Can you restore it?</h3>
            <p className="text-sm text-white/60">Sorry, deletes are permanent. We don't keep backups of deleted data (it's part of our privacy policy).</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">My streak broke even though I did everything.</h3>
            <p className="text-sm text-white/60">Streaks require at least 1 completed mission AND 1 completed habit per day, in your local timezone. Check Settings / Timezone.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
