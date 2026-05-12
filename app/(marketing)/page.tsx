import Link from "next/link";

const SERIF = "'Cormorant Garamond', serif";
const MONO = "'JetBrains Mono', monospace";

// ─────────────────────────────────────────────────────────────────────
// Section: Hero
// ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Subtle vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,163,94,0.06) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <p
          className="mb-7 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          The 90-Day Forge
        </p>

        <h1
          className="text-balance text-5xl leading-[1.05] tracking-tight sm:text-7xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          Become unrecognizable
          <br />
          <em style={{ color: "var(--forge-gold)", fontStyle: "italic", fontWeight: 400 }}>
            in 90 days.
          </em>
        </h1>

        <p
          className="mx-auto mt-8 max-w-xl text-balance text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--forge-ash)" }}
        >
          A prescribed daily protocol across three pillars — body, mind, intellect.
          You do not configure. You do not negotiate. You follow the path.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-[10px] px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
          >
            Take the vow
          </Link>
          <a
            href="#path"
            className="rounded-[10px] px-8 py-3.5 text-sm font-semibold transition-colors"
            style={{
              border: "1px solid var(--forge-edge)",
              color: "var(--forge-bone)",
            }}
          >
            See the path
          </a>
        </div>

        <p
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: "var(--forge-shadow)" }}
        >
          3 days · free · no card
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: For whom
// ─────────────────────────────────────────────────────────────────────
function ForWhom() {
  const isFor = [
    "Men 18–28 who consume self-improvement but never act on it",
    "Those who train alone and prefer it that way",
    "Those tired of habit apps that ask what to do instead of telling them",
    "Those who would rather be measured than motivated",
  ];
  const isNotFor = [
    "Anyone looking for hype, streaks-as-emojis, or a fitness coach in their pocket",
    "Anyone who wants to negotiate the protocol",
    "Anyone who needs a community to keep showing up",
  ];

  return (
    <section className="mx-auto max-w-4xl px-5 py-24 sm:px-8 sm:py-32">
      <h2
        className="mb-12 text-center text-3xl tracking-tight sm:text-4xl"
        style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
      >
        For those who would rather <em style={{ color: "var(--forge-gold)" }}>do</em>
        <br />
        than consume.
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        <div
          className="rounded-[14px] p-8"
          style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
        >
          <p
            className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-gold)" }}
          >
            It is for
          </p>
          <ul className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--forge-bone)" }}>
            {isFor.map((line) => (
              <li key={line} className="flex gap-3">
                <span style={{ color: "var(--forge-gold)" }}>—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-[14px] p-8"
          style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
        >
          <p
            className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-shadow)" }}
          >
            It is not for
          </p>
          <ul className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
            {isNotFor.map((line) => (
              <li key={line} className="flex gap-3">
                <span style={{ color: "var(--forge-shadow)" }}>—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: Three Pillars
// ─────────────────────────────────────────────────────────────────────
function ThreePillars() {
  const pillars = [
    {
      label: "Body",
      title: "Carry yourself",
      detail:
        "Train the body the protocol prescribes. Strength, conditioning, sleep, cold exposure. No exceptions for tired.",
      n: "01",
    },
    {
      label: "Mind",
      title: "Silence yourself",
      detail:
        "Stillness, breath, journaling. The mind that cannot be alone with itself is the mind that breaks under pressure.",
      n: "02",
    },
    {
      label: "Intellect",
      title: "Sharpen yourself",
      detail:
        "Read deeply. Build skill. Write to think. The man who stops learning at 22 is finished by 32.",
      n: "03",
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mb-16 text-center">
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          Three Pillars
        </p>
        <h2
          className="text-balance text-3xl tracking-tight sm:text-5xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          The whole man, or none of him.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {pillars.map((p) => (
          <article
            key={p.label}
            className="rounded-[14px] p-7 transition-colors"
            style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
          >
            <div className="mb-8 flex items-center justify-between">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--forge-gold)" }}
              >
                {p.label}
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--forge-shadow)" }}>
                {p.n}
              </span>
            </div>
            <h3
              className="mb-4 text-2xl tracking-tight"
              style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
            >
              {p.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              {p.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: The Path (90 days visualized)
// ─────────────────────────────────────────────────────────────────────
function PathSection() {
  const cells = Array.from({ length: 90 }, (_, i) => i);
  const milestones = new Set([7, 30, 60, 89]);

  return (
    <section id="path" className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mb-12 text-center">
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          The Path
        </p>
        <h2
          className="mb-4 text-balance text-3xl tracking-tight sm:text-5xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          Ninety days. Visible. Permanent.
        </h2>
        <p
          className="mx-auto max-w-xl text-balance text-sm leading-relaxed sm:text-base"
          style={{ color: "var(--forge-ash)" }}
        >
          Each day is a cell. Filled means held. Empty means lost. You cannot lie to yourself —
          the path is the record.
        </p>
      </div>

      <div
        className="mx-auto rounded-[14px] p-6 sm:p-10"
        style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
      >
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {cells.map((i) => {
            const filled = i < 47;
            const isMilestone = milestones.has(i);
            return (
              <div
                key={i}
                className="aspect-square rounded-[3px]"
                style={{
                  backgroundColor: filled
                    ? isMilestone
                      ? "var(--forge-gold)"
                      : "var(--forge-pulse)"
                    : "var(--forge-iron)",
                  border: i === 47 ? "1px solid var(--forge-gold)" : undefined,
                  opacity: filled ? 0.85 : 0.5,
                }}
              />
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-5" style={{ color: "var(--forge-ash)" }}>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: "var(--forge-pulse)", opacity: 0.85 }}
              />
              held
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: "var(--forge-gold)" }}
              />
              milestone
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: "var(--forge-iron)", border: "1px solid var(--forge-edge)" }}
              />
              not yet
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--forge-shadow)" }}>
            Sample · Day 47 of 90
          </span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: How it works
// ─────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "I",
      title: "Take the vow",
      detail:
        "Write — in one sentence — who you will be in 90 days. This becomes the contract. The app holds you to it.",
    },
    {
      n: "II",
      title: "Receive the protocol",
      detail:
        "Each morning, three prescribed actions appear: one body, one mind, one intellect. You do not decide. You execute.",
    },
    {
      n: "III",
      title: "Hold the day",
      detail:
        "Complete all three. The day is held. Miss one — a recovery mission unlocks within 48 hours.",
    },
    {
      n: "IV",
      title: "Stand on Day 90",
      detail:
        "Receive your proof card. Black, gold, your stats. The record of who you have become.",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mb-12 text-center">
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          The Method
        </p>
        <h2
          className="text-balance text-3xl tracking-tight sm:text-5xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          Four steps. No options.
        </h2>
      </div>

      <ol className="space-y-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="grid grid-cols-[60px_1fr] gap-6 rounded-[14px] p-6 sm:grid-cols-[80px_1fr] sm:gap-8 sm:p-8"
            style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
          >
            <span
              className="text-3xl sm:text-4xl"
              style={{
                fontFamily: SERIF,
                color: "var(--forge-gold)",
                fontWeight: 500,
                fontStyle: "italic",
              }}
            >
              {s.n}
            </span>
            <div>
              <h3
                className="mb-2 text-xl tracking-tight sm:text-2xl"
                style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
              >
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
                {s.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: Pricing
// ─────────────────────────────────────────────────────────────────────
function PricingSection() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mb-12 text-center">
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          Cost
        </p>
        <h2
          className="text-balance text-3xl tracking-tight sm:text-5xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          The price of becoming.
        </h2>
      </div>

      <div
        className="relative rounded-[16px] p-8 sm:p-12"
        style={{
          backgroundColor: "var(--forge-stone)",
          border: "1px solid var(--forge-gold)",
        }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: "var(--forge-gold)",
              color: "var(--forge-void)",
            }}
          >
            The Forge · 90 days
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-center gap-3">
          <span
            className="text-6xl tracking-tighter sm:text-7xl"
            style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
          >
            $19
          </span>
          <span className="text-sm" style={{ color: "var(--forge-ash)" }}>
            once · for the full 90 days
          </span>
        </div>

        <p
          className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: "var(--forge-shadow)" }}
        >
          $0.21 per day · the cost of who you become
        </p>

        <div className="my-8 h-px" style={{ backgroundColor: "var(--forge-edge)" }} />

        <ul className="space-y-3 text-sm" style={{ color: "var(--forge-bone)" }}>
          {[
            "The 90-day daily protocol across body, mind, intellect",
            "Recovery missions when you fall short",
            "The path — your permanent record",
            "Day 30, 60, 90 proof cards (shareable)",
            "Anonymous cohort — others on the same day",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span style={{ color: "var(--forge-gold)" }}>—</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/signup"
          className="mt-10 block rounded-[10px] py-3.5 text-center text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
        >
          Take the vow
        </Link>

        <p
          className="mt-4 text-center text-xs"
          style={{ color: "var(--forge-shadow)" }}
        >
          3-day glimpse first. Pay only when you decide to continue.
        </p>
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs" style={{ color: "var(--forge-shadow)" }}>
          After Day 90 — continue with <span style={{ color: "var(--forge-ash)" }}>The Vigil ($9 / month)</span>
          {" · "}or step off the path.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: FAQ
// ─────────────────────────────────────────────────────────────────────
function FaqSection() {
  const faqs = [
    {
      q: "Is this another habit app?",
      a: "No. Habit apps ask what you want to do. Lomoura tells you what to do. You receive the daily protocol — you do not write it.",
    },
    {
      q: "What if I miss a day?",
      a: "A recovery mission unlocks within 48 hours. Smaller scope. Proves the path continues. The missed day stays on the record — recovery does not erase it.",
    },
    {
      q: "What happens on Day 91?",
      a: "You receive your proof. Then you choose: continue with The Vigil for $9/month, or step off the path. Most who complete the Forge continue.",
    },
    {
      q: "Is there a free version?",
      a: "Three days. Full app. After that, $19 once for the full 90 days. The audience this is built for does not respect free.",
    },
    {
      q: "Do I need other people?",
      a: "No. You will see an anonymous cohort — others on the same day, no names, no comments. You walk alone. They walk alone. Together.",
    },
    {
      q: "Will this work for me?",
      a: "It works if you do the protocol. It does not work if you negotiate it. Decide which you are before you take the vow.",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mb-12 text-center">
        <p
          className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: "var(--forge-gold)" }}
        >
          Questions
        </p>
        <h2
          className="text-balance text-3xl tracking-tight sm:text-5xl"
          style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
        >
          What you may want to know.
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-[12px] px-6 py-5 transition-colors"
            style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="text-sm font-medium" style={{ color: "var(--forge-bone)" }}>
                {f.q}
              </span>
              <span
                className="font-mono text-lg leading-none transition-transform group-open:rotate-45"
                style={{ color: "var(--forge-gold)" }}
              >
                +
              </span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section: Closing
// ─────────────────────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
      <p
        className="mb-6 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
        style={{ color: "var(--forge-gold)" }}
      >
        Begin
      </p>
      <h2
        className="text-balance text-4xl leading-tight tracking-tight sm:text-6xl"
        style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
      >
        Ninety days from now,
        <br />
        <em style={{ color: "var(--forge-gold)", fontStyle: "italic" }}>you decide who you were.</em>
      </h2>

      <p
        className="mx-auto mt-8 max-w-md text-sm leading-relaxed sm:text-base"
        style={{ color: "var(--forge-ash)" }}
      >
        Three days, free, to see the path. Then $19 for the full forge.
        Either you walk it, or you do not.
      </p>

      <Link
        href="/signup"
        className="mt-10 inline-block rounded-[10px] px-10 py-4 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
      >
        Take the vow
      </Link>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--forge-shadow)" }}>
        No card · 3-day glimpse · The forge begins
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Hero />
      <ForWhom />
      <ThreePillars />
      <PathSection />
      <HowItWorks />
      <PricingSection />
      <FaqSection />
      <ClosingCTA />
    </>
  );
}
