"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

/** Best-effort site origin for building email-redirect URLs from a Server Action (no request URL available directly). */
async function getSiteOrigin(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) return origin;
  const host = headersList.get("host");
  if (host) return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signup(formData: FormData): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const parsed = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { displayName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // If email confirmation is required, Supabase returns a user but no session.
  const needsEmailConfirmation = !data.session;
  if (needsEmailConfirmation) {
    return { success: true, data: { needsEmailConfirmation: true } };
  }

  redirect("/dashboard");
}

export async function login(formData: FormData): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "이메일을 확인해주세요." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Supabase intentionally does not reveal whether the email exists — always
  // report success to the caller so this can't be used to enumerate accounts.
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: null };
}

export async function updatePassword(formData: FormData): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return {
      success: false,
      error: "비밀번호를 변경할 수 없습니다. 재설정 링크가 만료되었을 수 있습니다. 다시 시도해주세요.",
    };
  }

  return { success: true, data: null };
}
