"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AxisLogo,
  IconUser,
  IconTarget,
  IconHabits,
  IconProve,
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
  { name: "Deep Work", icon: <IconFocus size={16} /> },
  { name: "Content Creation", icon: <IconEdit size={16} /> },
  { name: "Exercise", icon: <IconEnergy size={16} /> },
  { name: "Reading", icon: <IconReview size={16} /> },
  { name: "Outreach", icon: <IconGlobe size={16} /> },
  { name: "Meditation", icon: <IconHabits size={16} /> },
  { name: "Journaling", icon: <IconBriefing size={16} /> },
  { name: "Cold Calling", icon: <IconLink size={16} /> },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabaseCheck = createClient();

  useEffect(() => {
    supabaseCheck.from("users").select("onboarding_done").single().then(({ data }) => {
      if (data?.onboarding_done) router.replace("/dashboard");
    });
  }, []); // eslint-disable-line

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
      entrepreneur: ["Review metrics", "Customer support calls", "Plan Q3 roadmap", "Write marketing copy", "Sync with team"],
      student: ["Study for finals", "Complete assignment", "Read chapters 4-5", "Review notes", "Organize desk"],
      creator: ["Draft new script", "Edit latest video", "Post on socials", "Reply to comments", "Brainstorm ideas"],
      professional: ["Finish TPS report", "Prepare presentation", "Inbox zero", "Weekly sync", "Follow up leads"],
    };
    const titles = examples[userType] || [];
    setMissions(titles.map((t, i) => ({
      title: t,
      priority: i === 0 ? "high" : i < 3 ? "med" : "low"
    })));
  }, [userType]);

  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [proveUsername, setProveUsername] = useState("");
  const [proveBio, setProveBio] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const totalSteps = 5;
  const progressPct = (step / totalSteps) * 100;

  const stepTitles = [
    { title: "Your Profile", subtitle: "Tell us about yourself so we can personalize your experience.", icon: <IconUser size={20} className="text-axis-accent" /> },
    { title: "Today's Tasks", subtitle: "What do you need to accomplish today? Set up to 5 priorities.", icon: <IconTarget size={20} className="text-axis-accent" /> },
    { title: "Habits", subtitle: "Choose the habits you want to build. Consistency is everything.", icon: <IconHabits size={20} className="text-axis-accent" /> },
    { title: "Public Profile", subtitle: "Set up your public profile. Show the world your accountability.", icon: <IconProve size={20} className="text-axis-accent" /> },
    { title: "All Set!", subtitle: "Review your setup. Everything looks ready: let's go.", icon: <IconCheck size={20} className="text-axis-accent" /> },
  ];

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && userType !== null;
      case 2: return missions.some((m) => m.title.trim().length > 0);
      case 3: return selectedHabits.length + customHabits.length >= 2;
      case 4: return proveUsername.trim().length >= 3;
      case 5: return true;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("users").update({
      name: name.trim(),
      user_type: userType,
      timezone,
      onboarding_done: true,
      prove_it_username: proveUsername.trim().toLowerCase(),
      prove_it_bio: proveBio.trim() || null,
    }).eq("id", user.id);

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

    const allHabits = [
      ...selectedHabits.map((name) => ({ name, icon: "IconHabits" })),
      ...customHabits.map((name) => ({ name, icon: "IconHabits" })),
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
      <div className="flex items-center gap-3 mb-2">
        <AxisLogo size={24} />
        <span className="text-sm font-bold text-white">AXIS Setup</span>
      </div>

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

      <div className="flex items-center gap-3 mb-6">
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

      {step === 2 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Tasks are your daily priorities: the things that move the needle.
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
                  `Task ${ i + 1 } (optional)...`
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

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Pick 2-3 daily habits you want to track. These build your streak and feed into your system health.
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
                    <div className={isSelected ? "text-axis-accent" : "text-white/30"}>
                      {habit.icon}
                    </div>
                  </div>
                  <span className="text-sm text-white/80">{habit.name}</span>
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

      {step === 4 && (
        <div className="space-y-5 animate-fade-in">
          <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            Your public profile is your public accountability page. Share it with partners,
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
              placeholder="e.g. Entrepreneur / Building my SaaS"
              value={proveBio}
              onChange={(e) => setProveBio(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/20"
              maxLength={100}
            />
          </div>

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

      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconUser size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">PROFILE</span>
              </div>
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-white/30">{userType} / {timezone.split("/")[1]}</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconTarget size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">MISSIONS</span>
              </div>
              <p className="text-sm font-semibold text-white">{missions.filter((m) => m.title.trim()).length} for today</p>
              <p className="text-xs text-white/30 truncate">{missions.filter((m) => m.title.trim())[0]?.title || "0"}</p>
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
                <IconProve size={14} className="text-axis-accent" />
                <span className="text-[10px] font-mono text-white/40">PROVE IT</span>
              </div>
              <p className="text-sm font-semibold text-white">@{proveUsername}</p>
              <p className="text-xs text-white/30">{proveBio || "No bio"}</p>
            </div>
          </div>

          <div className="bg-axis-accent/10 border border-axis-accent/20 rounded-xl p-4 text-center">
            <p className="text-sm text-axis-accent font-medium">
              Everything's connected. Your dashboard, missions, and habits are ready to go.
            </p>
          </div>
        </div>
      )}

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
