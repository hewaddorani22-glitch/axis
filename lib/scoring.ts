/**
 * AXIS Focus Score Algorithm
 *
 * Weighted score (0-100) calculated daily:
 * - Mission completion rate: 40%
 * - Habit completion rate: 40%
 * - Streak length (normalized): 20%
 *
 * Grade scale:
 * A+ = 95-100, A = 90-94, A- = 85-89
 * B+ = 80-84, B = 70-79
 * C = 60-69, D = 50-59, F = 0-49
 */

export interface ScoreInput {
  missionsCompleted: number;
  missionsTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  streakDays: number;
}

export interface ScoreResult {
  focusScore: number;
  grade: string;
  missionPct: number;
  habitPct: number;
  streakNormalized: number;
}

const STREAK_MAX = 30; // Streak normalized against 30-day max

export function calculateFocusScore(input: ScoreInput): ScoreResult {
  const missionPct =
    input.missionsTotal > 0
      ? (input.missionsCompleted / input.missionsTotal) * 100
      : 0;

  const habitPct =
    input.habitsTotal > 0
      ? (input.habitsCompleted / input.habitsTotal) * 100
      : 0;

  const streakNormalized = Math.min(input.streakDays / STREAK_MAX, 1) * 100;

  const focusScore = Math.round(
    missionPct * 0.4 + habitPct * 0.4 + streakNormalized * 0.2
  );

  return {
    focusScore: Math.min(focusScore, 100),
    grade: getGrade(focusScore),
    missionPct: Math.round(missionPct),
    habitPct: Math.round(habitPct),
    streakNormalized: Math.round(streakNormalized),
  };
}

export function getGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

/**
 * Daily Scorecard for Prove It Mode
 * - Missions completed / total (40% weight)
 * - Habits completed / total (40% weight)
 * - Revenue logged today (10% weight)
 * - Streak maintained (10% weight)
 */
export interface ScorecardInput {
  missionsCompleted: number;
  missionsTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  revenueLoggedToday: boolean;
  streakMaintained: boolean;
}

export function calculateDailyScorecard(input: ScorecardInput): {
  score: number;
  grade: string;
} {
  const missionPct =
    input.missionsTotal > 0
      ? input.missionsCompleted / input.missionsTotal
      : 0;

  const habitPct =
    input.habitsTotal > 0 ? input.habitsCompleted / input.habitsTotal : 0;

  const score = Math.round(
    missionPct * 40 +
      habitPct * 40 +
      (input.revenueLoggedToday ? 10 : 0) +
      (input.streakMaintained ? 10 : 0)
  );

  return { score, grade: getGrade(score) };
}
