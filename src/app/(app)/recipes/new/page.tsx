import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata: Metadata = { title: "레시피 만들기" };

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="레시피 만들기" description="기본 정보를 입력한 뒤 재료를 추가할 수 있습니다." />
      <RecipeForm />
    </div>
  );
}
