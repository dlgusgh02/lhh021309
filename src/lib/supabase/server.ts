/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session through Next.js's async `cookies()` API
 * (Next.js 16 requires awaiting it — see AGENTS.md / TRD §36).
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no request context to write
            // cookies to — safe to ignore as long as the proxy also refreshes
            // the session (see proxy.ts).
          }
        },
      },
    },
  );
}
