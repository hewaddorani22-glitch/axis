import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidPrivateKey, getVapidPublicKey, getVapidSubject } from "@/lib/env";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = getVapidPublicKey();
  const priv = getVapidPrivateKey();
  if (!pub || !priv) return false;
  webpush.setVapidDetails(getVapidSubject(), pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
};

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Send a push notification to every subscription a user has registered.
 *
 * Returns the number of successful deliveries. Stale (410/404) subscriptions
 * are dropped from the database so the next send is faster.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return 0;

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/dashboard",
    tag: payload.tag,
    icon: payload.icon,
  });

  let delivered = 0;
  await Promise.all(
    (subs as SubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          json,
        );
        delivered++;
        await admin
          .from("push_subscriptions")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", sub.id);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
  return delivered;
}
