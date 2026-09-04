import Link from "next/link";
import type { Metadata } from "next";
import { ChefHat, Percent, ShoppingBasket, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/common/metric-card";
import { EmptyState } from "@/components/common/empty-state";
import { ProfitabilityBadge } from "@/components/recipes/profitability-badge";
import { getDashboardData } from "@/actions/dashboard-actions";
import { formatKRW } from "@/lib/utils/currency";
import { formatPercentage } from "@/lib/utils/percentage";

export const metadata: Metadata = { title: "대시보드" };

export default async function DashboardPage() {
  const result = await getDashboardData();

  if (!result.success) {
    return (
      <div>
        <PageHeader title="대시보드" />
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    );
  }

  const data = result.data;

  if (data.ingredientCount === 0) {
    return (
      <div>
        <PageHeader title="대시보드" description="매장 현황을 한눈에 확인하세요." />
        <EmptyState
          icon={ShoppingBasket}
          title="식재료 등록부터 시작해보세요"
          description="구매 가격과 수량을 등록하면, 레시피를 만들 때 재료별 원가가 자동으로 계산됩니다."
          action={
            <Button render={<Link href="/ingredients/new" />} nativeButton={false}>
              첫 식재료 등록하기
            </Button>
          }
        />
      </div>
    );
  }

  if (data.recipeCount === 0) {
    return (
      <div>
        <PageHeader title="대시보드" description="매장 현황을 한눈에 확인하세요." />
        <EmptyState
          icon={ChefHat}
          title="이제 레시피를 만들어보세요"
          description="등록한 식재료를 조합해 레시피를 만들면 1인분 원가, 원가율, 추천 판매가를 바로 확인할 수 있습니다."
          action={
            <Button render={<Link href="/recipes/new" />} nativeButton={false}>
              첫 레시피 만들기
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="대시보드" description="매장 현황을 한눈에 확인하세요." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="등록 식재료" value={`${data.ingredientCount}`} icon={ShoppingBasket} />
        <MetricCard label="등록 레시피" value={`${data.recipeCount}`} icon={ChefHat} />
        <MetricCard
          label="평균 원가율"
          value={data.recipeCount > 0 ? formatPercentage(data.averageFoodCostPercentage) : "-"}
          icon={Percent}
        />
        <MetricCard
          label="평균 매출총이익률"
          value={data.recipeCount > 0 ? formatPercentage(data.averageGrossMarginPercentage) : "-"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">수익성 TOP 메뉴</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProfitableRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">판매가가 설정된 레시피가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {data.topProfitableRecipes.map((item, index) => (
                  <li key={item.recipe.id} className="flex items-center justify-between text-sm">
                    <Link href={`/recipes/${item.recipe.id}`} className="hover:underline">
                      {index + 1}. {item.recipe.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatPercentage(item.foodCostPercentage)}</span>
                      <ProfitabilityBadge foodCostPercentage={item.foodCostPercentage} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">원가율 위험 메뉴</CardTitle>
          </CardHeader>
          <CardContent>
            {data.highRiskRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">판매가가 설정된 레시피가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {data.highRiskRecipes.map((item, index) => (
                  <li key={item.recipe.id} className="flex items-center justify-between text-sm">
                    <Link href={`/recipes/${item.recipe.id}`} className="hover:underline">
                      {index + 1}. {item.recipe.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatPercentage(item.foodCostPercentage)}</span>
                      <ProfitabilityBadge foodCostPercentage={item.foodCostPercentage} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 등록한 식재료</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentIngredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 식재료가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentIngredients.map((ing) => (
                  <li key={ing.id} className="flex items-center justify-between text-sm">
                    <Link href={`/ingredients/${ing.id}`} className="hover:underline">
                      {ing.name}
                    </Link>
                    <span className="text-muted-foreground">{formatKRW(ing.purchasePrice)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 등록한 레시피</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 레시피가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentRecipes.map((recipe) => (
                  <li key={recipe.id} className="flex items-center justify-between text-sm">
                    <Link href={`/recipes/${recipe.id}`} className="hover:underline">
                      {recipe.name}
                    </Link>
                    <span className="text-muted-foreground">{formatKRW(recipe.sellingPrice)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
