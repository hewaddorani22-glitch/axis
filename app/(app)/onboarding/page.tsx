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

const userTypesByLocale: Record<"de" | "en", { value: UserType; label: string; desc: string }[]> = {
  de: [
    { value: "entrepreneur", label: "Side-Hustle / Selbststaendig", desc: "Ich verdiene oder will online verdienen" },
    { value: "professional", label: "Angestellt — aber will mehr", desc: "9-to-5, aber raus aus dem Standby" },
    { value: "creator", label: "Creator / online aktiv", desc: "Posten, Reichweite, dranbleiben" },
    { value: "student", label: "Student / Schueler mit Plan", desc: "Studium + Disziplin + Side-Stuff" },
  ],
  en: [
    { value: "entrepreneur", label: "Side-hustle / self-employed", desc: "I earn online or want to" },
    { value: "professional", label: "Employed — but want more", desc: "9-to-5, but ready to break out" },
    { value: "creator", label: "Creator / online", desc: "Posting, building reach, staying consistent" },
    { value: "student", label: "Student with a plan", desc: "Studies + discipline + side stuff" },
  ],
};

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
  const { locale, t } = useLocale();
  const supabase = createClient();
  const userTypes = userTypesByLocale[locale] ?? userTypesByLocale.de;
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const habitMax = plan === "pro" ? 10 : 3;

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
        .select("name, user_type, timezone, plan")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      setName((prev) => prev || profile?.name || profileName);
      if (!userType && profile?.user_type) {
        setUserType(profile.user_type as UserType);
      }
      setTimezone(profile?.timezone || browserTimezone);
      if (profile?.plan === "pro" || profile?.plan === "free") {
        setPlan(profile.plan);
      }
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
    { title: t("onb.step1.title"), subtitle: t("onb.step1.sub"), icon: <IconUser size={20} className="text-axis-accent" /> },
    { title: t("onb.step2.title"), subtitle: t("onb.step2.sub"), icon: <IconTarget size={20} className="text-axis-accent" /> },
    { title: t("onb.step3.title"), subtitle: t("onb.step3.sub"), icon: <IconHabits size={20} className="text-axis-accent" /> },
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
      setSaveError(t("onb.error.session"));
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
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const next = params?.get("next");
      const interval = params?.get("interval") === "yearly" ? "yearly" : "monthly";
      router.push(next === "upgrade" ? `/settings?upgrade=start&interval=${interval}` : "/dashboard");
      router.refresh();
    } catch (error: any) {
      setSaveError(error?.message || t("onb.error.save"));
      setLoading(false);
      return;
    }

  };

  const currentStep = stepTitles[step - 1];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <AxisLogo size={24} />
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("onb.setup")}</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            {t("onb.step", { n: String(step), total: String(totalSteps) })}
          </span>
          <button
            onClick={() => {
              if (confirm(t("onb.skip.confirm"))) {
                void handleComplete({ skip: true });
              }
            }}
            className="text-xs transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("onb.skip")}
          </button>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <div className="h-full bg-axis-accent rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          {stepTitles.map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                i + 1 < step ? "bg-axis-accent text-axis-dark" :
                i + 1 === step ? "bg-axis-accent/20 text-axis-accent border border-axis-accent/40" :
                ""
              }`}
              style={
                i + 1 > step
                  ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
                  : undefined
              }
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
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{currentStep.title}</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{currentStep.subtitle}</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="text-xs font-mono block mb-2" style={{ color: "var(--text-tertiary)" }}>{t("onb.step1.name")}</label>
            <input
              type="text"
              placeholder={t("onb.step1.name.placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-base rounded-xl px-5 py-4 outline-none focus:border-axis-accent/50 focus:ring-2 focus:ring-axis-accent/10 transition-all border"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-mono block mb-2" style={{ color: "var(--text-tertiary)" }}>{t("onb.step1.type")}</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {userTypes.map((type) => {
                const isSelected = userType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setUserType(type.value)}
                    className={`p-4 rounded-xl text-left transition-all border ${
                      isSelected ? "bg-axis-accent/10 border-axis-accent/30" : ""
                    }`}
                    style={
                      isSelected
                        ? undefined
                        : { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }
                    }
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{type.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono block mb-2 flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
              <IconGlobe size={12} /> {t("onb.step1.tz")}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-sm rounded-xl px-4 py-3 outline-none border"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-secondary)",
              }}
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
          <p
            className="text-xs rounded-xl px-4 py-3 border"
            style={{
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-primary)",
            }}
          >
            {t("onb.step2.hint")}
          </p>
          {missions.map((mission, i) => {
            const placeholder =
              i === 0 ? t("onb.step2.placeholder.1")
              : i === 1 ? t("onb.step2.placeholder.2")
              : i === 2 ? t("onb.step2.placeholder.3")
              : t("onb.step2.placeholder.n", { n: String(i + 1) });
            return (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? "bg-red-500/10 text-red-500"
                    : i < 3 ? "bg-amber-500/10 text-amber-500"
                    : ""
                  }`}
                  style={
                    i >= 3
                      ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
                      : undefined
                  }
                >
                  <span className="text-xs font-mono font-bold">{i + 1}</span>
                </div>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={mission.title}
                  onChange={(e) => {
                    const updated = [...missions];
                    updated[i].title = e.target.value;
                    setMissions(updated);
                  }}
                  className="w-full flex-1 text-sm rounded-xl px-4 py-3 outline-none focus:border-axis-accent/50 transition-all border"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                  autoFocus={i === 0}
                />
                <select
                  value={mission.priority}
                  onChange={(e) => {
                    const updated = [...missions];
                    updated[i].priority = e.target.value as "high" | "med" | "low";
                    setMissions(updated);
                  }}
                  className="w-full text-xs font-mono rounded-lg px-2 py-2 outline-none sm:w-auto border"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <option value="high">{t("onb.priority.high")}</option>
                  <option value="med">{t("onb.priority.med")}</option>
                  <option value="low">{t("onb.priority.low")}</option>
                </select>
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <p
            className="text-xs rounded-xl px-4 py-3 border"
            style={{
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-primary)",
            }}
          >
            {t("onb.step3.hint")}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(userType ? habitsBySegment[userType] : habitsBySegment.professional).map((habit) => {
              const isSelected = selectedHabits.includes(habit.name);
              const total = selectedHabits.length + customHabits.length;
              const atCap = !isSelected && total >= habitMax;
              return (
                <button
                  key={habit.name}
                  disabled={atCap}
                  onClick={() => {
                    setSelectedHabits((prev) =>
                      isSelected ? prev.filter((h) => h !== habit.name) :
                      prev.length + customHabits.length < habitMax ? [...prev, habit.name] : prev
                    );
                  }}
                  className={`flex min-w-0 items-center gap-3 p-4 rounded-xl transition-all border ${
                    isSelected ? "bg-axis-accent/10 border-axis-accent/30"
                    : atCap ? "opacity-40 cursor-not-allowed"
                    : ""
                  }`}
                  style={
                    isSelected
                      ? undefined
                      : { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }
                  }
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-axis-accent/20" : ""
                    }`}
                    style={isSelected ? undefined : { backgroundColor: "var(--bg-secondary)" }}
                  >
                    <div style={{ color: isSelected ? "var(--accent)" : "var(--text-tertiary)" }}>
                      {habit.icon}
                    </div>
                  </div>
                  <span className="min-w-0 flex-1 text-left text-sm" style={{ color: "var(--text-primary)" }}>{habit.name}</span>
                  {isSelected && <IconCheck size={14} className="text-axis-accent ml-auto" />}
                </button>
              );
            })}
          </div>

          {customHabits.map((h, i) => (
            <div key={i} className="flex items-center gap-2 bg-axis-accent/5 border border-axis-accent/15 rounded-xl px-4 py-3">
              <IconCheck size={14} className="text-axis-accent" />
              <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{h}</span>
              <button
                onClick={() => setCustomHabits(customHabits.filter((_, j) => j !== i))}
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >x</button>
            </div>
          ))}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder={t("onb.step3.custom.placeholder")}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim() && selectedHabits.length + customHabits.length < habitMax) {
                  setCustomHabits([...customHabits, customInput.trim()]);
                  setCustomInput("");
                }
              }}
              className="min-w-0 flex-1 text-sm rounded-xl px-4 py-3 outline-none border"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={() => {
                if (customInput.trim() && selectedHabits.length + customHabits.length < habitMax) {
                  setCustomHabits([...customHabits, customInput.trim()]);
                  setCustomInput("");
                }
              }}
              disabled={selectedHabits.length + customHabits.length >= habitMax}
              className="w-full text-sm px-4 py-3 rounded-xl transition-all sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed border"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-secondary)",
              }}
            >
              {t("onb.step3.add")}
            </button>
          </div>
          <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
            {t("onb.step3.count", { n: String(selectedHabits.length + customHabits.length), max: String(habitMax) })}
          </p>
          {plan === "free" && (
            <p className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              {t("onb.step3.limit.free")}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-10 pb-8">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <IconChevronLeft size={16} /> {t("onb.back")}
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
            {t("onb.continue")} <IconChevronRight size={16} />
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
              <>{t("onb.launch")} <IconChevronRight size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
