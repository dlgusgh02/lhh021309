/**
 * Session-refresh helper invoked from the root `proxy.ts` (Next.js 16 renamed
 * `middleware.ts` -> `proxy.ts`; see node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/ingredients", "/recipes", "/simulator", "/settings"];
// Note: /reset-password is intentionally excluded — a user arriving there via
// the recovery email link already has a session (established by
// /auth/confirm), and redirecting them away before they can set a new
// password would break the flow.
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((prefix) => path.startsWith(prefix));

  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    // IMPORTANT: getUser() (not getSession()) re-validates the token against
    // Supabase Auth rather than trusting an unverified cookie value.
    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();
    user = verifiedUser;
  } catch (err) {
    // Supabase is unreachable or misconfigured (e.g. placeholder env vars,
    // network outage). Fail safe rather than 500ing every request: treat the
    // visitor as unauthenticated so protected routes still redirect to
    // /login instead of crashing, and public/auth routes render normally.
    console.error("[proxy] Supabase session check failed:", err instanceof Error ? err.message : err);
  }

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
