/**
 * Selling-price recommendation calculations (TRD §12-14, §47, PRD §12-17).
 */
import { InvalidQuantityError } from "@/lib/calculations/ingredient";

/** 판매가 = 원가 / 목표 원가율 (targetFoodCostRate as a fraction, e.g. 0.3 for 30%) */
export function calculatePriceByTargetFoodCost(cost: number, targetFoodCostRate: number): number {
  if (cost < 0) {
    throw new InvalidQuantityError("원가는 0 이상이어야 합니다.");
  }
  if (!(targetFoodCostRate > 0) || targetFoodCostRate > 1) {
    throw new InvalidQuantityError("목표 원가율은 0%보다 크고 100% 이하여야 합니다.");
  }
  return cost / targetFoodCostRate;
}

/** 판매가 = 원가 / (1 - 목표 매출총이익률) (targetMargin as a fraction, e.g. 0.6 for 60%) */
export function calculatePriceByTargetMargin(cost: number, targetMargin: number): number {
  if (cost < 0) {
    throw new InvalidQuantityError("원가는 0 이상이어야 합니다.");
  }
  if (!(targetMargin >= 0) || targetMargin >= 1) {
    throw new InvalidQuantityError("목표 매출총이익률은 0% 이상 100% 미만이어야 합니다.");
  }
  return cost / (1 - targetMargin);
}

/** 판매가 = 원가 + 원하는 이익 금액 */
export function calculatePriceByDesiredProfit(cost: number, desiredProfit: number): number {
  if (cost < 0) {
    throw new InvalidQuantityError("원가는 0 이상이어야 합니다.");
  }
  if (desiredProfit < 0) {
    throw new InvalidQuantityError("목표 이익 금액은 0 이상이어야 합니다.");
  }
  return cost + desiredProfit;
}

export type RoundingMode = "none" | "nearest100" | "nearest500" | "nearest1000" | "charm900";

/** Rounds a recommended price to a market-friendly value (TRD §47). */
export function roundPrice(value: number, mode: RoundingMode = "nearest100"): number {
  switch (mode) {
    case "none":
      return Math.round(value);
    case "nearest100":
      return Math.round(value / 100) * 100;
    case "nearest500":
      return Math.round(value / 500) * 500;
    case "nearest1000":
      return Math.round(value / 1000) * 1000;
    case "charm900": {
      // Snap to the nearest price ending in "900" (…, 6900, 7900, 8900, 9900, …),
      // picking whichever of the two surrounding candidates is closer.
      const lower = Math.floor((value - 900) / 1000) * 1000 + 900;
      const upper = lower + 1000;
      return value - lower <= upper - value ? lower : upper;
    }
  }
}

export interface PricingRecommendation {
  targetFoodCost25: number;
  targetFoodCost30: number;
  targetFoodCost35: number;
  targetMargin50: number;
  targetMargin60: number;
  targetMargin70: number;
}

/** Standard set of recommended prices shown on the recipe detail screen (TRD §46). */
export function getPricingRecommendation(cost: number): PricingRecommendation {
  return {
    targetFoodCost25: calculatePriceByTargetFoodCost(cost, 0.25),
    targetFoodCost30: calculatePriceByTargetFoodCost(cost, 0.3),
    targetFoodCost35: calculatePriceByTargetFoodCost(cost, 0.35),
    targetMargin50: calculatePriceByTargetMargin(cost, 0.5),
    targetMargin60: calculatePriceByTargetMargin(cost, 0.6),
    targetMargin70: calculatePriceByTargetMargin(cost, 0.7),
  };
}
