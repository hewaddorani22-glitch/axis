import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendStreakWarning } from "@/lib/resend";

// Service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Find users with active streaks who haven't logged today
    const { data: users } = await supabase
      .from("users")
      .select("id, email, name");

    if (!users) return NextResponse.json({ sent: 0 });

    let sentCount = 0;

    for (const user of users) {
      // Check if user has completed anything today
      const [missionsRes, habitsRes] = await Promise.all([
        supabase
          .from("missions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "done")
          .eq("date", today)
          .limit(1),
        supabase
          .from("habit_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", today)
          .eq("completed", true)
          .limit(1),
      ]);

      const hasActivity = (missionsRes.data?.length || 0) > 0 || (habitsRes.data?.length || 0) > 0;

      if (!hasActivity) {
        // Check if they have an active streak (did something yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const { data: yesterdayMissions } = await supabase
          .from("missions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "done")
          .eq("date", yesterdayStr)
          .limit(1);

        if (yesterdayMissions && yesterdayMissions.length > 0) {
          // Has a streak at risk: send warning
          await sendStreakWarning(user.email, user.name || "there", 1);
          sentCount++;
        }
      }
    }

    return NextResponse.json({ sent: sentCount });
  } catch (error: any) {
    console.error("Streak warning cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
