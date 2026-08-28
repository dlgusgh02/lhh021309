import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getRecipe } from "@/actions/recipe-actions";

export const metadata: Metadata = { title: "레시피 수정" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRecipe(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="레시피 수정" description="레시피 기본 정보를 수정합니다." />
      <RecipeForm recipe={result.data} />
    </div>
  );
}
