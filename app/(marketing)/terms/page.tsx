export const metadata = {
  title: "Terms of Service | AXIS",
  description: "AXIS terms of service.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-32">
      <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
      <p className="text-sm font-mono text-axis-text3 mb-12">Last updated: April 2026</p>

      <div className="prose prose-lg max-w-none space-y-8 text-axis-text2">
        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">The short version</h2>
          <p>
            AXIS is a productivity tool. We do our best to keep it running, secure, and useful.
            You're responsible for the content you put in it. Don't break the law with it.
            Either of us can end this relationship at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Your account</h2>
          <p>
            You must be at least 16 years old to use AXIS. You're responsible for keeping your
            login credentials secure. One account per person.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Billing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Free plan: 5 missions, 3 habits, 1 revenue stream, 2 goals. No expiration.</li>
            <li>Pro plan: $9/month, billed monthly via Stripe.</li>
            <li>Cancel anytime from Settings / Manage Subscription. No questions asked.</li>
            <li>We offer a 14-day refund if AXIS doesn't work out. Email support@useaxis.com.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Acceptable use</h2>
          <p>Don't:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Use AXIS to do anything illegal</li>
            <li>Try to break, scrape, or abuse the service</li>
            <li>Share your account with multiple people</li>
            <li>Upload illegal or harmful content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Your data</h2>
          <p>
            Your data is yours. You can export it (Pro) or delete it (anyone) at any time.
            If we shut down, we'll give you at least 30 days to export.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Liability</h2>
          <p>
            AXIS is provided "as is." We do our best but can't guarantee 100% uptime or
            that you'll hit your goals. Our total liability is capped at what you've paid us
            in the last 12 months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Changes</h2>
          <p>
            We may update these terms occasionally. Material changes will be emailed to you
            at least 14 days before taking effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-axis-text1 mb-3">Contact</h2>
          <p>Questions? <a href="mailto:support@useaxis.com" className="text-axis-accent2 hover:underline">support@useaxis.com</a></p>
        </section>
      </div>
    </div>
  );
}
