import Link from "next/link";
import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCalculator } from "@/components/calculator/quick-calculator";

export const metadata: Metadata = {
  title: "빠른 원가 계산기",
  description: "회원가입 없이 식재료 가격과 사용량만으로 메뉴 원가와 추천 판매가격을 바로 계산해보세요.",
};

export default function CalculatorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ChefHat className="size-5 text-primary" />
          FoodCost Lab
        </Link>
        <Button size="sm" render={<Link href="/signup" />} nativeButton={false}>
          회원가입하고 저장하기
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">음식 원가 계산기</h1>
          <p className="text-sm text-muted-foreground mt-1">
            식재료, 구매가격, 구매용량, 사용량만 입력하면 원가와 추천 판매가격을 바로 계산합니다.
          </p>
        </div>
        <QuickCalculator />
      </main>
    </div>
  );
}
