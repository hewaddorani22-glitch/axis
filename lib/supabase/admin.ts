import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

/**
 * Supabase admin client using the service role key.
 * Only use in server-side API routes: never expose to the browser.
 * Required for cross-user operations (partner stats, account deletion).
 */
export function createAdminClient() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
