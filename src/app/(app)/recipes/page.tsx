import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeTable, type RecipeTableRow } from "@/components/recipes/recipe-table";
import { getRecipes } from "@/actions/recipe-actions";
import { computeRecipeSummary } from "@/lib/recipes/recipe-summary";

export const metadata: Metadata = { title: "레시피" };

export default async function RecipesPage() {
  const result = await getRecipes();
  const rows: RecipeTableRow[] = result.success
    ? result.data.map((recipe) => {
        try {
          return { recipe, result: computeRecipeSummary(recipe) };
        } catch {
          return { recipe, result: null };
        }
      })
    : [];

  return (
    <div>
      <PageHeader
        title="레시피"
        description="레시피에 재료를 추가하면 원가와 원가율이 자동으로 계산됩니다."
        action={
          <Button render={<Link href="/recipes/new" />} nativeButton={false}>
            <Plus className="size-4" />
            레시피 만들기
          </Button>
        }
      />
      {!result.success && <p className="text-sm text-destructive mb-4">{result.error}</p>}
      <RecipeTable rows={rows} />
    </div>
  );
}
