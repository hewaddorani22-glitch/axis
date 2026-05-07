import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delivered = await sendPushToUser(user.id, {
    title: "lomoura",
    body: "Push aktiviert. Wir wecken dich morgen.",
    url: "/dashboard",
    tag: "lomoura-test",
  });

  return NextResponse.json({ delivered });
}
