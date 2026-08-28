/**
 * Public entry point for the calculation engine. UI code and Server Actions
 * should import from here (or from the specific submodule) — never
 * reimplement any of this math inline (TRD §5, §49, §94).
 */
export * from "@/lib/calculations/ingredient";
export * from "@/lib/calculations/recipe";
export * from "@/lib/calculations/margin";
export * from "@/lib/calculations/pricing";
export { convertUnit, getUnitCategory, IncompatibleUnitError, UnsupportedUnitError } from "@/lib/units/conversions";

import {
  calculateUsageCostFromPurchase,
  type IngredientPurchaseInfo,
} from "@/lib/calculations/ingredient";
import {
  calculateCostPerServing,
  calculateExtraCostTotal,
  calculateFinalCost,
  calculateRecipeCost,
  type ExtraCostItem,
} from "@/lib/calculations/recipe";
import { analyzeProfitability } from "@/lib/calculations/margin";

export interface RecipeIngredientLine {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  purchase: IngredientPurchaseInfo;
}

export interface RecipeIngredientLineResult {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface RecipeCostResult {
  ingredientLines: RecipeIngredientLineResult[];
  ingredientCostTotal: number;
  extraCostTotal: number;
  recipeTotalCost: number;
  costPerServing: number;
  finalCostPerServing: number;
  sellingPrice: number;
  grossProfit: number;
  foodCostPercentage: number;
  grossMarginPercentage: number;
  markupPercentage: number;
}

/**
 * The single, authoritative way to go from raw recipe inputs (ingredient
 * lines + extra costs + servings + selling price) to every derived number
 * shown across the recipe list, recipe detail, and dashboard (TRD §45, §50).
 */
export function computeRecipeCostResult(params: {
  ingredientLines: RecipeIngredientLine[];
  extraCosts: ExtraCostItem[];
  servings: number;
  sellingPrice: number;
}): RecipeCostResult {
  const { ingredientLines, extraCosts, servings, sellingPrice } = params;

  const resolvedLines: RecipeIngredientLineResult[] = ingredientLines.map((line) => ({
    ingredientId: line.ingredientId,
    name: line.name,
    quantity: line.quantity,
    unit: line.unit,
    cost: calculateUsageCostFromPurchase(line.purchase, line.quantity, line.unit),
  }));

  const ingredientCostTotal = calculateRecipeCost(resolvedLines);
  const extraCostTotal = calculateExtraCostTotal(extraCosts);
  const recipeTotalCost = ingredientCostTotal;
  const costPerServing = calculateCostPerServing(recipeTotalCost, servings);
  const finalCostPerServing = calculateFinalCost(costPerServing, extraCostTotal);

  const profit = analyzeProfitability(finalCostPerServing, sellingPrice);

  return {
    ingredientLines: resolvedLines,
    ingredientCostTotal,
    extraCostTotal,
    recipeTotalCost,
    costPerServing,
    finalCostPerServing,
    sellingPrice,
    grossProfit: profit.grossProfit,
    foodCostPercentage: profit.foodCostPercentage,
    grossMarginPercentage: profit.grossMarginPercentage,
    markupPercentage: profit.markupPercentage,
  };
}
