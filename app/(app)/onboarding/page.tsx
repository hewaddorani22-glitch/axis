"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";

const SERIF = "'Cormorant Garamond', serif";

type Program = "foundation" | "builder" | "scholar";

interface ProgramOption {
  id: Program;
  title: string;
  subtitle: string;
  detail: string;
  weight: string;
}

const PROGRAMS: ProgramOption[] = [
  {
    id: "foundation",
    title: "The Foundation",
    subtitle: "Balanced across all three",
    detail:
      "Equal pull on body, mind, intellect. For the man building the base. Most begin here.",
    weight: "1 · 1 · 1",
  },
  {
    id: "builder",
    title: "The Builder",
    subtitle: "Body-weighted protocol",
    detail:
      "Heavier on physical training. Body becomes the engine for everything else.",
    weight: "2 · 1 · 1",
  },
  {
    id: "scholar",
    title: "The Scholar",
    subtitle: "Intellect-weighted protocol",
    detail:
      "Heavier on reading, deep work, skill. For the man whose body is in order but his mind is starving.",
    weight: "1 · 1 · 2",
  },
];

export default function ForgeOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [vow, setVow] = useState("");
  const [program, setProgram] = useState<Program | null>(null);
  const [bodyIntent, setBodyIntent] = useState("");
  const [mindIntent, setMindIntent] = useState("");
  const [intellectIntent, setIntellectIntent] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("name, onboarding_done")
        .eq("id", authUser.id)
        .single();
      if (profile?.onboarding_done) {
        router.replace("/dashboard");
        return;
      }
      if (profile?.name) setName(profile.name);
    })();
  }, [router, supabase]);

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0 && vow.trim().length >= 10;
    if (step === 1) return Boolean(program);
    if (step === 2) return bodyIntent.trim() && mindIntent.trim() && intellectIntent.trim();
    return true;
  };

  const takeTheVow = async () => {
    if (!program) return;
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    await supabase
      .from("users")
      .update({
        name: name.trim(),
        onboarding_done: true,
        user_type: "entrepreneur",
      })
      .eq("id", authUser.id);

    const enrollment = {
      user_id: authUser.id,
      program,
      vow: vow.trim(),
      pillars: {
        body: bodyIntent.trim(),
        mind: mindIntent.trim(),
        intellect: intellectIntent.trim(),
      },
      started_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`forge:enrollment:${authUser.id}`, JSON.stringify(enrollment));
    } catch {
      /* private mode */
    }

    trackEvent("vow_taken", { program });

    router.push("/dashboard");
  };

  return (
    <div
      className="min-h-screen px-5 py-10 sm:px-8 sm:py-16"
      style={{ backgroundColor: "var(--forge-void)", color: "var(--forge-bone)" }}
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[9px]"
              style={{
                backgroundColor: "var(--forge-iron)",
                border: "1px solid var(--forge-gold)",
                color: "var(--forge-gold)",
                fontFamily: SERIF,
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              L
            </span>
            <span
              className="tracking-wider"
              style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
            >
              lomoura
            </span>
          </div>
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--forge-shadow)" }}
          >
            Step {step + 1} of 3
          </span>
        </header>

        <div className="mb-12 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: i <= step ? "var(--forge-gold)" : "var(--forge-iron)",
              }}
            />
          ))}
        </div>

        {step === 0 && (
          <section>
            <p
              className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "var(--forge-gold)" }}
            >
              The vow
            </p>
            <h1
              className="mb-6 text-balance text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
            >
              Who will you be
              <br />
              <em style={{ color: "var(--forge-gold)" }}>in ninety days?</em>
            </h1>
            <p className="mb-10 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              One sentence. Specific. This becomes the contract. The app will hold you to it.
            </p>

            <label className="mb-6 block">
              <span
                className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--forge-ash)" }}
              >
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What you would be called"
                className="w-full rounded-[10px] px-4 py-3 text-base outline-none transition-colors"
                style={{
                  backgroundColor: "var(--forge-stone)",
                  border: "1px solid var(--forge-edge)",
                  color: "var(--forge-bone)",
                }}
              />
            </label>

            <label className="block">
              <span
                className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--forge-ash)" }}
              >
                The vow
              </span>
              <textarea
                value={vow}
                onChange={(e) => setVow(e.target.value)}
                placeholder='e.g. "I will wake before the sun, train daily, read with intent, and own the silence."'
                rows={4}
                className="w-full resize-none rounded-[10px] px-4 py-3 text-base leading-relaxed outline-none transition-colors"
                style={{
                  backgroundColor: "var(--forge-stone)",
                  border: "1px solid var(--forge-edge)",
                  color: "var(--forge-bone)",
                  fontFamily: SERIF,
                }}
              />
              <span
                className="mt-2 block text-xs"
                style={{ color: vow.trim().length >= 10 ? "var(--forge-pulse)" : "var(--forge-shadow)" }}
              >
                {vow.trim().length >= 10
                  ? "Specific enough."
                  : `Be more specific. ${vow.trim().length}/10 characters minimum.`}
              </span>
            </label>
          </section>
        )}

        {step === 1 && (
          <section>
            <p
              className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "var(--forge-gold)" }}
            >
              The path
            </p>
            <h1
              className="mb-6 text-balance text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
            >
              Choose your <em style={{ color: "var(--forge-gold)" }}>weight.</em>
            </h1>
            <p className="mb-10 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              Three protocols. Same duration. Different emphasis. You cannot change this for 90 days.
            </p>

            <div className="space-y-3">
              {PROGRAMS.map((p) => {
                const selected = program === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProgram(p.id)}
                    className="w-full rounded-[12px] p-6 text-left transition-all"
                    style={{
                      backgroundColor: selected ? "var(--forge-iron)" : "var(--forge-stone)",
                      border: `1px solid ${selected ? "var(--forge-gold)" : "var(--forge-edge)"}`,
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className="text-2xl tracking-tight"
                        style={{
                          fontFamily: SERIF,
                          color: selected ? "var(--forge-gold)" : "var(--forge-bone)",
                          fontWeight: 500,
                        }}
                      >
                        {p.title}
                      </span>
                      <span
                        className="font-mono text-[10px] tracking-[0.24em]"
                        style={{ color: "var(--forge-shadow)" }}
                      >
                        {p.weight}
                      </span>
                    </div>
                    <div
                      className="mb-2 text-xs font-medium"
                      style={{ color: selected ? "var(--forge-gold)" : "var(--forge-ash)" }}
                    >
                      {p.subtitle}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
                      {p.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p
              className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "var(--forge-gold)" }}
            >
              The three pillars
            </p>
            <h1
              className="mb-6 text-balance text-4xl leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
            >
              Define each <em style={{ color: "var(--forge-gold)" }}>by name.</em>
            </h1>
            <p className="mb-10 text-sm leading-relaxed" style={{ color: "var(--forge-ash)" }}>
              In one phrase, write what each pillar means for you. These become the daily targets.
            </p>

            {[
              { label: "Body", value: bodyIntent, set: setBodyIntent, placeholder: "e.g. lift, run, sleep eight, eat clean" },
              { label: "Mind", value: mindIntent, set: setMindIntent, placeholder: "e.g. silent ten, journal nightly, breath when angry" },
              { label: "Intellect", value: intellectIntent, set: setIntellectIntent, placeholder: "e.g. read thirty pages, write to clarify, learn one thing" },
            ].map((field) => (
              <label key={field.label} className="mb-5 block">
                <span
                  className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: "var(--forge-gold)" }}
                >
                  {field.label}
                </span>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-[10px] px-4 py-3 text-base outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--forge-stone)",
                    border: "1px solid var(--forge-edge)",
                    color: "var(--forge-bone)",
                  }}
                />
              </label>
            ))}

            <div
              className="mt-8 rounded-[14px] p-6"
              style={{ backgroundColor: "var(--forge-stone)", border: "1px solid var(--forge-edge)" }}
            >
              <p
                className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--forge-shadow)" }}
              >
                Your vow
              </p>
              <p
                className="italic leading-relaxed"
                style={{ fontFamily: SERIF, color: "var(--forge-bone)", fontWeight: 500 }}
              >
                &ldquo;{vow || "—"}&rdquo;
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--forge-ash)" }}>
                — {name || "you"}, day one of ninety
              </p>
            </div>
          </section>
        )}

        <div className="mt-12 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-[10px] px-5 py-3 text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--forge-edge)", color: "var(--forge-ash)" }}
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {step < 2 ? (
            <button
              onClick={() => canAdvance() && setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="rounded-[10px] px-7 py-3 text-sm font-semibold transition-opacity disabled:opacity-30"
              style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={takeTheVow}
              disabled={!canAdvance() || loading}
              className="rounded-[10px] px-7 py-3 text-sm font-semibold transition-opacity disabled:opacity-30"
              style={{ backgroundColor: "var(--forge-gold)", color: "var(--forge-void)" }}
            >
              {loading ? "Beginning…" : "Take the vow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
