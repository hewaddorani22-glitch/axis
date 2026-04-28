import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/resend";
import { calculateFocusScore } from "@/lib/scoring";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: users } = await supabase.from("users").select("id, email, name");
    if (!users) return NextResponse.json({ sent: 0 });

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    let sentCount = 0;

    for (const user of users) {
      // Get week stats
      const [missionsRes, habitsRes, revenueRes] = await Promise.all([
        supabase
          .from("missions")
          .select("status")
          .eq("user_id", user.id)
          .gte("date", weekAgoStr)
          .lte("date", todayStr),
        supabase
          .from("habit_logs")
          .select("completed")
          .eq("user_id", user.id)
          .gte("date", weekAgoStr)
          .lte("date", todayStr),
        supabase
          .from("revenue_entries")
          .select("amount")
          .eq("user_id", user.id)
          .gte("date", weekAgoStr)
          .lte("date", todayStr),
      ]);

      const missionsTotal = missionsRes.data?.length || 0;
      const missionsCompleted = missionsRes.data?.filter((m) => m.status === "done").length || 0;
      const habitsTotal = habitsRes.data?.length || 0;
      const habitsCompleted = habitsRes.data?.filter((h) => h.completed).length || 0;
      const revenueEarned = revenueRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const score = calculateFocusScore({
        missionsCompleted,
        missionsTotal: Math.max(missionsTotal, 1),
        habitsCompleted,
        habitsTotal: Math.max(habitsTotal, 1),
        streakDays: 0, // Simplified for weekly digest
      });

      await sendWeeklyDigest(user.email, user.name || "there", {
        missionsCompleted,
        missionsTotal,
        revenueEarned,
        habitsCompleted,
        streakDays: 0,
        focusScore: score.focusScore,
        grade: score.grade,
      });
      sentCount++;
    }

    return NextResponse.json({ sent: sentCount });
  } catch (error: any) {
    console.error("Weekly digest cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
