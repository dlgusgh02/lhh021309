/**
 * Bridges a `Recipe` domain object (as read from Supabase, with its
 * recipe_ingredients + joined ingredient rows) into the calculation engine.
 *
 * This file does NOT implement any cost math itself — it only shapes data
 * and delegates to `computeRecipeCostResult` (TRD §44-45, §94).
 */
import { computeRecipeCostResult, type RecipeCostResult } from "@/lib/calculations";
import type { Recipe } from "@/types";

export function computeRecipeSummary(recipe: Recipe): RecipeCostResult {
  const ingredientLines = (recipe.recipeIngredients ?? [])
    .filter((ri) => ri.ingredient)
    .map((ri) => ({
      ingredientId: ri.ingredientId,
      name: ri.ingredient!.name,
      quantity: ri.quantity,
      unit: ri.unit,
      purchase: {
        purchasePrice: ri.ingredient!.purchasePrice,
        purchaseQuantity: ri.ingredient!.purchaseQuantity,
        purchaseUnit: ri.ingredient!.purchaseUnit,
        yieldRate: ri.ingredient!.yieldRate,
      },
    }));

  const extraCosts = (recipe.extraCosts ?? []).map((ec) => ({ name: ec.name, amount: ec.amount }));

  return computeRecipeCostResult({
    ingredientLines,
    extraCosts,
    servings: recipe.servings || 1,
    sellingPrice: recipe.sellingPrice,
  });
}
