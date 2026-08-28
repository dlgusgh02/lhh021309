import { describe, expect, it } from "vitest";
import {
  calculateCostPerServing,
  calculateExtraCostTotal,
  calculateFinalCost,
  calculateRecipeCost,
} from "@/lib/calculations/recipe";
import { InvalidQuantityError } from "@/lib/calculations/ingredient";

describe("calculateRecipeCost", () => {
  it("sums 제육볶음 line items to 12,260원", () => {
    const total = calculateRecipeCost([
      { cost: 10800 },
      { cost: 600 },
      { cost: 800 },
      { cost: 60 },
    ]);
    expect(total).toBe(12260);
  });

  it("returns 0 for an empty ingredient list", () => {
    expect(calculateRecipeCost([])).toBe(0);
  });
});

describe("calculateCostPerServing", () => {
  it("computes 12,260 / 4 = 3,065", () => {
    expect(calculateCostPerServing(12260, 4)).toBe(3065);
  });

  it("throws when servings is 0", () => {
    expect(() => calculateCostPerServing(12000, 0)).toThrow(InvalidQuantityError);
  });

  it("throws when servings is negative", () => {
    expect(() => calculateCostPerServing(12000, -2)).toThrow(InvalidQuantityError);
  });
});

describe("calculateExtraCostTotal", () => {
  it("sums extra cost line items", () => {
    const total = calculateExtraCostTotal([
      { name: "용기", amount: 300 },
      { name: "수저", amount: 100 },
      { name: "소스 용기", amount: 100 },
    ]);
    expect(total).toBe(500);
  });

  it("returns 0 with no extra costs", () => {
    expect(calculateExtraCostTotal([])).toBe(0);
  });
});

describe("calculateFinalCost", () => {
  it("adds extra costs onto per-serving cost", () => {
    expect(calculateFinalCost(3065, 500)).toBe(3565);
  });
});
