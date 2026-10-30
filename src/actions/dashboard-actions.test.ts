import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Recipe, Ingredient, ActionResult } from "@/types";

const { getIngredients } = vi.hoisted(() => ({ getIngredients: vi.fn() }));
vi.mock("@/actions/ingredient-actions", () => ({ getIngredients }));

const { getRecipes } = vi.hoisted(() => ({ getRecipes: vi.fn() }));
vi.mock("@/actions/recipe-actions", () => ({ getRecipes }));

const { computeRecipeSummary } = vi.hoisted(() => ({ computeRecipeSummary: vi.fn() }));
vi.mock("@/lib/recipes/recipe-summary", () => ({ computeRecipeSummary }));

import { getDashboardData } from "@/actions/dashboard-actions";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "r1",
    storeId: "store-1",
    name: "제육볶음",
    category: "korean",
    description: null,
    servings: 2,
    sellingPrice: 10000,
    imageUrl: null,
    isFavorite: false,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    recipeIngredients: [],
    extraCosts: [],
    ...overrides,
  };
}

const noIngredients: ActionResult<Ingredient[]> = { success: true, data: [] };

beforeEach(() => {
  vi.clearAllMocks();
  getIngredients.mockResolvedValue(noIngredients);
});

describe("getDashboardData", () => {
  it("propagates a failed ingredients fetch without touching recipes", async () => {
    getIngredients.mockResolvedValue({ success: false, error: "ingredients boom" });
    getRecipes.mockResolvedValue({ success: true, data: [] });

    const result = await getDashboardData();

    expect(result).toEqual({ success: false, error: "ingredients boom" });
  });

  it("excludes recipes with no selling price from the profitability rankings but still counts them", async () => {
    getRecipes.mockResolvedValue({
      success: true,
      data: [makeRecipe({ id: "no-price", sellingPrice: 0 }), makeRecipe({ id: "priced", sellingPrice: 10000 })],
    });
    computeRecipeSummary.mockReturnValue({ foodCostPercentage: 30, grossMarginPercentage: 70, finalCostPerServing: 1500 });

    const result = await getDashboardData();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recipeCount).toBe(2); // both count toward recipeCount
    expect(result.data.topProfitableRecipes).toHaveLength(1); // only the priced one is ranked
    expect(computeRecipeSummary).toHaveBeenCalledTimes(1);
  });

  it("drops a recipe from the rankings (but not the count) when computeRecipeSummary throws", async () => {
    getRecipes.mockResolvedValue({
      success: true,
      data: [makeRecipe({ id: "broken", sellingPrice: 5000 })],
    });
    computeRecipeSummary.mockImplementation(() => {
      throw new Error("incompatible unit");
    });

    const result = await getDashboardData();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recipeCount).toBe(1);
    expect(result.data.topProfitableRecipes).toHaveLength(0);
    expect(result.data.averageFoodCostPercentage).toBe(0);
  });

  it("averages, and ranks ascending/descending by food cost percentage, across multiple recipes", async () => {
    getRecipes.mockResolvedValue({
      success: true,
      data: [
        makeRecipe({ id: "low", sellingPrice: 10000 }),
        makeRecipe({ id: "mid", sellingPrice: 10000 }),
        makeRecipe({ id: "high", sellingPrice: 10000 }),
      ],
    });
    computeRecipeSummary
      .mockReturnValueOnce({ foodCostPercentage: 20, grossMarginPercentage: 80, finalCostPerServing: 1000 })
      .mockReturnValueOnce({ foodCostPercentage: 50, grossMarginPercentage: 50, finalCostPerServing: 2500 })
      .mockReturnValueOnce({ foodCostPercentage: 80, grossMarginPercentage: 20, finalCostPerServing: 4000 });

    const result = await getDashboardData();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.averageFoodCostPercentage).toBeCloseTo(50);
    expect(result.data.topProfitableRecipes.map((s) => s.recipe.id)).toEqual(["low", "mid", "high"]);
    expect(result.data.highRiskRecipes.map((s) => s.recipe.id)).toEqual(["high", "mid", "low"]);
  });
});
