import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { IngredientForm } from "@/components/ingredients/ingredient-form";

export const metadata: Metadata = { title: "식재료 추가" };

export default function NewIngredientPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="식재료 추가" description="구매 가격과 구매량을 입력하면 단위 원가가 자동으로 계산됩니다." />
      <IngredientForm />
    </div>
  );
}
