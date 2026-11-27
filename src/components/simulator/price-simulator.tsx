"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProfitabilityBadge } from "@/components/recipes/profitability-badge";
import { analyzeProfitability, calculatePriceByDesiredProfit, getPricingRecommendation, roundPrice } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import { formatPercentage } from "@/lib/utils/percentage";

const STEP = 1000;
const POINTS = 6;

export interface SimulatorRecipeOption {
  id: string;
  name: string;
  cost: number;
  sellingPrice: number;
}

const PRICE_SHIFT_STEP = 5;
const PRICE_SHIFT_MIN = -30;
const PRICE_SHIFT_MAX = 50;

export function PriceSimulator({
  recipes = [],
  storeAverageFoodCostPercentage = null,
}: {
  recipes?: SimulatorRecipeOption[];
  storeAverageFoodCostPercentage?: number | null;
}) {
  const [cost, setCost] = useState(3000);
  const [basePrice, setBasePrice] = useState(10000);
  const [desiredProfit, setDesiredProfit] = useState(5000);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [priceShiftPercent, setPriceShiftPercent] = useState(0);
  const [comparedRecipeIds, setComparedRecipeIds] = useState<string[]>([]);

  function handleSelectRecipe(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    setSelectedRecipeId(recipeId);
    setCost(Math.round(recipe.cost));
    setBasePrice(
      recipe.sellingPrice > 0
        ? recipe.sellingPrice
        : roundPrice(getPricingRecommendation(recipe.cost).targetFoodCost30, "charm900"),
    );
  }

  const priceForDesiredProfit =
    cost >= 0 && desiredProfit >= 0 ? calculatePriceByDesiredProfit(cost, desiredProfit) : null;

  // "추천" is target food-cost 30% (the common F&B rule-of-thumb midpoint
  // between the 25%/35% brackets already shown below) with charm-price
  // rounding — not an AI call, just the existing pricing formulas picking
  // one headline number instead of a flat list of six.
  const recommendation = cost > 0 ? getPricingRecommendation(cost) : null;
  const recommendedPrice = recommendation ? roundPrice(recommendation.targetFoodCost30, "charm900") : null;

  const rows = useMemo(() => {
    if (cost <= 0 || basePrice <= 0) return [];
    const start = Math.max(STEP, basePrice - Math.floor(POINTS / 2) * STEP);
    return Array.from({ length: POINTS }, (_, i) => {
      const price = start + i * STEP;
      const analysis = analyzeProfitability(cost, price);
      return { price, ...analysis };
    });
  }, [cost, basePrice]);

  // What happens to this recipe's margin if ingredient prices move — the
  // current base price stays fixed while cost scales with the slider, so a
  // positive shift shows how much headroom there is before repricing.
  const adjustedCost = Math.round(cost * (1 + priceShiftPercent / 100));
  const shiftAnalysis = cost > 0 && basePrice > 0 ? analyzeProfitability(adjustedCost, basePrice) : null;

  const currentAnalysis = cost > 0 && basePrice > 0 ? analyzeProfitability(cost, basePrice) : null;
  const averageComparison =
    currentAnalysis && storeAverageFoodCostPercentage !== null
      ? { storeAverage: storeAverageFoodCostPercentage, gapPoints: currentAnalysis.foodCostPercentage - storeAverageFoodCostPercentage }
      : null;

  const comparedRecipes = recipes
    .filter((r) => comparedRecipeIds.includes(r.id))
    .map((r) => ({ recipe: r, analysis: r.sellingPrice > 0 ? analyzeProfitability(r.cost, r.sellingPrice) : null }))
    .sort((a, b) => (b.analysis?.foodCostPercentage ?? -1) - (a.analysis?.foodCostPercentage ?? -1));

  function toggleComparedRecipe(recipeId: string) {
    setComparedRecipeIds((ids) => (ids.includes(recipeId) ? ids.filter((id) => id !== recipeId) : [...ids, recipeId]));
  }

  return (
    <div className="space-y-6">
      {recipes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">레시피에서 불러오기</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRecipeId} onValueChange={(v) => handleSelectRecipe(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="레시피 선택하면 원가·판매가가 자동으로 채워져요" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name} ({formatKRW(recipe.cost)}/인분)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">기준값</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>기준 원가</Label>
            <Input type="number" min={0} value={cost || ""} onChange={(e) => setCost(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>기준 판매가</Label>
            <Input
              type="number"
              min={0}
              value={basePrice || ""}
              onChange={(e) => setBasePrice(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {averageComparison && (
        <Card>
          <CardContent className="flex items-center justify-between py-4 text-sm">
            <span className="text-muted-foreground">매장 평균 원가율 대비</span>
            <span
              className={`font-semibold ${averageComparison.gapPoints > 0 ? "text-destructive" : averageComparison.gapPoints < 0 ? "text-primary" : ""}`}
            >
              {averageComparison.gapPoints > 0
                ? `+${averageComparison.gapPoints.toFixed(1)}%p 높음`
                : averageComparison.gapPoints < 0
                  ? `${averageComparison.gapPoints.toFixed(1)}%p 낮음`
                  : "평균과 동일"}
              {" "}(매장 평균 {formatPercentage(averageComparison.storeAverage)})
            </span>
          </CardContent>
        </Card>
      )}

      {shiftAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">재료비 변동 시뮬레이션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>재료비 변동률</Label>
              <span className={`font-semibold ${priceShiftPercent > 0 ? "text-destructive" : priceShiftPercent < 0 ? "text-primary" : ""}`}>
                {priceShiftPercent > 0 ? "+" : ""}
                {priceShiftPercent}%
              </span>
            </div>
            <input
              type="range"
              min={PRICE_SHIFT_MIN}
              max={PRICE_SHIFT_MAX}
              step={PRICE_SHIFT_STEP}
              value={priceShiftPercent}
              onChange={(e) => setPriceShiftPercent(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              주요 재료 가격이 {priceShiftPercent > 0 ? `${priceShiftPercent}% 오르면` : priceShiftPercent < 0 ? `${Math.abs(priceShiftPercent)}% 내리면` : "변하지 않으면"}, 현재 판매가({formatKRW(basePrice)}) 기준으로 원가가 {formatKRW(adjustedCost)}가 됩니다.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="flex justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">원가율</span>
                <span className="font-medium">{formatPercentage(shiftAnalysis.foodCostPercentage)}</span>
              </div>
              <div className="flex justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">매출총이익률</span>
                <span className="font-medium">{formatPercentage(shiftAnalysis.grossMarginPercentage)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">수익성</span>
                <ProfitabilityBadge foodCostPercentage={shiftAnalysis.foodCostPercentage} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendedPrice !== null && recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">추천 판매가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground">원가율 30% 기준 + 매력적인 가격(…900원) 보정</span>
              <span className="text-xl font-bold text-primary">{formatKRW(recommendedPrice)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="flex justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">원가율 25%</span>
                <span className="font-medium">{formatKRW(roundPrice(recommendation.targetFoodCost25, "charm900"))}</span>
              </div>
              <div className="flex justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">원가율 35%</span>
                <span className="font-medium">{formatKRW(roundPrice(recommendation.targetFoodCost35, "charm900"))}</span>
              </div>
              <div className="flex justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">매출총이익률 60%</span>
                <span className="font-medium">{formatKRW(roundPrice(recommendation.targetMargin60, "charm900"))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">목표 이익 금액으로 판매가 계산</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <div className="space-y-1">
            <Label>원하는 이익 금액</Label>
            <Input
              type="number"
              min={0}
              value={desiredProfit || ""}
              onChange={(e) => setDesiredProfit(Number(e.target.value))}
            />
          </div>
          <div className="rounded-md bg-muted px-4 py-2 text-sm">
            필요 판매가:{" "}
            <span className="font-semibold text-primary">
              {priceForDesiredProfit !== null ? formatKRW(priceForDesiredProfit) : "-"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">판매가별 시뮬레이션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">판매가</TableHead>
                  <TableHead className="text-right">원가</TableHead>
                  <TableHead className="text-right">이익</TableHead>
                  <TableHead className="text-right">원가율</TableHead>
                  <TableHead className="text-right">매출총이익률</TableHead>
                  <TableHead className="text-right">수익성</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.price} className={row.price === basePrice ? "bg-primary/5" : undefined}>
                    <TableCell className="text-right font-medium">{formatKRW(row.price)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatKRW(cost)}</TableCell>
                    <TableCell className="text-right">{formatKRW(row.grossProfit)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(row.foodCostPercentage)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(row.grossMarginPercentage)}</TableCell>
                    <TableCell className="text-right">
                      <ProfitabilityBadge foodCostPercentage={row.foodCostPercentage} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {recipes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">레시피 비교</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
              {recipes.map((recipe) => (
                <label key={recipe.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={comparedRecipeIds.includes(recipe.id)}
                    onChange={() => toggleComparedRecipe(recipe.id)}
                  />
                  {recipe.name}
                </label>
              ))}
            </div>

            {comparedRecipes.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>레시피</TableHead>
                      <TableHead className="text-right">원가</TableHead>
                      <TableHead className="text-right">판매가</TableHead>
                      <TableHead className="text-right">원가율</TableHead>
                      <TableHead className="text-right">매출총이익률</TableHead>
                      <TableHead className="text-right">수익성</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparedRecipes.map(({ recipe, analysis }) => (
                      <TableRow key={recipe.id}>
                        <TableCell className="font-medium">{recipe.name}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatKRW(recipe.cost)}</TableCell>
                        <TableCell className="text-right">
                          {recipe.sellingPrice > 0 ? formatKRW(recipe.sellingPrice) : "미설정"}
                        </TableCell>
                        <TableCell className="text-right">
                          {analysis ? formatPercentage(analysis.foodCostPercentage) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {analysis ? formatPercentage(analysis.grossMarginPercentage) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {analysis ? <ProfitabilityBadge foodCostPercentage={analysis.foodCostPercentage} /> : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
