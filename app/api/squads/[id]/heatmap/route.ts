import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type HeatmapStatus = "done" | "missed";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userClient = await createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: currentMembership, error: membershipError } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (!currentMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: memberRows, error: membersError } = await admin
    .from("group_members")
    .select("user_id, joined_at")
    .eq("group_id", params.id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  if (!memberRows?.length) {
    return NextResponse.json({ members: [] });
  }

  const userIds = memberRows.map((row) => row.user_id);
  const today = new Date();
  const todayStr = formatDate(today);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 59);

  const [profilesRes, logsRes] = await Promise.all([
    admin.from("users").select("id, name, email").in("id", userIds),
    admin
      .from("habit_logs")
      .select("user_id, date, completed")
      .in("user_id", userIds)
      .gte("date", formatDate(sixtyDaysAgo))
      .lte("date", todayStr)
      .eq("completed", true),
  ]);

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
  }

  if (logsRes.error) {
    return NextResponse.json({ error: logsRes.error.message }, { status: 500 });
  }

  const profilesById = new Map((profilesRes.data || []).map((profile) => [profile.id, profile]));
  const logsByUser = new Map<string, Set<string>>();

  for (const log of logsRes.data || []) {
    if (!logsByUser.has(log.user_id)) logsByUser.set(log.user_id, new Set());
    logsByUser.get(log.user_id)!.add(log.date);
  }

  const members = memberRows
    .map((row) => {
      const profile = profilesById.get(row.user_id);
      const displayName = profile?.name || profile?.email?.split("@")[0] || "User";
      const logDates = logsByUser.get(row.user_id) || new Set<string>();
      const week: HeatmapStatus[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        week.push(logDates.has(formatDate(date)) ? "done" : "missed");
      }

      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        if (logDates.has(formatDate(date))) streak++;
        else break;
      }

      return {
        userId: row.user_id,
        displayName,
        initials: displayName.charAt(0).toUpperCase(),
        week,
        todayDone: logDates.has(todayStr),
        streak,
      };
    })
    .sort((a, b) => {
      if (a.todayDone !== b.todayDone) return a.todayDone ? -1 : 1;
      return b.streak - a.streak;
    });

  return NextResponse.json({ members });
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
