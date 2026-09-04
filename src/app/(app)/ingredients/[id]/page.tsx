import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { IngredientPriceHistoryTable } from "@/components/ingredients/ingredient-price-history";
import { getIngredient, getIngredientPriceHistory } from "@/actions/ingredient-actions";

export const metadata: Metadata = { title: "식재료 수정" };

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, historyResult] = await Promise.all([getIngredient(id), getIngredientPriceHistory(id)]);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <PageHeader title={result.data.name} description="식재료 정보를 수정합니다." />
        <IngredientForm ingredient={result.data} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">가격 변동 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <IngredientPriceHistoryTable history={historyResult.success ? historyResult.data : []} />
        </CardContent>
      </Card>
    </div>
  );
}
