import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

export const metadata = {
  title: "Privacy Policy | lomoura",
  description: "How lomoura handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-28 sm:px-6 sm:py-32">
      <h1 className="text-3xl font-bold tracking-tight mb-3 sm:text-4xl">Privacy Policy</h1>
      <p className="text-sm font-mono text-axis-text3 mb-12">Last updated: April 2026</p>

      <div className="prose prose-base max-w-none space-y-8 text-axis-text2 sm:prose-lg">
        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">What we collect</h2>
          <p>When you use lomoura, we collect only what we need to run the service:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Account info:</strong> email, name, timezone</li>
            <li><strong>Your data:</strong> missions, habits, revenue entries, goals: stored encrypted on Supabase</li>
            <li><strong>Billing:</strong> handled by Stripe (we never see your card number)</li>
            <li><strong>Usage:</strong> basic analytics to improve the product (page views, clicks)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">What we don't do</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We don't sell your data: ever.</li>
            <li>We don't share your data with advertisers.</li>
            <li>We don't read your mission titles, habit names, or revenue notes to train AI.</li>
            <li>We don't track you across the web.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Your rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Export:</strong> Pro users can download all their data as CSV from Settings at any time.</li>
            <li><strong>Delete:</strong> "Delete Account" in Settings permanently erases everything: no recovery, no soft-delete.</li>
            <li><strong>Access:</strong> email <a href={SUPPORT_MAILTO} className="text-axis-accent2 hover:underline">{SUPPORT_EMAIL}</a> for a full data report.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Third parties</h2>
          <p>lomoura uses:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Supabase</strong> | database + auth (EU/US hosting)</li>
            <li><strong>Stripe</strong> | subscription billing</li>
            <li><strong>Resend</strong> | transactional email (welcome, morning briefings)</li>
            <li><strong>Vercel</strong> | hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Contact</h2>
          <p>Questions? <a href={SUPPORT_MAILTO} className="text-axis-accent2 hover:underline">{SUPPORT_EMAIL}</a></p>
        </section>
      </div>
    </div>
  );
}
