"use server";

import { getIngredients } from "@/actions/ingredient-actions";
import { getRecipes } from "@/actions/recipe-actions";
import { computeRecipeSummary } from "@/lib/recipes/recipe-summary";
import { getProfitabilityGrade } from "@/lib/calculations";
import type { ActionResult, Ingredient, Recipe } from "@/types";

export interface RecipeWithSummary {
  recipe: Recipe;
  foodCostPercentage: number;
  grossMarginPercentage: number;
  finalCostPerServing: number;
  grade: string;
}

export interface DashboardData {
  ingredientCount: number;
  recipeCount: number;
  averageFoodCostPercentage: number;
  averageGrossMarginPercentage: number;
  topProfitableRecipes: RecipeWithSummary[];
  highRiskRecipes: RecipeWithSummary[];
  recentIngredients: Ingredient[];
  recentRecipes: Recipe[];
}

function summarize(recipe: Recipe): RecipeWithSummary | null {
  // A recipe with no selling price yet, or a line item referencing a
  // now-incompatible unit, shouldn't crash the whole dashboard — just omit it
  // from the profitability rankings (it still counts toward recipeCount).
  try {
    const result = computeRecipeSummary(recipe);
    return {
      recipe,
      foodCostPercentage: result.foodCostPercentage,
      grossMarginPercentage: result.grossMarginPercentage,
      finalCostPerServing: result.finalCostPerServing,
      grade: getProfitabilityGrade(result.foodCostPercentage),
    };
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  const [ingredientsResult, recipesResult] = await Promise.all([getIngredients(), getRecipes()]);

  if (!ingredientsResult.success) return ingredientsResult;
  if (!recipesResult.success) return recipesResult;

  const ingredients = ingredientsResult.data;
  const recipes = recipesResult.data;

  const summaries = recipes
    .filter((r) => r.sellingPrice > 0)
    .map(summarize)
    .filter((s): s is RecipeWithSummary => s !== null);

  const averageFoodCostPercentage =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.foodCostPercentage, 0) / summaries.length
      : 0;
  const averageGrossMarginPercentage =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.grossMarginPercentage, 0) / summaries.length
      : 0;

  const byFoodCostAsc = [...summaries].sort((a, b) => a.foodCostPercentage - b.foodCostPercentage);
  const byFoodCostDesc = [...summaries].sort((a, b) => b.foodCostPercentage - a.foodCostPercentage);

  return {
    success: true,
    data: {
      ingredientCount: ingredients.length,
      recipeCount: recipes.length,
      averageFoodCostPercentage,
      averageGrossMarginPercentage,
      topProfitableRecipes: byFoodCostAsc.slice(0, 5),
      highRiskRecipes: byFoodCostDesc.slice(0, 5),
      recentIngredients: ingredients.slice(0, 5),
      recentRecipes: recipes.slice(0, 5),
    },
  };
}
