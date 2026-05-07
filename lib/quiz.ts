export type QuizGoal = "money" | "grades" | "discipline" | "start";
export type QuizTimeWaster = "phone" | "procrast" | "chaos" | "motivation";

export type QuizAnswers = {
  goal: QuizGoal;
  age: number;
  timeWaster: QuizTimeWaster;
  completedAt: number;
};

export const QUIZ_STORAGE_KEY = "lomoura-quiz";

const GOAL_TO_USER_TYPE: Record<QuizGoal, "entrepreneur" | "student" | "creator" | "professional"> = {
  money: "entrepreneur",
  grades: "student",
  discipline: "professional",
  start: "creator",
};

const FIRST_MISSION_DE: Record<QuizGoal, string> = {
  money: "Eine Sache machen, die heute Geld bringt",
  grades: "30 Minuten fokussiert lernen",
  discipline: "Nach Plan starten — eine Sache, jetzt",
  start: "Eine kleine Sache anfangen — egal welche",
};

const FIRST_MISSION_EN: Record<QuizGoal, string> = {
  money: "Do one thing that earns money today",
  grades: "Study focused for 30 minutes",
  discipline: "Start on plan — one thing, now",
  start: "Begin one small thing — any thing",
};

export function suggestUserType(goal: QuizGoal) {
  return GOAL_TO_USER_TYPE[goal];
}

export function suggestFirstMission(goal: QuizGoal, locale: "de" | "en"): string {
  return (locale === "de" ? FIRST_MISSION_DE : FIRST_MISSION_EN)[goal];
}

export function loadQuizAnswers(): QuizAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizAnswers>;
    if (
      parsed &&
      typeof parsed.age === "number" &&
      typeof parsed.completedAt === "number" &&
      typeof parsed.goal === "string" &&
      typeof parsed.timeWaster === "string"
    ) {
      return parsed as QuizAnswers;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveQuizAnswers(answers: QuizAnswers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // ignore
  }
}

export function clearQuizAnswers() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    // ignore
  }
}
