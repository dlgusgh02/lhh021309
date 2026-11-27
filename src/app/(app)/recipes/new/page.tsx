import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getIngredients } from "@/actions/ingredient-actions";

export const metadata: Metadata = { title: "레시피 만들기" };

export default async function NewRecipePage() {
  const ingredientsResult = await getIngredients();
  const availableIngredients = ingredientsResult.success ? ingredientsResult.data : [];

  return (
    <div className="max-w-3xl">
      <PageHeader title="레시피 만들기" description="기본 정보와 재료를 함께 입력하면 원가가 바로 계산됩니다." />
      <RecipeForm availableIngredients={availableIngredients} />
    </div>
  );
}
