import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { IngredientTable } from "@/components/ingredients/ingredient-table";
import { getIngredients } from "@/actions/ingredient-actions";

export const metadata: Metadata = { title: "식재료" };

export default async function IngredientsPage() {
  const result = await getIngredients();
  const ingredients = result.success ? result.data : [];

  return (
    <div>
      <PageHeader
        title="식재료"
        description="식재료를 등록하면 단위 원가가 자동으로 계산됩니다."
        action={
          <Button render={<Link href="/ingredients/new" />} nativeButton={false}>
            <Plus className="size-4" />
            식재료 추가
          </Button>
        }
      />
      {!result.success && <p className="text-sm text-destructive mb-4">{result.error}</p>}
      <IngredientTable ingredients={ingredients} />
    </div>
  );
}
