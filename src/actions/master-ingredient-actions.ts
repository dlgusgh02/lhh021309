"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, MasterIngredient } from "@/types";
import type { MasterIngredientRow } from "@/types/database";

function toMasterIngredient(row: MasterIngredientRow): MasterIngredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    referenceUnit: row.reference_unit,
    referencePrice: row.reference_price,
    priceUpdatedAt: row.price_updated_at,
  };
}

/** Browsable, read-only catalog every authenticated user can pull entries from (see supabase/schema.sql). */
export async function getMasterIngredients(): Promise<ActionResult<MasterIngredient[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("master_ingredients").select("*").order("name");
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as MasterIngredientRow[]).map(toMasterIngredient) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "공용 재료 목록을 불러오지 못했습니다." };
  }
}
