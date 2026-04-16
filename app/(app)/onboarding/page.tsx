"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AxisLogo,
  IconUser,
  IconRevenue,
  IconTarget,
  IconHabits,
  IconGoals,
  IconProve,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconGlobe,
} from "@/components/icons";

type UserType = "entrepreneur" | "student" | "creator" | "professional";

const userTypes = [
  { value: "entrepreneur" as UserType, label: "Entrepreneur", desc: "Building a business or startup" },
  { value: "student" as UserType, label: "Student", desc: "Studying and learning new skills" },
  { value: "creator" as UserType, label: "Creator", desc: "Content, design, music, art" },
  { value: "professional" as UserType, label: "Professional", desc: "Growing in your career" },
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

const suggestedHabits = [
  { name: "Deep Work", icon: "focus" },
  { name: "Content Creation", icon: "create" },
  { name: "Exercise", icon: "fitness" },
  { name: "Reading", icon: "read" },
  { name: "Outreach", icon: "connect" },
  { name: "Meditation", icon: "calm" },
  { name: "Journaling", icon: "write" },
  { name: "Cold Calling", icon: "call" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabaseCheck = createClient();

  // If onboarding is already done, redirect to dashboard
  useEffect(() => {
    supabaseCheck.from("users").select("onboarding_done").single().then(({ data }) => {
      if (data?.onboarding_done) router.replace("/dashboard");
    });
  }, []); // eslint-disable-line

  const [step, setStep] = useState(1);
  // Step 1: Profile
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [timezone, setTimezone] = useState("Europe/Berlin");
  // Step 2: Revenue streams
  const [streams, setStreams] = useState([{ name: "", color: "#CDFF4F" }]);
  // Step 3: Missions
  const [missions, setMissions] = useState([
    { title: "", priority: "high" as const },
    { title: "", priority: "med" as const },
    { title: "", priority: "med" as const },
    { title: "", priority: "low" as const },
    { title: "", priority: "low" as const },
  ]);
  // Step 4: Habits
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  // Step 5: Goals
  const [goals, setGoals] = useState([{ title: "", target: "", unit: "$", deadline: "" }]);
  // Step 6: Prove It
  const [proveUsername, setProveUsername] = useState("");
  const [proveBio, setProveBio] = useState("");
  // Step 7: Review
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const totalSteps = 7;
  const progressPct = (step / totalSteps) * 100;

  const stepTitles = [
    { title: "Your Profile", subtitle: "Tell us about yourself so we can personalize your experience.", icon: <IconUser size={20} className="text-axis-accent" /> },
    { title: "Income Streams", subtitle: "What are your sources of revenue? We'll track each one separately.", icon: <IconRevenue size={20} className="text-axis-accent" /> },
    { title: "Today's Missions", subtitle: "What do you need to accomplish today? Set up to 5 priorities.", icon: <IconTarget size={20} className="text-axis-accent" /> },
    { title: "Daily Habits", subtitle: "Choose the habits you want to build. Consistency is everything.", icon: <IconHabits size={20} className="text-axis-accent" /> },
    { title: "Your Goals", subtitle: "Set measurable goals with deadlines. We'll track your progress.", icon: <IconGoals size={20} className="text-axis-accent" /> },
    { title: "Public Profile", subtitle: "Set up your Prove It page. Show the world your accountability.", icon: <IconProve size={20} className="text-axis-accent" /> },
    { title: "All Set!", subtitle: "Review your setup. Everything looks ready — let's go.", icon: <IconCheck size={20} className="text-axis-accent" /> },
  ];

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && userType !== null;
      case 2: return streams.some((s) => s.name.trim().length > 0);
      case 3: return missions.some((m) => m.title.trim().length > 0);
      case 4: return selectedHabits.length + customHabits.length >= 2;
      case 5: return goals.some((g) => g.title.trim().length > 0 && g.target.length > 0);
      case 6: return proveUsername.trim().length >= 3;
      case 7: return true;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Update profile
    await supabase.from("users").update({
      name: name.trim(),
      user_type: userType,
      timezone,
      onboarding_done: true,
      prove_it_username: proveUsername.trim().toLowerCase(),
      prove_it_bio: proveBio.trim() || null,
    }).eq("id", user.id);

    // 2. Create revenue streams
    const validStreams = streams.filter((s) => s.name.trim());
    if (validStreams.length > 0) {
      await supabase.from("revenue_streams").insert(
        validStreams.map((s) => ({
          user_id: user.id,
          name: s.name.trim(),
          color: s.color,
        }))
      );
    }

    // 3. Create missions
    const today = new Date().toISOString().split("T")[0];
    const validMissions = missions.filter((m) => m.title.trim());
    if (validMissions.length > 0) {
      await supabase.from("missions").insert(
        validMissions.map((m, i) => ({
          user_id: user.id,
          title: m.title.trim(),
          priority: m.priority,
          date: today,
          sort_order: i,
        }))
      );
    }

    // 4. Create habits
    const allHabits = [
      ...selectedHabits.map((name) => ({ name, icon: "◆" })),
      ...customHabits.map((name) => ({ name, icon: "◆" })),
    ];
    if (allHabits.length > 0) {
      await supabase.from("habits").insert(
        allHabits.map((h, i) => ({
          user_id: user.id,
          name: h.name,
          icon: h.icon,
          sort_order: i,
        }))
      );
    }

    // 5. Create goals
    const validGoals = goals.filter((g) => g.title.trim() && g.target);
    if (validGoals.length > 0) {
      await supabase.from("goals").insert(
        validGoals.map((g) => ({
          user_id: user.id,
          title: g.title.trim(),
          target_value: parseFloat(g.target) || 100,
          unit: g.unit || "%",
          deadline: g.deadline || null,
        }))
      );
    }

    // 6. Send welcome email
    try {
      await fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: name.trim() }),
      });
    } catch {}

    router.push("/dashboard");
    router.refresh();
  };

  const currentStep = stepTitles[step - 1];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <AxisLogo size={24} />
        <span className="text-sm font-bold text-white">AXIS Setup</span>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-white/40">Step {step} of {totalSteps}</span>
          <button
            onClick={() => {
              if (confirm("Skip setup? You can configure everything later in Settings.")) {
                handleComplete();
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
        {/* Step indicators */}
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

      {/* Step Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-axis-accent/10 border border-axis-accent/20 flex items-center justify-center">
          {currentStep.icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
          <p className="text-sm text-white/40">{currentStep.subtitle}</p>
        </div>
      </div>

      {/* ── Step 1: Profile ── */}
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
            <div className="grid grid-cols-2 gap-3">
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

      {/* ── Step 2: Revenue Streams ── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Add all your income sources — freelancing, SaaS, courses, products, salary, etc.
            Each stream gets tracked separately so you can see exactly where your money comes from.
          </p>
          {streams.map((stream, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="color"
                value={stream.color}
                onChange={(e) => {
                  const updated = [...streams];
                  updated[i].color = e.target.value;
                  setStreams(updated);
                }}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                placeholder={
                  i === 0 ? "e.g. Freelance Design" :
                  i === 1 ? "e.g. SaaS Revenue" :
                  "Another income source..."
                }
                value={stream.name}
                onChange={(e) => {
                  const updated = [...streams];
                  updated[i].name = e.target.value;
                  setStreams(updated);
                }}
                className="flex-1 bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20 focus:border-axis-accent/50 transition-all"
                autoFocus={i === 0}
              />
              {streams.length > 1 && (
                <button
                  onClick={() => setStreams(streams.filter((_, j) => j !== i))}
                  className="text-white/20 hover:text-white/50 transition-colors text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {streams.length < 5 && (
            <button
              onClick={() => setStreams([...streams, { name: "", color: ["#CDFF4F","#4FC1FF","#FF4F8E","#FFB74F","#A64FFF"][streams.length] || "#CDFF4F" }])}
              className="w-full text-center text-xs font-medium text-white/30 border border-dashed border-white/[0.08] rounded-xl py-3 hover:border-white/[0.15] hover:text-white/50 transition-all"
            >
              + Add another stream
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Missions ── */}
      {step === 3 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Missions are your daily priorities — the things that move the needle.
            Set up to 5 for today, ranked by importance. You can always change them later.
          </p>
          {missions.map((mission, i) => (
            <div key={i} className="flex items-center gap-3">
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
                  `Task ${i + 1} (optional)...`
                }
                value={mission.title}
                onChange={(e) => {
                  const updated = [...missions];
                  updated[i].title = e.target.value;
                  setMissions(updated);
                }}
                className="flex-1 bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20 focus:border-axis-accent/50 transition-all"
                autoFocus={i === 0}
              />
              <select
                value={mission.priority}
                onChange={(e) => {
                  const updated = [...missions];
                  updated[i].priority = e.target.value as "high" | "med" | "low";
                  setMissions(updated);
                }}
                className="bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-white/40 rounded-lg px-2 py-2 outline-none"
              >
                <option value="high">High</option>
                <option value="med">Med</option>
                <option value="low">Low</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 4: Habits ── */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Pick 2–3 daily habits you want to track. These build your streak and feed into your Focus Score.
            Consistency here separates doers from dreamers.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {suggestedHabits.map((habit) => {
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
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all border ${
                    isSelected
                      ? "bg-axis-accent/10 border-axis-accent/30"
                      : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-axis-accent/20" : "bg-white/[0.04]"
                  }`}>
                    <IconHabits size={14} className={isSelected ? "text-axis-accent" : "text-white/30"} />
                  </div>
                  <span className="text-sm text-white/80">{habit.name}</span>
                  {isSelected && <IconCheck size={14} className="text-axis-accent ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* Custom habits */}
          {customHabits.map((h, i) => (
            <div key={i} className="flex items-center gap-2 bg-axis-accent/5 border border-axis-accent/15 rounded-xl px-4 py-3">
              <IconCheck size={14} className="text-axis-accent" />
              <span className="text-sm text-white/70 flex-1">{h}</span>
              <button onClick={() => setCustomHabits(customHabits.filter((_, j) => j !== i))} className="text-white/20 text-xs">×</button>
            </div>
          ))}

          <div className="flex items-center gap-2">
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
              className="flex-1 bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20"
            />
            <button
              onClick={() => {
                if (customInput.trim() && selectedHabits.length + customHabits.length < 5) {
                  setCustomHabits([...customHabits, customInput.trim()]);
                  setCustomInput("");
                }
              }}
              className="bg-white/[0.06] text-white/50 text-sm px-4 py-3 rounded-xl hover:bg-white/[0.1] transition-all"
            >
              Add
            </button>
          </div>
          <p className="text-[10px] font-mono text-white/20">{selectedHabits.length + customHabits.length}/5 selected (min 2)</p>
        </div>
      )}

      {/* ── Step 5: Goals ── */}
      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Goals are your bigger targets — revenue milestones, project completions, growth metrics.
            Set a target number and a deadline. We&apos;ll show your progress on the dashboard.
          </p>
          {goals.map((goal, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder={i === 0 ? "e.g. Hit $10K Monthly Revenue" : `Goal ${i + 1} (optional)`}
                value={goal.title}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[i].title = e.target.value;
                  setGoals(updated);
                }}
                className="w-full bg-white/[0.06] border border-white/[0.08] text-sm text-white rounded-xl px-4 py-3 outline-none placeholder:text-white/20"
                autoFocus={i === 0}
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-white/25 block mb-1">Target</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={goal.target}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[i].target = e.target.value;
                      setGoals(updated);
                    }}
                    className="w-full bg-white/[0.06] border border-white/[0.08] text-xs text-white rounded-lg px-3 py-2 outline-none placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/25 block mb-1">Unit</label>
                  <select
                    value={goal.unit}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[i].unit = e.target.value;
                      setGoals(updated);
                    }}
                    className="w-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/50 rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="$">$ (Revenue)</option>
                    <option value="%">% (Percentage)</option>
                    <option value="units">Units</option>
                    <option value="subscribers">Subscribers</option>
                    <option value="clients">Clients</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/25 block mb-1">Deadline</label>
                  <input
                    type="date"
                    value={goal.deadline}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[i].deadline = e.target.value;
                      setGoals(updated);
                    }}
                    className="w-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/50 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
          {goals.length < 3 && (
            <button
              onClick={() => setGoals([...goals, { title: "", target: "", unit: "$", deadline: "" }])}
              className="w-full text-center text-xs font-medium text-white/30 border border-dashed border-white/[0.08] rounded-xl py-3 hover:border-white/[0.15] hover:text-white/50 transition-all"
            >
              + Add another goal
            </button>
          )}
        </div>
      )}

      {/* ── Step 6: Prove It ── */}
      {step === 6 && (
        <div className="space-y-5 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Your Prove It profile is your public accountability page. Share it with partners,
            on social media, or embed it anywhere. People can see your streaks, grades, and activity.
          </p>
          <div>
            <label className="text-xs font-mono text-white/40 block mb-2">Username</label>
            <div className="flex items-center gap-0 bg-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden">
              <span className="text-xs font-mono text-white/20 px-4 bg-white/[0.03] py-3.5 border-r border-white/[0.06]">axis.app/prove/</span>
              <input
                type="text"
                placeholder="your-name"
                value={proveUsername}
                onChange={(e) => setProveUsername(e.target.value.replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase())}
                className="flex-1 bg-transparent text-sm text-white px-3 py-3 outline-none placeholder:text-white/20 font-mono"
                autoFocus
              />
            </div>
            {proveUsername.length > 0 && proveUsername.length < 3 && (
              <p className="text-[10px] text-red-400 mt-1">Username must be at least 3 characters</p>
            )}
          </div>
          <div>
            <label className="text-xs font-mono text-white/40 block mb-2">Bio (optional)</label>
            <input
              type="text"
              placeholder="e.g. Entrepreneur · Building my SaaS"
              value={proveBio}
              onChange={(e) => setProveBio(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20"
              maxLength={100}
            />
          </div>

          {/* Preview */}
          <div className="bg-axis-dark border border-white/[0.06] rounded-xl p-5 text-center">
            <p className="text-[10px] font-mono text-white/20 mb-3">PREVIEW</p>
            <div className="w-14 h-14 rounded-2xl bg-axis-accent/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold font-mono text-axis-accent">
                {name ? name.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <p className="text-base font-semibold text-white">{name || "Your Name"}</p>
            <p className="text-xs text-white/30 mt-0.5">{proveBio || "Your bio"}</p>
            <p className="text-[10px] font-mono text-white/15 mt-2">axis.app/prove/{proveUsername || "..."}</p>
          </div>
        </div>
      )}

      {/* ── Step 7: Review ── */}
      {step === 7 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconUser size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">PROFILE</span>
              </div>
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-white/30">{userType} · {timezone.split("/")[1]}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconRevenue size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">STREAMS</span>
              </div>
              <p className="text-sm font-semibold text-white">{streams.filter((s) => s.name.trim()).length} stream{streams.filter((s) => s.name.trim()).length !== 1 ? "s" : ""}</p>
              <p className="text-xs text-white/30 truncate">{streams.filter((s) => s.name.trim()).map((s) => s.name).join(", ")}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconTarget size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">MISSIONS</span>
              </div>
              <p className="text-sm font-semibold text-white">{missions.filter((m) => m.title.trim()).length} for today</p>
              <p className="text-xs text-white/30 truncate">{missions.filter((m) => m.title.trim())[0]?.title || "—"}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconHabits size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">HABITS</span>
              </div>
              <p className="text-sm font-semibold text-white">{selectedHabits.length + customHabits.length} daily</p>
              <p className="text-xs text-white/30 truncate">{[...selectedHabits, ...customHabits].join(", ")}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconGoals size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">GOALS</span>
              </div>
              <p className="text-sm font-semibold text-white">{goals.filter((g) => g.title.trim()).length} set</p>
              <p className="text-xs text-white/30 truncate">{goals.filter((g) => g.title.trim())[0]?.title || "—"}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconProve size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">PROVE IT</span>
              </div>
              <p className="text-sm font-semibold text-white">@{proveUsername}</p>
              <p className="text-xs text-white/30">{proveBio || "No bio"}</p>
            </div>
          </div>

          <div className="bg-axis-accent/10 border border-axis-accent/20 rounded-xl p-4 text-center">
            <p className="text-sm text-axis-accent font-medium">
              Everything&apos;s connected. Your dashboard, missions, habits, revenue, and goals are ready to go.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pb-8">
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
            className="flex items-center gap-1.5 bg-axis-accent text-axis-dark text-sm font-semibold px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue <IconChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex items-center gap-2 bg-axis-accent text-axis-dark text-sm font-semibold px-8 py-3 rounded-xl hover:bg-axis-accent/90 transition-all active:scale-[0.98] disabled:opacity-50"
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
