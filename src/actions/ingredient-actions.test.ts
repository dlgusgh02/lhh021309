import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireStoreId } = vi.hoisted(() => ({ requireStoreId: vi.fn() }));
vi.mock("@/lib/supabase/dal", () => ({ requireStoreId }));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/actions/ingredient-actions";
import { makeSupabaseWithQueue } from "@/lib/test-utils/supabase-mock";

beforeEach(() => {
  vi.clearAllMocks();
  requireStoreId.mockResolvedValue("store-1");
});

function formDataFrom(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validIngredientFields = {
  name: "돼지고기",
  category: "meat",
  purchasePrice: "18000",
  purchaseQuantity: "1000",
  purchaseUnit: "g",
  yieldRate: "100",
};

describe("createIngredient", () => {
  it("rejects invalid input before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await createIngredient(formDataFrom({ ...validIngredientFields, purchasePrice: "-1" }));

    expect(result.success).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("inserts scoped to the current store and returns the new id", async () => {
    const supabase = makeSupabaseWithQueue([{ data: { id: "ing-1" }, error: null }]);
    createClient.mockResolvedValue(supabase);

    const result = await createIngredient(formDataFrom(validIngredientFields));

    expect(result).toEqual({ success: true, data: { id: "ing-1" } });
    const chain = supabase.from.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ store_id: "store-1", name: "돼지고기" }));
  });

  it("surfaces a DB error as a failed ActionResult instead of throwing", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: { message: "db boom" } }]);
    createClient.mockResolvedValue(supabase);

    const result = await createIngredient(formDataFrom(validIngredientFields));

    expect(result).toEqual({ success: false, error: "db boom" });
  });
});

describe("updateIngredient", () => {
  it("records price history when the price actually changed (TRD §41)", async () => {
    const supabase = makeSupabaseWithQueue([
      { data: { purchase_price: 15000, purchase_quantity: 1000, purchase_unit: "g" }, error: null }, // existing lookup
      { data: null, error: null }, // price_history insert
      { data: null, error: null }, // update
    ]);
    createClient.mockResolvedValue(supabase);

    await updateIngredient("ing-1", formDataFrom(validIngredientFields)); // new price: 18000

    expect(supabase.from).toHaveBeenNthCalledWith(2, "ingredient_price_history");
    const historyChain = supabase.from.mock.results[1].value;
    expect(historyChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ ingredient_id: "ing-1", purchase_price: 15000 }),
    );
  });

  it("does NOT record price history when nothing changed", async () => {
    const supabase = makeSupabaseWithQueue([
      { data: { purchase_price: 18000, purchase_quantity: 1000, purchase_unit: "g" }, error: null }, // identical to form
      { data: null, error: null }, // update
    ]);
    createClient.mockResolvedValue(supabase);

    await updateIngredient("ing-1", formDataFrom(validIngredientFields));

    expect(supabase.from).not.toHaveBeenCalledWith("ingredient_price_history");
  });

  it("rejects invalid input before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await updateIngredient("ing-1", formDataFrom({ ...validIngredientFields, purchaseQuantity: "0" }));

    expect(result.success).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("deleteIngredient", () => {
  it("blocks deletion when a recipe still references the ingredient (TRD §32/§42)", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: null, count: 2 }]);
    createClient.mockResolvedValue(supabase);

    const result = await deleteIngredient("ing-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("2개");
    // the guard must short-circuit before any delete call
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("deletes when no recipe references it", async () => {
    const supabase = makeSupabaseWithQueue([
      { data: null, error: null, count: 0 },
      { data: null, error: null },
    ]);
    createClient.mockResolvedValue(supabase);

    const result = await deleteIngredient("ing-1");

    expect(result).toEqual({ success: true, data: null });
    const deleteChain = supabase.from.mock.results[1].value;
    expect(deleteChain.delete).toHaveBeenCalled();
  });
});
