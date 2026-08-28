import { describe, expect, it } from "vitest";
import {
  analyzeProfitability,
  calculateFoodCostPercentage,
  calculateGrossMargin,
  calculateGrossProfit,
  calculateMarkup,
  DEFAULT_PROFITABILITY_THRESHOLDS,
  getProfitabilityGrade,
} from "@/lib/calculations/margin";
import { InvalidQuantityError } from "@/lib/calculations/ingredient";

describe("calculateFoodCostPercentage", () => {
  it("computes 3,000/10,000 = 30%", () => {
    expect(calculateFoodCostPercentage(3000, 10000)).toBe(30);
  });

  it("throws when selling price is 0", () => {
    expect(() => calculateFoodCostPercentage(3000, 0)).toThrow(InvalidQuantityError);
  });
});

describe("calculateGrossProfit", () => {
  it("computes 10,000 - 3,000 = 7,000", () => {
    expect(calculateGrossProfit(10000, 3000)).toBe(7000);
  });

  it("can be negative when selling below cost", () => {
    expect(calculateGrossProfit(2000, 3000)).toBe(-1000);
  });
});

describe("calculateGrossMargin", () => {
  it("computes (10,000-3,000)/10,000 = 70%", () => {
    expect(calculateGrossMargin(10000, 3000)).toBe(70);
  });

  it("throws when selling price is 0", () => {
    expect(() => calculateGrossMargin(0, 3000)).toThrow(InvalidQuantityError);
  });
});

describe("calculateMarkup", () => {
  it("computes (10,000-3,000)/3,000 ≈ 233.33%", () => {
    expect(calculateMarkup(10000, 3000)).toBeCloseTo(233.33, 1);
  });

  it("differs from gross margin for the same inputs (5,000 cost / 10,000 price)", () => {
    // TRD §40 / §11: markup 100% vs gross margin 50% for the same numbers.
    expect(calculateGrossMargin(10000, 5000)).toBe(50);
    expect(calculateMarkup(10000, 5000)).toBe(100);
  });

  it("throws when cost is 0", () => {
    expect(() => calculateMarkup(10000, 0)).toThrow(InvalidQuantityError);
  });
});

describe("analyzeProfitability", () => {
  it("bundles all derived metrics", () => {
    const result = analyzeProfitability(3000, 10000);
    expect(result.grossProfit).toBe(7000);
    expect(result.foodCostPercentage).toBe(30);
    expect(result.grossMarginPercentage).toBe(70);
    expect(result.markupPercentage).toBeCloseTo(233.33, 1);
  });

  it("does not throw when selling price is 0 (returns zeroed percentages)", () => {
    const result = analyzeProfitability(3000, 0);
    expect(result.foodCostPercentage).toBe(0);
    expect(result.grossMarginPercentage).toBe(0);
  });
});

describe("getProfitabilityGrade", () => {
  it("grades using default thresholds", () => {
    expect(getProfitabilityGrade(20)).toBe("매우 좋음");
    expect(getProfitabilityGrade(28)).toBe("좋음");
    expect(getProfitabilityGrade(32)).toBe("보통");
    expect(getProfitabilityGrade(38)).toBe("주의");
    expect(getProfitabilityGrade(45)).toBe("위험");
  });

  it("respects boundary values", () => {
    expect(getProfitabilityGrade(DEFAULT_PROFITABILITY_THRESHOLDS.excellent)).toBe("매우 좋음");
    expect(getProfitabilityGrade(DEFAULT_PROFITABILITY_THRESHOLDS.caution)).toBe("주의");
  });

  it("supports custom thresholds", () => {
    expect(
      getProfitabilityGrade(15, { excellent: 10, good: 20, fair: 30, caution: 40 }),
    ).toBe("좋음");
  });
});
