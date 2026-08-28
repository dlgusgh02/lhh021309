import { describe, expect, it } from "vitest";
import {
  calculatePriceByDesiredProfit,
  calculatePriceByTargetFoodCost,
  calculatePriceByTargetMargin,
  getPricingRecommendation,
  roundPrice,
} from "@/lib/calculations/pricing";
import { InvalidQuantityError } from "@/lib/calculations/ingredient";

describe("calculatePriceByTargetFoodCost", () => {
  it("computes 3,000 / 0.30 = 10,000", () => {
    expect(calculatePriceByTargetFoodCost(3000, 0.3)).toBe(10000);
  });

  it("throws for target rate of 0%", () => {
    expect(() => calculatePriceByTargetFoodCost(3000, 0)).toThrow(InvalidQuantityError);
  });

  it("throws for target rate above 100%", () => {
    expect(() => calculatePriceByTargetFoodCost(3000, 1.1)).toThrow(InvalidQuantityError);
  });

  it("throws for negative cost", () => {
    expect(() => calculatePriceByTargetFoodCost(-100, 0.3)).toThrow(InvalidQuantityError);
  });
});

describe("calculatePriceByTargetMargin", () => {
  it("computes 3,000 / (1 - 0.60) = 7,500", () => {
    expect(calculatePriceByTargetMargin(3000, 0.6)).toBe(7500);
  });

  it("throws when target margin is 100%", () => {
    expect(() => calculatePriceByTargetMargin(3000, 1)).toThrow(InvalidQuantityError);
  });

  it("throws when target margin is negative", () => {
    expect(() => calculatePriceByTargetMargin(3000, -0.1)).toThrow(InvalidQuantityError);
  });
});

describe("calculatePriceByDesiredProfit", () => {
  it("computes 3,000 + 5,000 = 8,000", () => {
    expect(calculatePriceByDesiredProfit(3000, 5000)).toBe(8000);
  });

  it("throws for negative desired profit", () => {
    expect(() => calculatePriceByDesiredProfit(3000, -1)).toThrow(InvalidQuantityError);
  });
});

describe("roundPrice", () => {
  it("rounds to nearest 100 by default", () => {
    expect(roundPrice(10186)).toBe(10200);
  });

  it("rounds to nearest 500", () => {
    expect(roundPrice(10186, "nearest500")).toBe(10000);
  });

  it("rounds to nearest 1000", () => {
    expect(roundPrice(10186, "nearest1000")).toBe(10000);
  });

  it("produces a charm price ending in 900", () => {
    expect(roundPrice(8571, "charm900")).toBe(8900);
  });

  it("mode 'none' rounds to the nearest integer only", () => {
    expect(roundPrice(8571.6, "none")).toBe(8572);
  });
});

describe("getPricingRecommendation", () => {
  it("returns all six standard recommendations for a 3,000원 cost", () => {
    const rec = getPricingRecommendation(3000);
    expect(rec.targetFoodCost30).toBe(10000);
    expect(rec.targetFoodCost25).toBe(12000);
    expect(rec.targetMargin60).toBe(7500);
    expect(rec.targetFoodCost25).toBeGreaterThan(rec.targetFoodCost30);
    expect(rec.targetFoodCost30).toBeGreaterThan(rec.targetFoodCost35);
  });
});
