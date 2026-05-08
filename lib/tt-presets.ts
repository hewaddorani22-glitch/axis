import type { QuizGoal, QuizTimeWaster } from "@/lib/quiz";

export type TtPreset = {
  goal: QuizGoal;
  age?: number;
  timeWaster?: QuizTimeWaster;
  // The stage to land on inside /start. "q2" is the default — goal is set,
  // user invests in age + time-waster (IKEA effect) before seeing preview.
  startStage?: "q1" | "q2" | "q3" | "preview";
  hookDe?: string;
  hookEn?: string;
};

export const TT_PRESETS: Record<string, TtPreset> = {
  money: {
    goal: "money",
    age: 22,
    startStage: "q2",
    hookDe: "Bau dein €1.000-Nebeneinkommen-System.",
    hookEn: "Build your €1,000 side-income system.",
  },
  side: {
    goal: "money",
    age: 24,
    startStage: "q2",
    hookDe: "Side-Hustle ohne Chaos. In 60 Sekunden.",
    hookEn: "A side hustle without the chaos. In 60 seconds.",
  },
  business: {
    goal: "money",
    age: 27,
    startStage: "q2",
    hookDe: "Solo-Business ohne Chaos. Eine Mission. Jeden Tag.",
    hookEn: "A solo business without the chaos. One mission. Every day.",
  },
  student: {
    goal: "grades",
    age: 17,
    startStage: "q2",
    hookDe: "Bessere Noten. Ohne 8h Lernsessions.",
    hookEn: "Better grades. Without 8-hour grind sessions.",
  },
  grades: {
    goal: "grades",
    age: 19,
    startStage: "q2",
    hookDe: "Schule, Uni, Prüfung — dein Plan in 60 Sek.",
    hookEn: "School, college, exams — your plan in 60s.",
  },
  abi: {
    goal: "grades",
    age: 17,
    startStage: "q2",
    hookDe: "Abi-Boost: Plan, Streak, Ergebnis.",
    hookEn: "Exam boost: plan, streak, result.",
  },
  discipline: {
    goal: "discipline",
    age: 22,
    startStage: "q2",
    hookDe: "Disziplin als System. Nicht als Gefühl.",
    hookEn: "Discipline as a system. Not a feeling.",
  },
  routine: {
    goal: "discipline",
    age: 23,
    startStage: "q2",
    hookDe: "Routinen die halten — auch wenn du schlechte Laune hast.",
    hookEn: "Routines that stick — even on bad days.",
  },
  fitness: {
    goal: "discipline",
    age: 21,
    timeWaster: "phone",
    startStage: "q2",
    hookDe: "Sport-Streak ohne Selbsthass.",
    hookEn: "A workout streak without self-loathing.",
  },
  start: {
    goal: "start",
    age: 22,
    startStage: "q2",
    hookDe: "Endlich anfangen. Heute. Eine Sache.",
    hookEn: "Finally get started. Today. One thing.",
  },
  procrast: {
    goal: "start",
    age: 22,
    timeWaster: "procrast",
    startStage: "q2",
    hookDe: "Stop Aufschieben. Eine Mission. Jetzt.",
    hookEn: "Stop procrastinating. One mission. Now.",
  },
  phone: {
    goal: "discipline",
    age: 19,
    timeWaster: "phone",
    startStage: "q2",
    hookDe: "Weg vom Phone. Hin zu deinem Leben.",
    hookEn: "Off the phone. Back to your life.",
  },
};

export function getTtPreset(slug: string): TtPreset | null {
  const key = slug.toLowerCase().trim();
  return TT_PRESETS[key] ?? null;
}

export const TT_SLUGS = Object.keys(TT_PRESETS);
