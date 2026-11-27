"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreId } from "@/lib/supabase/dal";
import { convertUnit } from "@/lib/units/conversions";
import {
  extraCostSchema,
  recipeFormSchema,
  recipeIngredientSchema,
  sellingPriceSchema,
} from "@/lib/validations/recipe";
import type { ActionResult, ExtraCost, Ingredient, Recipe, RecipeIngredient } from "@/types";
import type {
  ExtraCostRow,
  IngredientRow,
  RecipeIngredientRow,
  RecipeRow,
} from "@/types/database";

function toIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    category: row.category,
    purchasePrice: row.purchase_price,
    purchaseQuantity: Number(row.purchase_quantity),
    purchaseUnit: row.purchase_unit,
    baseUnit: row.base_unit,
    yieldRate: Number(row.yield_rate),
    supplier: row.supplier,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RecipeRowWithJoins = RecipeRow & {
  recipe_ingredients: (RecipeIngredientRow & { ingredient: IngredientRow | null })[];
  extra_costs: ExtraCostRow[];
};

function toRecipe(row: RecipeRowWithJoins): Recipe {
  const recipeIngredients: RecipeIngredient[] = (row.recipe_ingredients ?? []).map((ri) => ({
    id: ri.id,
    recipeId: ri.recipe_id,
    ingredientId: ri.ingredient_id,
    quantity: Number(ri.quantity),
    unit: ri.unit,
    ingredient: ri.ingredient ? toIngredient(ri.ingredient) : undefined,
  }));

  const extraCosts: ExtraCost[] = (row.extra_costs ?? []).map((ec) => ({
    id: ec.id,
    recipeId: ec.recipe_id,
    name: ec.name,
    amount: ec.amount,
    costType: ec.cost_type,
  }));

  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    category: row.category,
    description: row.description,
    servings: Number(row.servings),
    sellingPrice: row.selling_price,
    imageUrl: row.image_url,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipeIngredients,
    extraCosts,
  };
}

const RECIPE_SELECT = "*, recipe_ingredients(*, ingredient:ingredients(*)), extra_costs(*)";

async function requireOwnedRecipe(supabase: Awaited<ReturnType<typeof createClient>>, recipeId: string, storeId: string) {
  const { data, error } = await supabase.from("recipes").select("id").eq("id", recipeId).eq("store_id", storeId).single();
  if (error || !data) throw new Error("레시피를 찾을 수 없습니다.");
}

export async function getRecipes(): Promise<ActionResult<Recipe[]>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as unknown as RecipeRowWithJoins[]).map(toRecipe) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "레시피 목록을 불러오지 못했습니다." };
  }
}

export async function getRecipe(id: string): Promise<ActionResult<Recipe>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_SELECT)
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !data) return { success: false, error: "레시피를 찾을 수 없습니다." };
    return { success: true, data: toRecipe(data as unknown as RecipeRowWithJoins) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "레시피를 불러오지 못했습니다." };
  }
}

export async function createRecipe(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = recipeFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    servings: formData.get("servings"),
    sellingPrice: formData.get("sellingPrice") || 0,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const values = parsed.data;

    const { data, error } = await supabase
      .from("recipes")
      .insert({
        store_id: storeId,
        name: values.name,
        category: values.category,
        description: values.description || null,
        servings: values.servings,
        selling_price: values.sellingPrice,
      })
      .select("id")
      .single();

    if (error || !data) return { success: false, error: error?.message ?? "레시피 생성에 실패했습니다." };

    revalidatePath("/recipes");
    return { success: true, data: { id: data.id as string } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "레시피 생성에 실패했습니다." };
  }
}

export async function updateRecipe(id: string, formData: FormData): Promise<ActionResult<null>> {
  const parsed = recipeFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    servings: formData.get("servings"),
    sellingPrice: formData.get("sellingPrice") || 0,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const values = parsed.data;

    const { error } = await supabase
      .from("recipes")
      .update({
        name: values.name,
        category: values.category,
        description: values.description || null,
        servings: values.servings,
        selling_price: values.sellingPrice,
      })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "레시피 수정에 실패했습니다." };
  }
}

export async function updateSellingPrice(id: string, formData: FormData): Promise<ActionResult<null>> {
  const parsed = sellingPriceSchema.safeParse({ sellingPrice: formData.get("sellingPrice") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "판매가격을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("recipes")
      .update({ selling_price: parsed.data.sellingPrice })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/recipes/${id}`);
    revalidatePath("/recipes");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "판매가격 수정에 실패했습니다." };
  }
}

export async function duplicateRecipe(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();

    // One RPC transaction: a child insert failure rolls the entire copy back.
    const { data: newId, error } = await supabase.rpc("duplicate_recipe", { p_recipe_id: id, p_store_id: storeId });
    if (error || !newId) {
      return { success: false, error: error?.message ?? "레시피 복제에 실패했습니다." };
    }

    revalidatePath("/recipes");
    revalidatePath("/dashboard");
    return { success: true, data: { id: newId } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "레시피 복제에 실패했습니다." };
  }
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<ActionResult<null>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: isFavorite })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "즐겨찾기 설정에 실패했습니다." };
  }
}

export async function deleteRecipe(id: string): Promise<ActionResult<null>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { error } = await supabase.from("recipes").delete().eq("id", id).eq("store_id", storeId);
    if (error) return { success: false, error: error.message };

    revalidatePath("/recipes");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "레시피 삭제에 실패했습니다." };
  }
}

// ---------------------------------------------------------------------------
// Recipe ingredients
// ---------------------------------------------------------------------------

export async function addRecipeIngredient(recipeId: string, formData: FormData): Promise<ActionResult<null>> {
  const parsed = recipeIngredientSchema.safeParse({
    ingredientId: formData.get("ingredientId"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    await requireOwnedRecipe(supabase, recipeId, storeId);
    const { data: ingredient, error: ingredientError } = await supabase.from("ingredients")
      .select("purchase_unit").eq("id", parsed.data.ingredientId).eq("store_id", storeId).single();
    if (ingredientError || !ingredient) return { success: false, error: "식재료를 찾을 수 없습니다." };
    // Validate using the same conversion rules used by the cost engine.
    convertUnit(parsed.data.quantity, parsed.data.unit, ingredient.purchase_unit);
    const { error } = await supabase.from("recipe_ingredients").insert({
      recipe_id: recipeId,
      ingredient_id: parsed.data.ingredientId,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath("/recipes");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "재료 추가에 실패했습니다." };
  }
}

export async function updateRecipeIngredient(
  recipeId: string,
  recipeIngredientId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = recipeIngredientSchema.omit({ ingredientId: true }).safeParse({
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    await requireOwnedRecipe(supabase, recipeId, storeId);
    const { data: existing, error: existingError } = await supabase
      .from("recipe_ingredients")
      .select("ingredient_id")
      .eq("id", recipeIngredientId)
      .eq("recipe_id", recipeId)
      .single();
    if (existingError || !existing) return { success: false, error: "레시피 재료를 찾을 수 없습니다." };
    const { data: ingredient, error: ingredientError } = await supabase
      .from("ingredients")
      .select("purchase_unit")
      .eq("id", existing.ingredient_id)
      .single();
    if (ingredientError || !ingredient) return { success: false, error: "식재료를 찾을 수 없습니다." };
    // Validate using the same conversion rules used by the cost engine.
    convertUnit(parsed.data.quantity, parsed.data.unit, ingredient.purchase_unit);

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .update({ quantity: parsed.data.quantity, unit: parsed.data.unit })
      .eq("id", recipeIngredientId)
      .eq("recipe_id", recipeId)
      .select("id");

    if (error) return { success: false, error: error.message };
    if (data?.length !== 1) return { success: false, error: "레시피 재료를 찾을 수 없습니다." };

    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath("/recipes");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "재료 수정에 실패했습니다." };
  }
}

export async function removeRecipeIngredient(recipeId: string, recipeIngredientId: string): Promise<ActionResult<null>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    await requireOwnedRecipe(supabase, recipeId, storeId);
    const { data, error } = await supabase.from("recipe_ingredients").delete().eq("id", recipeIngredientId).eq("recipe_id", recipeId).select("id");
    if (error) return { success: false, error: error.message };
    if (data?.length !== 1) return { success: false, error: "레시피 재료를 찾을 수 없습니다." };

    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath("/recipes");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "재료 삭제에 실패했습니다." };
  }
}

// ---------------------------------------------------------------------------
// Extra costs
// ---------------------------------------------------------------------------

export async function addExtraCost(recipeId: string, formData: FormData): Promise<ActionResult<null>> {
  const parsed = extraCostSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    costType: formData.get("costType") || "etc",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    await requireOwnedRecipe(supabase, recipeId, storeId);
    const { error } = await supabase.from("extra_costs").insert({
      recipe_id: recipeId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      cost_type: parsed.data.costType,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath("/recipes");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "추가 비용 등록에 실패했습니다." };
  }
}

export async function removeExtraCost(recipeId: string, extraCostId: string): Promise<ActionResult<null>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    await requireOwnedRecipe(supabase, recipeId, storeId);
    const { data, error } = await supabase.from("extra_costs").delete().eq("id", extraCostId).eq("recipe_id", recipeId).select("id");
    if (error) return { success: false, error: error.message };
    if (data?.length !== 1) return { success: false, error: "추가 비용을 찾을 수 없습니다." };

    revalidatePath(`/recipes/${recipeId}`);
    revalidatePath("/recipes");
    revalidatePath("/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "추가 비용 삭제에 실패했습니다." };
  }
}
