import Link from "next/link";
import { ArrowRight, Calculator, ChefHat, LineChart, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: ShoppingBasket,
    title: "식재료 원가 자동 계산",
    description: "구매 가격과 구매량만 입력하면 g/ml/개당 단위 원가를 자동으로 계산합니다.",
  },
  {
    icon: ChefHat,
    title: "레시피 원가 & 1인분 원가",
    description: "레시피에 재료를 추가하면 총 원가와 1인분 원가가 즉시 계산됩니다.",
  },
  {
    icon: Calculator,
    title: "목표 원가율 기반 추천 판매가",
    description: "목표 원가율 또는 매출총이익률을 입력하면 적정 판매가격을 추천해줍니다.",
  },
  {
    icon: LineChart,
    title: "판매가 시뮬레이터 & 대시보드",
    description: "여러 판매가를 비교하고, 메뉴별 수익성을 한눈에 확인하세요.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <ChefHat className="size-5 text-primary" />
          FoodCost Lab
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
            로그인
          </Button>
          <Button render={<Link href="/signup" />} nativeButton={false}>
            무료로 시작하기
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          음식 원가 계산,
          <br />
          더 이상 엑셀로 하지 마세요.
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
          식재료 가격만 입력하면 레시피 원가부터 1인분 원가, 적정 판매가격까지 자동으로 계산합니다.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/calculator" />} nativeButton={false}>
            무료로 원가 계산하기
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/signup" />} nativeButton={false}>
            대시보드 시작하기
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 pb-24 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="size-6 text-primary mb-2" />
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
