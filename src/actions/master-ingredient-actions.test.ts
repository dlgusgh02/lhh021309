import { describe, expect, it, vi, beforeEach } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { getMasterIngredients } from "@/actions/master-ingredient-actions";
import { makeSupabaseWithQueue } from "@/lib/test-utils/supabase-mock";

beforeEach(() => vi.clearAllMocks());

describe("getMasterIngredients", () => {
  it("maps snake_case rows to the camelCase domain shape", async () => {
    const supabase = makeSupabaseWithQueue([
      {
        data: [
          {
            id: "m1",
            name: "양파",
            category: "vegetable",
            reference_unit: "kg",
            reference_price: 922,
            price_updated_at: "2026-09-11T09:39:00+00:00",
          },
        ],
        error: null,
      },
    ]);
    createClient.mockResolvedValue(supabase);

    const result = await getMasterIngredients();

    expect(result).toEqual({
      success: true,
      data: [{ id: "m1", name: "양파", category: "vegetable", referenceUnit: "kg", referencePrice: 922, priceUpdatedAt: "2026-09-11T09:39:00+00:00" }],
    });
  });

  it("surfaces a DB error as a failed ActionResult instead of throwing", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: { message: "relation does not exist" } }]);
    createClient.mockResolvedValue(supabase);

    const result = await getMasterIngredients();

    expect(result).toEqual({ success: false, error: "relation does not exist" });
  });
});
