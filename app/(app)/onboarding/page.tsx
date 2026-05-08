"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/provider";
import {
  loadQuizAnswers,
  clearQuizAnswers,
  suggestUserType,
  suggestFirstMission,
} from "@/lib/quiz";
import {
  AxisLogo,
  IconUser,
  IconTarget,
  IconHabits,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconGlobe,
  IconFocus,
  IconEdit,
  IconEnergy,
  IconReview,
  IconBriefing,
  IconLink,
} from "@/components/icons";

type UserType = "entrepreneur" | "student" | "creator" | "professional";

const userTypes = [
  { value: "entrepreneur" as UserType, label: "Side-Hustle / Selbstständig", desc: "Ich verdiene oder will online verdienen" },
  { value: "professional" as UserType, label: "Angestellt — aber will mehr", desc: "9-to-5, aber raus aus dem Standby" },
  { value: "creator" as UserType, label: "Creator / online aktiv", desc: "Posten, Reichweite, dranbleiben" },
  { value: "student" as UserType, label: "Student / Schüler mit Plan", desc: "Studium + Disziplin + Side-Stuff" },
];

const timezones = [
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Chicago", label: "Chicago (CST)" },
  { value: "America/Denver", label: "Denver (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "UTC", label: "UTC" },
];

// Segment-aware habit suggestions. Each user sees the 8 most relevant
// habits for their flow first; the union is shown with their picks at top.
const habitsBySegment: Record<UserType, { name: string; icon: React.ReactNode }[]> = {
  entrepreneur: [
    { name: "Deep Work", icon: <IconFocus size={16} /> },
    { name: "Outreach", icon: <IconGlobe size={16} /> },
    { name: "Sport", icon: <IconEnergy size={16} /> },
    { name: "Cold Calling", icon: <IconLink size={16} /> },
    { name: "Content Creation", icon: <IconEdit size={16} /> },
    { name: "Reading", icon: <IconReview size={16} /> },
    { name: "Journaling", icon: <IconBriefing size={16} /> },
    { name: "Meditation", icon: <IconHabits size={16} /> },
  ],
  professional: [
    { name: "Sport", icon: <IconEnergy size={16} /> },
    { name: "Side-Project (30 Min)", icon: <IconFocus size={16} /> },
    { name: "Reading / Lernen", icon: <IconReview size={16} /> },
    { name: "Kein Handy nach 22 Uhr", icon: <IconHabits size={16} /> },
    { name: "Journaling", icon: <IconBriefing size={16} /> },
    { name: "Meditation", icon: <IconHabits size={16} /> },
    { name: "Outreach", icon: <IconGlobe size={16} /> },
    { name: "Content Creation", icon: <IconEdit size={16} /> },
  ],
  creator: [
    { name: "Posten", icon: <IconEdit size={16} /> },
    { name: "Engagement (30 Min)", icon: <IconGlobe size={16} /> },
    { name: "Content schneiden", icon: <IconFocus size={16} /> },
    { name: "Sport", icon: <IconEnergy size={16} /> },
    { name: "Reading", icon: <IconReview size={16} /> },
    { name: "Journaling", icon: <IconBriefing size={16} /> },
    { name: "Cold DMs", icon: <IconLink size={16} /> },
    { name: "Meditation", icon: <IconHabits size={16} /> },
  ],
  student: [
    { name: "Lernblock (60 Min)", icon: <IconFocus size={16} /> },
    { name: "Sport", icon: <IconEnergy size={16} /> },
    { name: "Lesen / Buch", icon: <IconReview size={16} /> },
    { name: "Schlaf vor 23 Uhr", icon: <IconHabits size={16} /> },
    { name: "Journaling", icon: <IconBriefing size={16} /> },
    { name: "Side-Project (30 Min)", icon: <IconEdit size={16} /> },
    { name: "Meditation", icon: <IconHabits size={16} /> },
    { name: "Kein Handy beim Lernen", icon: <IconLink size={16} /> },
  ],
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabaseCheck = createClient();
  const { locale } = useLocale();
  const supabase = createClient();

  useEffect(() => {
    supabaseCheck.from("users").select("onboarding_done").single().then(({ data }) => {
      if (data?.onboarding_done) router.replace("/dashboard");
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    trackEvent("onboarding_started", {
      source: loadQuizAnswers() ? "start_funnel" : "direct",
    });
  }, []);

  // Quiz pre-fill: if the user came from /start, seed userType + first mission
  useEffect(() => {
    const quiz = loadQuizAnswers();
    if (!quiz) return;
    setUserType(suggestUserType(quiz.goal));
    const firstMission = suggestFirstMission(quiz.goal, locale);
    setMissions((prev) => {
      const next = [...prev];
      next[0] = { title: firstMission, priority: "high" };
      return next;
    });
    // Keep quiz answers around until onboarding completes; clearQuizAnswers is called in handleComplete.
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    const hydrateProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const profileName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "";
      const browserTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const { data: profile } = await supabase
        .from("users")
        .select("name, user_type, timezone")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      setName((prev) => prev || profile?.name || profileName);
      if (!userType && profile?.user_type) {
        setUserType(profile.user_type as UserType);
      }
      setTimezone(profile?.timezone || browserTimezone);
    };

    void hydrateProfile();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [timezone, setTimezone] = useState("Europe/Berlin");
  
  const [missions, setMissions] = useState([
    { title: "", priority: "high" as const },
    { title: "", priority: "med" as const },
    { title: "", priority: "med" as const },
    { title: "", priority: "low" as const },
    { title: "", priority: "low" as const },
  ]);

  useEffect(() => {
    if (!userType) return;
    const examples: Record<UserType, string[]> = {
      entrepreneur: ["Eine Sache, die heute Umsatz bringt", "3 Cold-DMs / Outreach", "1 h am Hauptprojekt", "Workout 30 Min", "Inbox auf Null"],
      professional: ["30 Min am Side-Project", "Workout 30 Min", "1 wichtige Sache im Job fertig", "30 Min lernen / lesen", "Kein Handy nach 22 Uhr"],
      creator: ["1 Post / Reel rausschicken", "30 Min Engagement", "Nächsten Content-Block schneiden", "Workout 30 Min", "Idee für nächste Woche notiert"],
      student: ["60 Min fokussiert lernen — ohne Handy", "Workout 30 Min", "Aufgabe X bearbeitet", "30 Min Side-Project", "Schlaf vor 23 Uhr planen"],
    };
    const titles = examples[userType] || [];
    setMissions((prev) =>
      titles.map((t, i) => ({
        title: i === 0 && prev[0]?.title.trim() ? prev[0].title : t,
        priority: i === 0 ? "high" : i < 3 ? "med" : "low",
      }))
    );
  }, [userType]);

  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const totalSteps = 3;
  const progressPct = (step / totalSteps) * 100;

  const stepTitles = [
    { title: "Your Profile", subtitle: "Tell us what fits your life so we can personalize day one.", icon: <IconUser size={20} className="text-axis-accent" /> },
    { title: "Today's Tasks", subtitle: "Start with the 1-3 things that matter most today.", icon: <IconTarget size={20} className="text-axis-accent" /> },
    { title: "Habits", subtitle: "Pick one or two habits you want to keep showing up for.", icon: <IconHabits size={20} className="text-axis-accent" /> },
  ];

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && userType !== null;
      case 2: return missions.some((m) => m.title.trim().length > 0);
      case 3: return selectedHabits.length + customHabits.length >= 1;
      default: return true;
    }
  };

  const handleComplete = async ({ skip = false }: { skip?: boolean } = {}) => {
    setLoading(true);
    setSaveError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveError("Your session expired. Please log in again.");
      setLoading(false);
      return;
    }

    const fallbackName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "there";
    const finalName = name.trim() || fallbackName;

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: finalName, name: finalName },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("users")
        .update({
          name: finalName,
          user_type: userType,
          timezone,
          onboarding_done: true,
          prove_it_username: null,
          prove_it_bio: null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const today = new Date().toISOString().split("T")[0];
      const validMissions = skip ? [] : missions.filter((m) => m.title.trim());
      if (validMissions.length > 0) {
        const { error: missionsError } = await supabase.from("missions").insert(
          validMissions.map((m, i) => ({
            user_id: user.id,
            title: m.title.trim(),
            priority: m.priority,
            date: today,
            sort_order: i,
          }))
        );

        if (missionsError) throw missionsError;
      }

      const allHabits = skip
        ? []
        : [
            ...selectedHabits.map((habitName) => ({ name: habitName, icon: "IconHabits" })),
            ...customHabits.map((habitName) => ({ name: habitName, icon: "IconHabits" })),
          ];
      if (allHabits.length > 0) {
        const { error: habitsError } = await supabase.from("habits").insert(
          allHabits.map((h, i) => ({
            user_id: user.id,
            name: h.name,
            icon: h.icon,
            sort_order: i,
          }))
        );

        if (habitsError) throw habitsError;
      }

      try {
        await fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: finalName }),
        });
      } catch {}

      trackEvent("onboarding_completed", {
        skipped: skip,
        missionsCreated: validMissions.length,
        habitsCreated: allHabits.length,
        userType,
      });

      clearQuizAnswers();
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setSaveError(error?.message || "We couldn't finish setup. Please try again.");
      setLoading(false);
      return;
    }

  };

  const currentStep = stepTitles[step - 1];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <AxisLogo size={24} />
        <span className="text-sm font-bold text-white">lomoura Setup</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-white/40">Step {step} of {totalSteps}</span>
          <button
            onClick={() => {
              if (confirm("Skip setup? You can configure everything later in Settings.")) {
                void handleComplete({ skip: true });
              }
            }}
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Skip for now
          </button>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-axis-accent rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          {stepTitles.map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                i + 1 < step ? "bg-axis-accent text-axis-dark" :
                i + 1 === step ? "bg-axis-accent/20 text-axis-accent border border-axis-accent/40" :
                "bg-white/[0.04] text-white/20"
              }`}
            >
              {i + 1 < step ? <IconCheck size={12} /> : i + 1}
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {saveError}
        </div>
      )}

      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-axis-accent/10 border border-axis-accent/20 flex items-center justify-center">
          {currentStep.icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
          <p className="text-sm text-white/40">{currentStep.subtitle}</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="text-xs font-mono text-white/40 block mb-2">Your name</label>
            <input
              type="text"
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-base rounded-xl px-5 py-4 outline-none placeholder:text-white/20 focus:border-axis-accent/50 focus:ring-2 focus:ring-axis-accent/10 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 block mb-2">What describes you best?</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {userTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setUserType(type.value)}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    userType === type.value
                      ? "bg-axis-accent/10 border-axis-accent/30"
                      : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{type.label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 block mb-2 flex items-center gap-1.5">
              <IconGlobe size={12} /> Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white/70 text-sm rounded-xl px-4 py-3 outline-none"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Tasks are your daily priorities: the things that move the needle.
            Set up to 5 for today, ranked by importance. You can always change them later.
          </p>
          {missions.map((mission, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                i === 0 ? "bg-red-500/10 text-red-400" :
                i < 3 ? "bg-amber-500/10 text-amber-400" :
                "bg-white/[0.04] text-white/20"
              }`}>
                <span className="text-xs font-mono font-bold">{i + 1}</span>
              </div>
              <input
                type="text"
                placeholder={
                  i === 0 ? "Most important task today..." :
                  i === 1 ? "Second priority..." :
                  i === 2 ? "Third task..." :
                  `Task ${ i + 1 } (optional)...`
                }
                value={mission.title}
                onChange={(e) => {
                  const updated = [...missions];
                  updated[i].title = e.target.value;
                  setMissions(updated);
                }}
                className="w-full flex-1 bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20 focus:border-axis-accent/50 transition-all"
                autoFocus={i === 0}
              />
              <select
                value={mission.priority}
                onChange={(e) => {
                  const updated = [...missions];
                  updated[i].priority = e.target.value as "high" | "med" | "low";
                  setMissions(updated);
                }}
                className="w-full bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-white/40 rounded-lg px-2 py-2 outline-none sm:w-auto"
              >
                <option value="high">High</option>
                <option value="med">Med</option>
                <option value="low">Low</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Pick one or two daily habits you want to track first. You can always add more later.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(userType ? habitsBySegment[userType] : habitsBySegment.professional).map((habit) => {
              const isSelected = selectedHabits.includes(habit.name);
              return (
                <button
                  key={habit.name}
                  onClick={() => {
                    setSelectedHabits((prev) =>
                      isSelected ? prev.filter((h) => h !== habit.name) :
                      prev.length + customHabits.length < 5 ? [...prev, habit.name] : prev
                    );
                  }}
                  className={`flex min-w-0 items-center gap-3 p-4 rounded-xl transition-all border ${
                    isSelected
                      ? "bg-axis-accent/10 border-axis-accent/30"
                      : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-axis-accent/20" : "bg-white/[0.04]"
                  }`}>
                    <div className={isSelected ? "text-axis-accent" : "text-white/30"}>
                      {habit.icon}
                    </div>
                  </div>
                  <span className="min-w-0 flex-1 text-left text-sm text-white/80">{habit.name}</span>
                  {isSelected && <IconCheck size={14} className="text-axis-accent ml-auto" />}
                </button>
              );
            })}
          </div>

          {customHabits.map((h, i) => (
            <div key={i} className="flex items-center gap-2 bg-axis-accent/5 border border-axis-accent/15 rounded-xl px-4 py-3">
              <IconCheck size={14} className="text-axis-accent" />
              <span className="text-sm text-white/70 flex-1">{h}</span>
              <button onClick={() => setCustomHabits(customHabits.filter((_, j) => j !== i))} className="text-white/20 text-xs">x</button>
            </div>
          ))}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Or type your own habit..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim() && selectedHabits.length + customHabits.length < 5) {
                  setCustomHabits([...customHabits, customInput.trim()]);
                  setCustomInput("");
                }
              }}
              className="min-w-0 flex-1 bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20"
            />
            <button
              onClick={() => {
                if (customInput.trim() && selectedHabits.length + customHabits.length < 5) {
                  setCustomHabits([...customHabits, customInput.trim()]);
                  setCustomInput("");
                }
              }}
              className="w-full bg-white/[0.06] text-white/50 text-sm px-4 py-3 rounded-xl hover:bg-white/[0.1] transition-all sm:w-auto"
            >
              Add
            </button>
          </div>
          <p className="text-[10px] font-mono text-white/20">{selectedHabits.length + customHabits.length}/5 selected (min 1)</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-10 pb-8">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            <IconChevronLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <button
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className="flex min-w-[132px] items-center justify-center gap-1.5 bg-axis-accent text-axis-dark text-sm font-semibold px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed sm:px-8"
          >
            Continue <IconChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => void handleComplete()}
            disabled={loading}
            className="flex min-w-[156px] items-center justify-center gap-2 bg-axis-accent text-axis-dark text-sm font-semibold px-6 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] disabled:opacity-50 sm:px-8"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-axis-dark/30 border-t-axis-dark rounded-full animate-spin" />
            ) : (
              <>Launch Dashboard <IconChevronRight size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
