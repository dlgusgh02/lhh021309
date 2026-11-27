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
            price_source: "kamis-auction",
            price_as_of: "2026-09-10",
            price_market: "가락",
            price_grade: "중",
          },
        ],
        error: null,
      },
    ]);
    createClient.mockResolvedValue(supabase);

    const result = await getMasterIngredients();

    expect(result).toEqual({
      success: true,
      data: [{ id: "m1", name: "양파", category: "vegetable", referenceUnit: "kg", referencePrice: 922, priceUpdatedAt: "2026-09-11T09:39:00+00:00", priceSource: "kamis-auction", priceAsOf: "2026-09-10", priceMarket: "가락", priceGrade: "중" }],
    });
  });

  it("surfaces a DB error as a failed ActionResult instead of throwing", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: { message: "relation does not exist" } }]);
    createClient.mockResolvedValue(supabase);

    const result = await getMasterIngredients();

    expect(result).toEqual({ success: false, error: "relation does not exist" });
  });

  it("keeps legacy prices readable without inventing provenance", async () => {
    createClient.mockResolvedValue(makeSupabaseWithQueue([{ data: [{ id: "legacy", reference_price: 1000, price_updated_at: "2026-11-06T00:00:00Z" }], error: null }]));
    const result = await getMasterIngredients();
    expect(result.success && result.data[0]).toMatchObject({ referencePrice: 1000, priceSource: null, priceAsOf: null, priceMarket: null, priceGrade: null });
  });
});
