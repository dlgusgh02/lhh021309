import { describe, expect, it } from "vitest";
import { computeRecipeCostResult } from "@/lib/calculations";

describe("computeRecipeCostResult (제육볶음 end-to-end, PRD §8-15, §31)", () => {
  const params = {
    ingredientLines: [
      {
        ingredientId: "pork",
        name: "돼지고기",
        quantity: 600,
        unit: "g",
        purchase: { purchasePrice: 18000, purchaseQuantity: 1, purchaseUnit: "kg" },
      },
      {
        ingredientId: "onion",
        name: "양파",
        quantity: 200,
        unit: "g",
        purchase: { purchasePrice: 3, purchaseQuantity: 1, purchaseUnit: "g" },
      },
      {
        ingredientId: "gochujang",
        name: "고추장",
        quantity: 100,
        unit: "g",
        purchase: { purchasePrice: 8, purchaseQuantity: 1, purchaseUnit: "g" },
      },
      {
        ingredientId: "sugar",
        name: "설탕",
        quantity: 30,
        unit: "g",
        purchase: { purchasePrice: 2, purchaseQuantity: 1, purchaseUnit: "g" },
      },
    ],
    extraCosts: [
      { name: "용기", amount: 300 },
      { name: "수저", amount: 100 },
      { name: "소스 용기", amount: 100 },
    ],
    servings: 4,
    sellingPrice: 10000,
  };

  it("computes ingredient line costs matching the PRD worked example", () => {
    const result = computeRecipeCostResult(params);
    expect(result.ingredientLines.map((l) => l.cost)).toEqual([10800, 600, 800, 60]);
  });

  it("totals recipe cost to 12,260원", () => {
    const result = computeRecipeCostResult(params);
    expect(result.ingredientCostTotal).toBe(12260);
    expect(result.recipeTotalCost).toBe(12260);
  });

  it("computes cost per serving of 3,065원", () => {
    const result = computeRecipeCostResult(params);
    expect(result.costPerServing).toBe(3065);
  });

  it("adds extra costs to reach a final cost of 3,565원", () => {
    const result = computeRecipeCostResult(params);
    expect(result.extraCostTotal).toBe(500);
    expect(result.finalCostPerServing).toBe(3565);
  });

  it("derives profit metrics at a 10,000원 selling price", () => {
    const result = computeRecipeCostResult(params);
    expect(result.grossProfit).toBe(10000 - 3565);
    expect(result.foodCostPercentage).toBeCloseTo(35.65, 2);
    expect(result.grossMarginPercentage).toBeCloseTo(64.35, 2);
  });
});
