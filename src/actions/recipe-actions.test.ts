import { describe, expect, it, vi, beforeEach } from "vitest";

const { requireStoreId } = vi.hoisted(() => ({ requireStoreId: vi.fn() }));
vi.mock("@/lib/supabase/dal", () => ({ requireStoreId }));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  createRecipe,
  duplicateRecipe,
  toggleFavorite,
  deleteRecipe,
  addRecipeIngredient,
  addExtraCost,
} from "@/actions/recipe-actions";
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

describe("createRecipe", () => {
  it("rejects invalid input before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await createRecipe(formDataFrom({ name: "", category: "korean", servings: "4" }));

    expect(result.success).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("scopes the insert to the current store", async () => {
    const supabase = makeSupabaseWithQueue([{ data: { id: "recipe-1" }, error: null }]);
    createClient.mockResolvedValue(supabase);

    const result = await createRecipe(formDataFrom({ name: "제육볶음", category: "korean", servings: "4" }));

    expect(result).toEqual({ success: true, data: { id: "recipe-1" } });
    const chain = supabase.from.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ store_id: "store-1", name: "제육볶음" }));
  });
});

describe("duplicateRecipe", () => {
  const sourceRecipe = {
    id: "recipe-1",
    name: "제육볶음",
    category: "korean",
    description: "매콤한 제육볶음",
    servings: 4,
    selling_price: 9000,
    recipe_ingredients: [{ ingredient_id: "ing-1", quantity: 200, unit: "g" }],
    extra_costs: [{ name: "인건비", amount: 1000, cost_type: "labor" }],
  };

  it("copies the recipe, its ingredients, and its extra costs under a new id", async () => {
    const supabase = makeSupabaseWithQueue([
      { data: sourceRecipe, error: null }, // fetch source
      { data: { id: "recipe-2" }, error: null }, // insert copy
      { data: null, error: null }, // insert recipe_ingredients
      { data: null, error: null }, // insert extra_costs
    ]);
    createClient.mockResolvedValue(supabase);

    const result = await duplicateRecipe("recipe-1");

    expect(result).toEqual({ success: true, data: { id: "recipe-2" } });
    expect(supabase.from).toHaveBeenNthCalledWith(2, "recipes");
    expect(supabase.from.mock.results[1].value.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "제육볶음 (복사본)", store_id: "store-1" }),
    );
    expect(supabase.from).toHaveBeenNthCalledWith(3, "recipe_ingredients");
    expect(supabase.from.mock.results[2].value.insert).toHaveBeenCalledWith([
      expect.objectContaining({ recipe_id: "recipe-2", ingredient_id: "ing-1", quantity: 200, unit: "g" }),
    ]);
    expect(supabase.from).toHaveBeenNthCalledWith(4, "extra_costs");
    expect(supabase.from.mock.results[3].value.insert).toHaveBeenCalledWith([
      expect.objectContaining({ recipe_id: "recipe-2", name: "인건비", amount: 1000 }),
    ]);
  });

  it("skips the ingredients/extra_costs insert calls entirely when the source has none", async () => {
    const supabase = makeSupabaseWithQueue([
      { data: { ...sourceRecipe, recipe_ingredients: [], extra_costs: [] }, error: null },
      { data: { id: "recipe-2" }, error: null },
    ]);
    createClient.mockResolvedValue(supabase);

    const result = await duplicateRecipe("recipe-1");

    expect(result).toEqual({ success: true, data: { id: "recipe-2" } });
    expect(supabase.from).toHaveBeenCalledTimes(2); // only the fetch + the recipe insert
  });

  it("fails cleanly when the source recipe doesn't exist (wrong store, RLS, etc.)", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: { message: "not found" } }]);
    createClient.mockResolvedValue(supabase);

    const result = await duplicateRecipe("missing");

    expect(result).toEqual({ success: false, error: "레시피를 찾을 수 없습니다." });
  });
});

describe("toggleFavorite", () => {
  it("updates is_favorite scoped to id + store", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: null }]);
    createClient.mockResolvedValue(supabase);

    const result = await toggleFavorite("recipe-1", true);

    expect(result).toEqual({ success: true, data: null });
    const chain = supabase.from.mock.results[0].value;
    expect(chain.update).toHaveBeenCalledWith({ is_favorite: true });
    expect(chain.eq).toHaveBeenCalledWith("id", "recipe-1");
    expect(chain.eq).toHaveBeenCalledWith("store_id", "store-1");
  });
});

describe("deleteRecipe", () => {
  it("surfaces a DB error instead of throwing", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: { message: "fk violation" } }]);
    createClient.mockResolvedValue(supabase);

    const result = await deleteRecipe("recipe-1");

    expect(result).toEqual({ success: false, error: "fk violation" });
  });
});

describe("addRecipeIngredient", () => {
  it("rejects a zero/negative quantity before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await addRecipeIngredient(
      "recipe-1",
      formDataFrom({ ingredientId: "ing-1", quantity: "0", unit: "g" }),
    );

    expect(result.success).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("addExtraCost", () => {
  it("defaults costType to 'etc' when not provided", async () => {
    const supabase = makeSupabaseWithQueue([{ data: null, error: null }]);
    createClient.mockResolvedValue(supabase);

    await addExtraCost("recipe-1", formDataFrom({ name: "배달비", amount: "3000" }));

    const chain = supabase.from.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ cost_type: "etc" }));
  });
});
