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
  updateRecipeIngredient,
  addExtraCost,
  removeRecipeIngredient,
  removeExtraCost,
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
  it("duplicates through one atomic RPC scoped to the authenticated store", async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: "recipe-2", error: null }), from: vi.fn() };
    createClient.mockResolvedValue(db);
    expect(await duplicateRecipe("recipe-1")).toEqual({ success: true, data: { id: "recipe-2" } });
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith("duplicate_recipe", { p_recipe_id: "recipe-1", p_store_id: "store-1" });
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each(["레시피를 찾을 수 없습니다.", "child insert failed", "function duplicate_recipe does not exist"])("reports RPC failure without falling back to partial inserts: %s", async (message) => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message } }), from: vi.fn() };
    createClient.mockResolvedValue(db);
    expect(await duplicateRecipe("recipe-1")).toEqual({ success: false, error: message });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("does not claim success without a new recipe id", async () => {
    createClient.mockResolvedValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: null }) });
    expect((await duplicateRecipe("recipe-1")).success).toBe(false);
  });

  it("does not access the DB when store authentication fails", async () => {
    requireStoreId.mockRejectedValueOnce(new Error("로그인이 필요합니다."));
    expect((await duplicateRecipe("recipe-1")).success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
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
  it.each(["kg", "g"])("accepts compatible %s use and scopes both lookups to the store", async (unit) => {
    const db = makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: { purchase_unit: "kg" } }, { error: null }]);
    createClient.mockResolvedValue(db);
    expect(await addRecipeIngredient("recipe-1", formDataFrom({ ingredientId: "ing-1", quantity: "10", unit }))).toEqual({ success: true, data: null });
    expect(db.from.mock.results[0].value.eq).toHaveBeenCalledWith("store_id", "store-1");
    expect(db.from.mock.results[1].value.eq).toHaveBeenCalledWith("store_id", "store-1");
    expect(db.from.mock.results[2].value.insert).toHaveBeenCalledWith({ recipe_id: "recipe-1", ingredient_id: "ing-1", quantity: 10, unit });
  });

  it.each(["ml", "50개", "unknown"])("rejects incompatible or unsupported %s without an insert", async (unit) => {
    const db = makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: { purchase_unit: "kg" } }]);
    createClient.mockResolvedValue(db);
    expect((await addRecipeIngredient("recipe-1", formDataFrom({ ingredientId: "ing-1", quantity: "10", unit }))).success).toBe(false);
    expect(db.from).toHaveBeenCalledTimes(2);
    for (const result of db.from.mock.results) expect(result.value.insert).not.toHaveBeenCalled();
  });

  it("rejects a missing or inaccessible recipe before looking up ingredients", async () => {
    const db = makeSupabaseWithQueue([{ data: null, error: null }]);
    createClient.mockResolvedValue(db);
    expect(await addRecipeIngredient("foreign-recipe", formDataFrom({ ingredientId: "ing-1", quantity: "10", unit: "g" }))).toEqual({ success: false, error: "레시피를 찾을 수 없습니다." });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("rejects another store's ingredient without an insert", async () => {
    const db = makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: null, error: null }]);
    createClient.mockResolvedValue(db);
    expect(await addRecipeIngredient("recipe-1", formDataFrom({ ingredientId: "foreign-ingredient", quantity: "10", unit: "g" }))).toEqual({ success: false, error: "식재료를 찾을 수 없습니다." });
    expect(db.from).toHaveBeenCalledTimes(2);
  });
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

describe("updateRecipeIngredient", () => {
  it("updates quantity and unit when the new unit is still compatible", async () => {
    const db = makeSupabaseWithQueue([
      { data: { id: "recipe-1" } },
      { data: { ingredient_id: "ing-1" } },
      { data: { purchase_unit: "kg" } },
      { data: [{ id: "ri-1" }], error: null },
    ]);
    createClient.mockResolvedValue(db);

    const result = await updateRecipeIngredient("recipe-1", "ri-1", formDataFrom({ quantity: "20", unit: "g" }));

    expect(result).toEqual({ success: true, data: null });
    const updateChain = db.from.mock.results[3].value;
    expect(updateChain.update).toHaveBeenCalledWith({ quantity: 20, unit: "g" });
    expect(updateChain.eq).toHaveBeenCalledWith("id", "ri-1");
  });

  it("rejects an incompatible unit without updating", async () => {
    const db = makeSupabaseWithQueue([
      { data: { id: "recipe-1" } },
      { data: { ingredient_id: "ing-1" } },
      { data: { purchase_unit: "kg" } },
    ]);
    createClient.mockResolvedValue(db);

    const result = await updateRecipeIngredient("recipe-1", "ri-1", formDataFrom({ quantity: "20", unit: "ml" }));

    expect(result.success).toBe(false);
    expect(db.from).toHaveBeenCalledTimes(3);
  });

  it("rejects a recipe ingredient that doesn't belong to this recipe", async () => {
    const db = makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: null, error: null }]);
    createClient.mockResolvedValue(db);

    const result = await updateRecipeIngredient("recipe-1", "foreign-line", formDataFrom({ quantity: "20", unit: "g" }));

    expect(result).toEqual({ success: false, error: "레시피 재료를 찾을 수 없습니다." });
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("rejects a missing or inaccessible recipe before touching recipe_ingredients", async () => {
    const db = makeSupabaseWithQueue([{ data: null, error: null }]);
    createClient.mockResolvedValue(db);

    const result = await updateRecipeIngredient("foreign-recipe", "ri-1", formDataFrom({ quantity: "20", unit: "g" }));

    expect(result).toEqual({ success: false, error: "레시피를 찾을 수 없습니다." });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("rejects a zero/negative quantity before touching the database", async () => {
    const supabase = makeSupabaseWithQueue([]);
    createClient.mockResolvedValue(supabase);

    const result = await updateRecipeIngredient("recipe-1", "ri-1", formDataFrom({ quantity: "0", unit: "g" }));

    expect(result.success).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("addExtraCost", () => {
  it("defaults costType to 'etc' when not provided", async () => {
    const supabase = makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: null, error: null }]);
    createClient.mockResolvedValue(supabase);

    await addExtraCost("recipe-1", formDataFrom({ name: "배달비", amount: "3000" }));

    const chain = supabase.from.mock.results[1].value;
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ cost_type: "etc" }));
  });

  it("rejects an inaccessible parent before writing costs", async () => {
    const db = makeSupabaseWithQueue([{ data: null }]);
    createClient.mockResolvedValue(db);
    expect((await addExtraCost("foreign", formDataFrom({ name: "포장", amount: "1000" }))).success).toBe(false);
    expect(db.from).toHaveBeenCalledTimes(1);
  });
});

describe.each([
  { name: "recipe ingredient", remove: removeRecipeIngredient },
  { name: "extra cost", remove: removeExtraCost },
])("remove $name", ({ remove }) => {
  it("restricts deletion by both child id and recipe id", async () => {
    const db = makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: [{ id: "child-1" }], error: null }]);
    createClient.mockResolvedValue(db);
    expect(await remove("recipe-1", "child-1")).toEqual({ success: true, data: null });
    expect(db.from.mock.results[1].value.eq).toHaveBeenCalledWith("id", "child-1");
    expect(db.from.mock.results[1].value.eq).toHaveBeenCalledWith("recipe_id", "recipe-1");
  });

  it("reports an unrelated or missing child as failure", async () => {
    createClient.mockResolvedValue(makeSupabaseWithQueue([{ data: { id: "recipe-1" } }, { data: [], error: null }]));
    expect((await remove("recipe-1", "unrelated-child")).success).toBe(false);
  });

  it("rejects an inaccessible parent before attempting deletion", async () => {
    const db = makeSupabaseWithQueue([{ data: null }]);
    createClient.mockResolvedValue(db);
    expect((await remove("foreign", "child-1")).success).toBe(false);
    expect(db.from).toHaveBeenCalledTimes(1);
  });
});
