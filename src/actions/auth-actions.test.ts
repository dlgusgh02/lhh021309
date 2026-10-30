import { describe, expect, it, vi, beforeEach } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

const { headers } = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("next/headers", () => ({ headers }));

import { signup, login, requestPasswordReset, updatePassword } from "@/actions/auth-actions";

function formDataFrom(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function makeAuthSupabase(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  headers.mockResolvedValue(new Map());
});

const validSignup = { displayName: "홍길동", email: "test@example.com", password: "password123" };

describe("signup", () => {
  it("rejects invalid input before calling Supabase", async () => {
    const supabase = makeAuthSupabase();
    createClient.mockResolvedValue(supabase);

    const result = await signup(formDataFrom({ ...validSignup, password: "short" }));

    expect(result.success).toBe(false);
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("returns needsEmailConfirmation without redirecting when Supabase withholds a session", async () => {
    const supabase = makeAuthSupabase({
      signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    });
    createClient.mockResolvedValue(supabase);

    const result = await signup(formDataFrom(validSignup));

    expect(result).toEqual({ success: true, data: { needsEmailConfirmation: true } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard when Supabase returns a session immediately (no email confirmation required)", async () => {
    const supabase = makeAuthSupabase({
      signUp: vi.fn().mockResolvedValue({ data: { session: { access_token: "t" } }, error: null }),
    });
    createClient.mockResolvedValue(supabase);

    await signup(formDataFrom(validSignup));

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("passes through a Supabase signup error (e.g. duplicate email)", async () => {
    const supabase = makeAuthSupabase({
      signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: { message: "already registered" } }),
    });
    createClient.mockResolvedValue(supabase);

    const result = await signup(formDataFrom(validSignup));

    expect(result).toEqual({ success: false, error: "already registered" });
  });
});

describe("login", () => {
  it("never reveals Supabase's actual error message (avoid account enumeration)", async () => {
    const supabase = makeAuthSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({ error: { message: "User not found in database" } }),
    });
    createClient.mockResolvedValue(supabase);

    const result = await login(formDataFrom({ email: "a@b.com", password: "wrong" }));

    expect(result).toEqual({ success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  });

  it("redirects to /dashboard on success", async () => {
    const supabase = makeAuthSupabase();
    createClient.mockResolvedValue(supabase);

    await login(formDataFrom({ email: "a@b.com", password: "correct" }));

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("requestPasswordReset", () => {
  it("rejects an invalid email before calling Supabase", async () => {
    const supabase = makeAuthSupabase();
    createClient.mockResolvedValue(supabase);

    const result = await requestPasswordReset(formDataFrom({ email: "not-an-email" }));

    expect(result.success).toBe(false);
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
});

describe("updatePassword", () => {
  it("rejects mismatched password confirmation before calling Supabase", async () => {
    const supabase = makeAuthSupabase();
    createClient.mockResolvedValue(supabase);

    const result = await updatePassword(
      formDataFrom({ password: "password123", confirmPassword: "different123" }),
    );

    expect(result.success).toBe(false);
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("returns a user-friendly error on an expired reset link instead of the raw Supabase message", async () => {
    const supabase = makeAuthSupabase({
      updateUser: vi.fn().mockResolvedValue({ error: { message: "JWT expired" } }),
    });
    createClient.mockResolvedValue(supabase);

    const result = await updatePassword(
      formDataFrom({ password: "password123", confirmPassword: "password123" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("재설정 링크가 만료");
  });
});
