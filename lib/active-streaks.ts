import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Counts users who completed at least one mission AND at least one habit
 * today (UTC). Used for the live "X streaks active today" counter on the
 * landing page. Runs server-side at request time and is cached by Next.
 *
 * Returns a baseline of 0 if either data set is empty so the counter is
 * still meaningful while the user base is small.
 */
export async function getActiveStreaksToday(): Promise<number> {
  try {
    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const [missionsRes, habitsRes] = await Promise.all([
      admin.from("missions").select("user_id").eq("status", "done").eq("date", today),
      admin.from("habit_logs").select("user_id").eq("completed", true).eq("date", today),
    ]);

    if (missionsRes.error || habitsRes.error) return 0;

    const missionUsers = new Set((missionsRes.data ?? []).map((m: { user_id: string }) => m.user_id));
    const habitUsers = new Set((habitsRes.data ?? []).map((h: { user_id: string }) => h.user_id));

    let count = 0;
    for (const uid of missionUsers) {
      if (habitUsers.has(uid)) count++;
    }
    return count;
  } catch {
    return 0;
  }
}
