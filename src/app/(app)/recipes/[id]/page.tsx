import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeIngredientEditor } from "@/components/recipes/recipe-ingredient-editor";
import { ExtraCostEditor } from "@/components/recipes/extra-cost-editor";
import { RecipeCostSummary } from "@/components/recipes/recipe-cost-summary";
import { PricingRecommendationCard } from "@/components/recipes/pricing-recommendation-card";
import { SellingPriceForm } from "@/components/recipes/selling-price-form";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { DuplicateRecipeButton } from "@/components/recipes/duplicate-recipe-button";
import { getRecipe } from "@/actions/recipe-actions";
import { getIngredients } from "@/actions/ingredient-actions";
import { computeRecipeSummary } from "@/lib/recipes/recipe-summary";
import { RECIPE_CATEGORIES } from "@/types";

export const metadata: Metadata = { title: "레시피 상세" };

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipeResult, ingredientsResult] = await Promise.all([getRecipe(id), getIngredients()]);

  if (!recipeResult.success) {
    notFound();
  }

  const recipe = recipeResult.data;
  const availableIngredients = ingredientsResult.success ? ingredientsResult.data : [];

  let summary;
  let summaryError: string | null = null;
  try {
    summary = computeRecipeSummary(recipe);
  } catch (err) {
    summaryError = err instanceof Error ? err.message : "원가를 계산할 수 없습니다.";
  }

  const categoryLabel = RECIPE_CATEGORIES.find((c) => c.value === recipe.category)?.label ?? recipe.category;

  return (
    <div>
      <PageHeader
        title={recipe.name}
        description={recipe.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <FavoriteButton id={recipe.id} name={recipe.name} isFavorite={recipe.isFavorite} />
            <Button variant="outline" render={<Link href={`/recipes/${recipe.id}/edit`} />} nativeButton={false}>
              <Pencil className="size-4" />
              기본 정보 수정
            </Button>
            <DuplicateRecipeButton id={recipe.id} />
            <DeleteRecipeButton id={recipe.id} name={recipe.name} />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{categoryLabel}</Badge>
        <span>생산 {recipe.servings}인분</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">재료 구성</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipeIngredientEditor
                recipeId={recipe.id}
                recipeIngredients={recipe.recipeIngredients ?? []}
                availableIngredients={availableIngredients}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">추가 비용</CardTitle>
            </CardHeader>
            <CardContent>
              <ExtraCostEditor recipeId={recipe.id} extraCosts={recipe.extraCosts ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">판매가격</CardTitle>
            </CardHeader>
            <CardContent>
              <SellingPriceForm recipeId={recipe.id} sellingPrice={recipe.sellingPrice} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {summaryError && (
            <p className="text-sm text-destructive">{summaryError}</p>
          )}
          {summary && (
            <>
              <RecipeCostSummary result={summary} />
              <PricingRecommendationCard cost={summary.finalCostPerServing} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
