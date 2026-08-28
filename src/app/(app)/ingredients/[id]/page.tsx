import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { getIngredient } from "@/actions/ingredient-actions";

export const metadata: Metadata = { title: "식재료 수정" };

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getIngredient(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={result.data.name} description="식재료 정보를 수정합니다." />
      <IngredientForm ingredient={result.data} />
    </div>
  );
}
