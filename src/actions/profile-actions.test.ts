import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/dal", () => ({ requireUser }));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getProfileSettings, updateStoreName, updateDisplayName } from "@/actions/profile-actions";
import { makeSupabaseWithQueue } from "@/lib/test-utils/supabase-mock";

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ id: "user-1", email: "test@example.com" });
});

function formDataFrom(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("getProfileSettings", () => {
  it("falls back to defaults when neither a profile row nor a store row exists", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: null }, { data: null, error: null }]);
    createClient.mockResolvedValue(supabase);

    const result = await getProfileSettings();

    expect(result).toEqual({
      success: true,
      data: { email: "test@example.com", displayName: null, storeName: "기본 매장", currency: "KRW" },
    });
  });

  it("prefers the store's currency over the profile's when both exist", async () => {
    const supabase = makeSupabaseWithQueue([
      { data: { display_name: "홍길동", currency: "USD" }, error: null },
      { data: { name: "내 식당", currency: "KRW" }, error: null },
    ]);
    createClient.mockResolvedValue(supabase);

    const result = await getProfileSettings();

    expect(result).toEqual({
      success: true,
      data: { email: "test@example.com", displayName: "홍길동", storeName: "내 식당", currency: "KRW" },
    });
  });
});

describe("updateStoreName", () => {
  it("rejects a blank name before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await updateStoreName(formDataFrom({ storeName: "   " }));

    expect(result).toEqual({ success: false, error: "매장 이름을 입력해주세요." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("scopes the update to the current user", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: null }]);
    createClient.mockResolvedValue(supabase);

    const result = await updateStoreName(formDataFrom({ storeName: "새 매장 이름" }));

    expect(result).toEqual({ success: true, data: null });
    const chain = supabase.from.mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith({ name: "새 매장 이름" });
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});

describe("updateDisplayName", () => {
  it("rejects a blank name before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await updateDisplayName(formDataFrom({ displayName: "" }));

    expect(result).toEqual({ success: false, error: "이름을 입력해주세요." });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
