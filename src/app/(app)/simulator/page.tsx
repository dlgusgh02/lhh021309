import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PriceSimulator, type SimulatorRecipeOption } from "@/components/simulator/price-simulator";
import { getRecipes } from "@/actions/recipe-actions";
import { computeRecipeSummary } from "@/lib/recipes/recipe-summary";
import { analyzeProfitability } from "@/lib/calculations";

export const metadata: Metadata = { title: "판매가 시뮬레이터" };

export default async function SimulatorPage() {
  const recipesResult = await getRecipes();
  const recipeOptions: SimulatorRecipeOption[] = recipesResult.success
    ? recipesResult.data.flatMap((recipe) => {
        // A recipe with no ingredients yet, or a line referencing a
        // now-incompatible unit, just doesn't appear in the picker — the
        // simulator itself still works fine typed in manually.
        try {
          const summary = computeRecipeSummary(recipe);
          return [{ id: recipe.id, name: recipe.name, cost: summary.finalCostPerServing, sellingPrice: recipe.sellingPrice }];
        } catch {
          return [];
        }
      })
    : [];

  // Same "only recipes with a selling price count" rule as the dashboard's
  // average, so the simulator's "store average" line matches what the
  // dashboard reports for this store.
  const pricedRecipes = recipeOptions.filter((r) => r.sellingPrice > 0);
  const storeAverageFoodCostPercentage =
    pricedRecipes.length > 0
      ? pricedRecipes.reduce((sum, r) => sum + analyzeProfitability(r.cost, r.sellingPrice).foodCostPercentage, 0) / pricedRecipes.length
      : null;

  return (
    <div>
      <PageHeader title="판매가 시뮬레이터" description="여러 판매가격에 따른 원가율과 이익을 비교해보세요." />
      <PriceSimulator recipes={recipeOptions} storeAverageFoodCostPercentage={storeAverageFoodCostPercentage} />
    </div>
  );
}
