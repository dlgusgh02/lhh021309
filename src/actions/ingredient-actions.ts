"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreId } from "@/lib/supabase/dal";
import { ingredientFormSchema, type IngredientFormValues } from "@/lib/validations/ingredient";
import type { ActionResult, Ingredient } from "@/types";
import type { IngredientRow } from "@/types/database";

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

export async function getIngredients(): Promise<ActionResult<Ingredient[]>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as IngredientRow[]).map(toIngredient) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "식재료 목록을 불러오지 못했습니다." };
  }
}

export async function getIngredient(id: string): Promise<ActionResult<Ingredient>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !data) return { success: false, error: "식재료를 찾을 수 없습니다." };
    return { success: true, data: toIngredient(data as IngredientRow) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "식재료를 불러오지 못했습니다." };
  }
}

function parseIngredientForm(formData: FormData) {
  return ingredientFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    purchasePrice: formData.get("purchasePrice"),
    purchaseQuantity: formData.get("purchaseQuantity"),
    purchaseUnit: formData.get("purchaseUnit"),
    yieldRate: formData.get("yieldRate") || 100,
    supplier: formData.get("supplier") ?? "",
    memo: formData.get("memo") ?? "",
  });
}

export async function createIngredient(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = parseIngredientForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const values: IngredientFormValues = parsed.data;

    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        store_id: storeId,
        name: values.name,
        category: values.category,
        purchase_price: values.purchasePrice,
        purchase_quantity: values.purchaseQuantity,
        purchase_unit: values.purchaseUnit,
        base_unit: values.purchaseUnit,
        yield_rate: values.yieldRate,
        supplier: values.supplier || null,
        memo: values.memo || null,
      })
      .select("id")
      .single();

    if (error || !data) return { success: false, error: error?.message ?? "식재료 등록에 실패했습니다." };

    revalidatePath("/ingredients");
    return { success: true, data: { id: data.id as string } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "식재료 등록에 실패했습니다." };
  }
}

export async function updateIngredient(id: string, formData: FormData): Promise<ActionResult<null>> {
  const parsed = parseIngredientForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();
    const values: IngredientFormValues = parsed.data;

    // TRD §41: record the previous price into history before overwriting it,
    // but only when the price/quantity/unit actually changed.
    const { data: existing } = await supabase
      .from("ingredients")
      .select("purchase_price, purchase_quantity, purchase_unit")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (existing) {
      const changed =
        existing.purchase_price !== values.purchasePrice ||
        Number(existing.purchase_quantity) !== values.purchaseQuantity ||
        existing.purchase_unit !== values.purchaseUnit;

      if (changed) {
        await supabase.from("ingredient_price_history").insert({
          ingredient_id: id,
          purchase_price: existing.purchase_price,
          purchase_quantity: existing.purchase_quantity,
          purchase_unit: existing.purchase_unit,
        });
      }
    }

    const { error } = await supabase
      .from("ingredients")
      .update({
        name: values.name,
        category: values.category,
        purchase_price: values.purchasePrice,
        purchase_quantity: values.purchaseQuantity,
        purchase_unit: values.purchaseUnit,
        base_unit: values.purchaseUnit,
        yield_rate: values.yieldRate,
        supplier: values.supplier || null,
        memo: values.memo || null,
      })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/ingredients");
    revalidatePath(`/ingredients/${id}`);
    revalidatePath("/recipes");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "식재료 수정에 실패했습니다." };
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult<null>> {
  try {
    const storeId = await requireStoreId();
    const supabase = await createClient();

    // TRD §32, §42: block deletion while a recipe still references this ingredient.
    const { count } = await supabase
      .from("recipe_ingredients")
      .select("id", { count: "exact", head: true })
      .eq("ingredient_id", id);

    if (count && count > 0) {
      return {
        success: false,
        error: `이 식재료를 사용하는 레시피가 ${count}개 있어 삭제할 수 없습니다. 레시피에서 먼저 제거해주세요.`,
      };
    }

    const { error } = await supabase.from("ingredients").delete().eq("id", id).eq("store_id", storeId);
    if (error) return { success: false, error: error.message };

    revalidatePath("/ingredients");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "식재료 삭제에 실패했습니다." };
  }
}
