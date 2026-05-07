export type QuizGoal = "money" | "grades" | "discipline" | "start";
export type QuizTimeWaster = "phone" | "procrast" | "chaos" | "motivation";

const QUIZ_GOALS: QuizGoal[] = ["money", "grades", "discipline", "start"];
const QUIZ_TIME_WASTERS: QuizTimeWaster[] = ["phone", "procrast", "chaos", "motivation"];

export function isQuizGoal(value: unknown): value is QuizGoal {
  return typeof value === "string" && (QUIZ_GOALS as string[]).includes(value);
}

export function isQuizTimeWaster(value: unknown): value is QuizTimeWaster {
  return typeof value === "string" && (QUIZ_TIME_WASTERS as string[]).includes(value);
}

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

// Per segment (mapped via GOAL_TO_USER_TYPE):
//   money → Hustler (entrepreneur)
//   discipline → Climber (employed + ambitious)
//   start → Creator
//   grades → Builder (student)
const FIRST_MISSION_DE: Record<QuizGoal, string> = {
  money: "Eine Sache, die heute Umsatz bringt",
  grades: "60 Min fokussiert lernen — ohne Handy",
  discipline: "30 Min am Side-Project — heute",
  start: "Einen Post oder ein Stück Content fertig machen",
};

const FIRST_MISSION_EN: Record<QuizGoal, string> = {
  money: "Do one thing that earns money today",
  grades: "60 min focused study — phone away",
  discipline: "30 min on the side project — today",
  start: "Ship one post or piece of content",
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
