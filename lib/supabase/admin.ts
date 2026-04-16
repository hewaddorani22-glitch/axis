import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using the service role key.
 * Only use in server-side API routes — never expose to the browser.
 * Required for cross-user operations (partner stats, account deletion).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
