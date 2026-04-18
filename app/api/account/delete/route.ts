import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/account/delete
 * Deletes all user data and the auth account.
 * Uses admin client to delete across all tables (RLS bypassed).
 */
export async function DELETE() {
  const userClient = await createServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const userId = user.id;

  // Delete all user data in dependency order (children before parents)
  await Promise.all([
    admin.from("habit_logs").delete().eq("user_id", userId),
    admin.from("nudges").delete().or(`from_user.eq.${userId},to_user.eq.${userId}`),
    admin.from("achievements").delete().eq("user_id", userId),
    admin.from("streak_freezes").delete().eq("user_id", userId),
    admin.from("daily_scores").delete().eq("user_id", userId),
    admin.from("weekly_reviews").delete().eq("user_id", userId),
  ]);

  await Promise.all([
    admin.from("missions").delete().eq("user_id", userId),
    admin.from("habits").delete().eq("user_id", userId),
    admin.from("goals").delete().eq("user_id", userId),
    admin.from("objectives").delete().eq("user_id", userId),
    admin.from("revenue_entries").delete().eq("user_id", userId),
    admin.from("partnerships").delete().or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ]);

  await Promise.all([
    admin.from("revenue_streams").delete().eq("user_id", userId),
    admin.from("users").delete().eq("id", userId),
  ]);

  // Delete the auth user (must be last)
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Error deleting auth user:", authError);
    // Don't fail — data is already deleted
  }

  return NextResponse.json({ success: true });
}
