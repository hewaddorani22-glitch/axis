import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<any, any, any>;

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
    .select("id")
    .eq("id", inviterId)
    .maybeSingle();

  if (inviterError) {
    return { error: inviterError.message, status: 500 };
  }

  if (!inviter) {
    return { error: "Invite owner was not found", status: 404 };
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
