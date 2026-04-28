import { calculateFocusScore } from "@/lib/scoring";

export type AchievementType =
  | "100_missions"
  | "perfect_week"
  | "30_day_streak"
  | "first_10k";

export interface ProveAchievement {
  type: AchievementType;
  title: string;
  earned: boolean;
}

export interface RevenueEntryForStats {
  amount: number | string | null;
  date: string | null;
}

interface BuildProveStatsInput {
  todayDone: number;
  todayTotal: number;
  todayHabits: number;
  habitsTotal: number;
  missionDates: string[];
  habitDates: string[];
  earnedTypes: string[];
  totalMissionsDone: number;
  revenueEntries: RevenueEntryForStats[];
}

export const proveAchievementDefinitions: Array<{
  type: AchievementType;
  title: string;
}> = [
  { type: "100_missions", title: "100 Missions Done" },
  { type: "perfect_week", title: "Perfect Week" },
  { type: "30_day_streak", title: "30-Day Streak" },
  { type: "first_10k", title: "First $10K Month" },
];

export function daysAgo(n: number, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

export function buildProveStats(input: BuildProveStatsInput) {
  const missionDateSet = new Set(input.missionDates);
  const habitDateSet = new Set(input.habitDates);
  const earnedTypeSet = new Set(input.earnedTypes);

  const heatmap: number[] = [];
  for (let i = 27; i >= 0; i--) {
    const date = daysAgo(i);
    const hasMission = missionDateSet.has(date);
    const hasHabit = habitDateSet.has(date);
    heatmap.push(hasMission && hasHabit ? 1 : hasMission || hasHabit ? 0.5 : 0);
  }

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const date = daysAgo(i);
    if (missionDateSet.has(date) && habitDateSet.has(date)) {
      streak++;
    } else {
      break;
    }
  }

  let perfectWeek = false;
  for (let start = 0; start <= 23; start++) {
    let allDone = true;
    for (let day = start; day < start + 7; day++) {
      const date = daysAgo(day);
      if (!missionDateSet.has(date) || !habitDateSet.has(date)) {
        allDone = false;
        break;
      }
    }
    if (allDone) {
      perfectWeek = true;
      break;
    }
  }

  const revenueByMonth = input.revenueEntries.reduce<Record<string, number>>((acc, entry) => {
    if (!entry.date) return acc;
    const amount =
      typeof entry.amount === "number" ? entry.amount : Number.parseFloat(entry.amount || "0");
    const month = entry.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + (Number.isFinite(amount) ? amount : 0);
    return acc;
  }, {});

  const hit10kMonth = Object.values(revenueByMonth).some((total) => total >= 10000);
  const completionRate = Math.round((heatmap.filter((value) => value > 0).length / 28) * 100);
  const score = calculateFocusScore({
    missionsCompleted: input.todayDone,
    missionsTotal: input.todayTotal,
    habitsCompleted: input.todayHabits,
    habitsTotal: input.habitsTotal,
    streakDays: streak,
  });

  const achievements: ProveAchievement[] = proveAchievementDefinitions.map((achievement) => {
    let earned = earnedTypeSet.has(achievement.type);
    if (achievement.type === "100_missions") earned ||= input.totalMissionsDone >= 100;
    if (achievement.type === "perfect_week") earned ||= perfectWeek;
    if (achievement.type === "30_day_streak") earned ||= streak >= 30;
    if (achievement.type === "first_10k") earned ||= hit10kMonth;
    return { ...achievement, earned };
  });

  return {
    streak,
    grade: score.grade,
    focusScore: score.focusScore,
    completionRate,
    heatmap,
    achievements,
  };
}
