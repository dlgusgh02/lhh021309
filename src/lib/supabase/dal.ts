/**
 * Small Data Access Layer: centralizes "who is the current user / their
 * store" lookups so every Server Action and Server Component asks the same
 * way (TRD §41-44, Next.js Authentication guide's DAL pattern).
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Redirects to /login if there is no authenticated user. */
export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

/**
 * MVP supports exactly one store per user (TRD §23), created automatically by
 * the `handle_new_user` DB trigger on signup. Returns its id.
 */
export const requireStoreId = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: store, error } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !store) {
    throw new Error("매장 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
  }

  return store.id as string;
});
