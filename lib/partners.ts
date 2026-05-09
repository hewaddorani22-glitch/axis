import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<any, any, any>;

export const FREE_PARTNER_LIMIT = 1;

async function countActivePartnerships(admin: AdminClient, userId: string) {
  const { count, error } = await admin
    .from("partnerships")
    .select("id", { count: "exact", head: true })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq("status", "active");

  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

export async function activatePartnership(
  admin: AdminClient,
  inviterId: string,
  currentUserId: string
) {
  if (!inviterId) {
    return { error: "Missing inviterId", status: 400 };
  }

  if (inviterId === currentUserId) {
    return { error: "Cannot partner with yourself", status: 400 };
  }

  const { data: inviter, error: inviterError } = await admin
    .from("users")
    .select("id, plan")
    .eq("id", inviterId)
    .maybeSingle();

  if (inviterError) {
    return { error: inviterError.message, status: 500 };
  }

  if (!inviter) {
    return { error: "Invite owner was not found", status: 404 };
  }

  const { data: currentProfile, error: currentError } = await admin
    .from("users")
    .select("plan")
    .eq("id", currentUserId)
    .maybeSingle();

  if (currentError) {
    return { error: currentError.message, status: 500 };
  }

  const { data: existing, error: existingError } = await admin
    .from("partnerships")
    .select("id, status")
    .or(`and(user_a.eq.${inviterId},user_b.eq.${currentUserId}),and(user_a.eq.${currentUserId},user_b.eq.${inviterId})`)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message, status: 500 };
  }

  if (existing) {
    if (existing.status === "active") {
      return { partnershipId: existing.id, already: true };
    }

    const { error } = await admin
      .from("partnerships")
      .update({ status: "active" })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message, status: 500 };
    }

    return { partnershipId: existing.id, reactivated: true };
  }

  // Free-plan partner limit. Check both sides — either user being capped blocks
  // the activation. Pro accounts are unlimited.
  if (inviter.plan !== "pro") {
    const inviterCount = await countActivePartnerships(admin, inviterId);
    if ("error" in inviterCount) {
      return { error: inviterCount.error, status: 500 };
    }
    if (inviterCount.count >= FREE_PARTNER_LIMIT) {
      return {
        error: "Inviter has reached the free partner limit",
        status: 403,
        paywall: "partner_limit" as const,
        side: "inviter" as const,
      };
    }
  }

  if (currentProfile?.plan !== "pro") {
    const currentCount = await countActivePartnerships(admin, currentUserId);
    if ("error" in currentCount) {
      return { error: currentCount.error, status: 500 };
    }
    if (currentCount.count >= FREE_PARTNER_LIMIT) {
      return {
        error: "You have reached the free partner limit",
        status: 403,
        paywall: "partner_limit" as const,
        side: "current" as const,
      };
    }
  }

  const { data, error } = await admin
    .from("partnerships")
    .insert({
      user_a: inviterId,
      user_b: currentUserId,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { partnershipId: data.id };
}
