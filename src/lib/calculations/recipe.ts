/**
 * Recipe-level cost calculations (TRD §7, PRD §7-10).
 */
import { InvalidQuantityError } from "@/lib/calculations/ingredient";

export interface RecipeIngredientCost {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface ExtraCostItem {
  id?: string;
  name: string;
  amount: number;
}

/** Sum of every recipe ingredient's usage cost. */
export function calculateRecipeCost(items: { cost: number }[]): number {
  return items.reduce((total, item) => total + item.cost, 0);
}

/** 1인분(1 serving) 원가 = 총 레시피 원가 / 생산 인분 */
export function calculateCostPerServing(recipeCost: number, servings: number): number {
  if (!(servings > 0)) {
    throw new InvalidQuantityError("인분(생산량) 수는 0보다 커야 합니다.");
  }
  return recipeCost / servings;
}

/** Sum of all extra (non-ingredient) costs, e.g. packaging, utensils. */
export function calculateExtraCostTotal(extraCosts: ExtraCostItem[]): number {
  return extraCosts.reduce((total, item) => total + item.amount, 0);
}

/** 최종 원가 = 1인분 원가 + 추가 비용 합계 */
export function calculateFinalCost(costPerServing: number, extraCostTotal: number): number {
  return costPerServing + extraCostTotal;
}
