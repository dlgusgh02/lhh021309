/**
 * Margin / profitability calculations (TRD §8-11, §40, PRD §12-15, §40).
 *
 * IMPORTANT: gross margin (매출총이익률) and markup (마크업률) are different
 * and must never be conflated in the UI (TRD §11, §40, PRD §40):
 *   - gross margin = profit / SELLING PRICE
 *   - markup       = profit / COST
 */
import { InvalidQuantityError } from "@/lib/calculations/ingredient";

/** 원가율(%) = 원가 / 판매가 * 100 */
export function calculateFoodCostPercentage(cost: number, sellingPrice: number): number {
  if (!(sellingPrice > 0)) {
    throw new InvalidQuantityError("판매가격은 0보다 커야 원가율을 계산할 수 있습니다.");
  }
  return (cost / sellingPrice) * 100;
}

/** 매출총이익 = 판매가 - 원가 */
export function calculateGrossProfit(sellingPrice: number, cost: number): number {
  return sellingPrice - cost;
}

/** 매출총이익률(%) = (판매가 - 원가) / 판매가 * 100 */
export function calculateGrossMargin(sellingPrice: number, cost: number): number {
  if (!(sellingPrice > 0)) {
    throw new InvalidQuantityError("판매가격은 0보다 커야 매출총이익률을 계산할 수 있습니다.");
  }
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

/** 마크업률(%) = (판매가 - 원가) / 원가 * 100 */
export function calculateMarkup(sellingPrice: number, cost: number): number {
  if (!(cost > 0)) {
    throw new InvalidQuantityError("원가는 0보다 커야 마크업률을 계산할 수 있습니다.");
  }
  return ((sellingPrice - cost) / cost) * 100;
}

export interface ProfitAnalysis {
  sellingPrice: number;
  cost: number;
  grossProfit: number;
  foodCostPercentage: number;
  grossMarginPercentage: number;
  markupPercentage: number;
}

/** Convenience bundle of every derived metric for a given cost/selling price pair. */
export function analyzeProfitability(cost: number, sellingPrice: number): ProfitAnalysis {
  return {
    sellingPrice,
    cost,
    grossProfit: calculateGrossProfit(sellingPrice, cost),
    foodCostPercentage: sellingPrice > 0 ? calculateFoodCostPercentage(cost, sellingPrice) : 0,
    grossMarginPercentage: sellingPrice > 0 ? calculateGrossMargin(sellingPrice, cost) : 0,
    markupPercentage: cost > 0 ? calculateMarkup(sellingPrice, cost) : 0,
  };
}

export type ProfitabilityGrade = "매우 좋음" | "좋음" | "보통" | "주의" | "위험";

export interface ProfitabilityGradeThresholds {
  /** foodCostPercentage <= this -> "매우 좋음" */
  excellent: number;
  /** <= this -> "좋음" */
  good: number;
  /** <= this -> "보통" */
  fair: number;
  /** <= this -> "주의"; above -> "위험" */
  caution: number;
}

export const DEFAULT_PROFITABILITY_THRESHOLDS: ProfitabilityGradeThresholds = {
  excellent: 25,
  good: 30,
  fair: 35,
  caution: 40,
};

/** Maps a food-cost percentage to a profitability grade (TRD §20 / PRD §20 defaults, configurable). */
export function getProfitabilityGrade(
  foodCostPercentage: number,
  thresholds: ProfitabilityGradeThresholds = DEFAULT_PROFITABILITY_THRESHOLDS,
): ProfitabilityGrade {
  if (foodCostPercentage <= thresholds.excellent) return "매우 좋음";
  if (foodCostPercentage <= thresholds.good) return "좋음";
  if (foodCostPercentage <= thresholds.fair) return "보통";
  if (foodCostPercentage <= thresholds.caution) return "주의";
  return "위험";
}
