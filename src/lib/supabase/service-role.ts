/**
 * Service-role Supabase client — bypasses RLS entirely. Only for trusted,
 * server-only system jobs (currently: the KAMIS price sync route handler).
 * NEVER import this from a Server Action or anything that runs on behalf of
 * a specific user's request; use lib/supabase/server.ts (RLS-scoped) there.
 */
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to use the service-role client.");
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
