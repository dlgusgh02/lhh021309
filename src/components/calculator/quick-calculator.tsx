"use client";

import { useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitSelect } from "@/components/common/unit-select";
import { CurrencyInput } from "@/components/common/currency-input";
import {
  calculateFinalCost,
  calculateUsageCostFromPurchase,
  getPricingRecommendation,
  IncompatibleUnitError,
} from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import { formatPercentage } from "@/lib/utils/percentage";
import { ProfitabilityBadge } from "@/components/recipes/profitability-badge";

interface QuickLine {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: string;
  usageQuantity: number;
  usageUnit: string;
}

function createLine(id: string): QuickLine {
  return {
    id,
    name: "",
    purchasePrice: 0,
    purchaseQuantity: 1,
    purchaseUnit: "kg",
    usageQuantity: 0,
    usageUnit: "g",
  };
}

export function QuickCalculator() {
  const idPrefix = useId();
  const [lines, setLines] = useState<QuickLine[]>([createLine(`${idPrefix}-0`)]);
  const [servings, setServings] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);

  function addLine() {
    setLines((prev) => [...prev, createLine(`${idPrefix}-${prev.length}-${Date.now()}`)]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  function updateLine(id: string, patch: Partial<QuickLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const results = useMemo(() => {
    const lineCosts = lines.map((line) => {
      if (!line.purchasePrice || !line.purchaseQuantity || !line.usageQuantity) {
        return { id: line.id, cost: 0, error: null as string | null };
      }
      try {
        const cost = calculateUsageCostFromPurchase(
          {
            purchasePrice: line.purchasePrice,
            purchaseQuantity: line.purchaseQuantity,
            purchaseUnit: line.purchaseUnit,
          },
          line.usageQuantity,
          line.usageUnit,
        );
        return { id: line.id, cost, error: null as string | null };
      } catch (err) {
        return {
          id: line.id,
          cost: 0,
          error: err instanceof IncompatibleUnitError ? err.message : "계산할 수 없는 입력입니다.",
        };
      }
    });

    const totalCost = lineCosts.reduce((sum, line) => sum + line.cost, 0);
    const costPerServing = servings > 0 ? totalCost / servings : 0;
    const finalCost = calculateFinalCost(costPerServing, 0);
    const recommendation = finalCost > 0 ? getPricingRecommendation(finalCost) : null;

    return { lineCosts, totalCost, costPerServing, finalCost, recommendation };
  }, [lines, servings]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">재료 사용량</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.map((line, index) => {
              const lineResult = results.lineCosts.find((r) => r.id === line.id);
              return (
                <div key={line.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">재료 {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <Input
                    placeholder="재료명 (예: 돼지고기)"
                    value={line.name}
                    onChange={(e) => updateLine(line.id, { name: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">구매가격</Label>
                      <CurrencyInput
                        value={line.purchasePrice || ""}
                        onChange={(e) => updateLine(line.id, { purchasePrice: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">구매량</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={line.purchaseQuantity || ""}
                          onChange={(e) => updateLine(line.id, { purchaseQuantity: Number(e.target.value) })}
                        />
                        <div className="w-24 shrink-0">
                          <UnitSelect
                            value={line.purchaseUnit}
                            onChange={(v) => updateLine(line.id, { purchaseUnit: v })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">레시피 사용량</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={line.usageQuantity || ""}
                        onChange={(e) => updateLine(line.id, { usageQuantity: Number(e.target.value) })}
                      />
                      <div className="w-24 shrink-0">
                        <UnitSelect value={line.usageUnit} onChange={(v) => updateLine(line.id, { usageUnit: v })} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">사용 원가</span>
                    <span className="font-medium">
                      {lineResult?.error ? (
                        <span className="text-destructive text-xs">{lineResult.error}</span>
                      ) : (
                        formatKRW(lineResult?.cost ?? 0)
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            <Button type="button" variant="outline" className="w-full" onClick={addLine}>
              <Plus className="size-4" />
              재료 추가
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">인분 & 판매가</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">생산 인분</Label>
              <Input
                type="number"
                min={1}
                value={servings || ""}
                onChange={(e) => setServings(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">판매가격 (선택)</Label>
              <CurrencyInput value={sellingPrice || ""} onChange={(e) => setSellingPrice(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-base">계산 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">총 재료 원가</span>
              <span className="font-medium">{formatKRW(results.totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">1인분 원가</span>
              <span className="font-semibold text-primary">{formatKRW(results.costPerServing)}</span>
            </div>

            {sellingPrice > 0 && (
              <>
                <div className="my-2 h-px bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예상 이익</span>
                  <span className="font-medium">{formatKRW(sellingPrice - results.costPerServing)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">원가율</span>
                  <ProfitabilityBadge
                    foodCostPercentage={(results.costPerServing / sellingPrice) * 100}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">원가율 / 매출총이익률</span>
                  <span>
                    {formatPercentage((results.costPerServing / sellingPrice) * 100)} /{" "}
                    {formatPercentage(((sellingPrice - results.costPerServing) / sellingPrice) * 100)}
                  </span>
                </div>
              </>
            )}

            {results.recommendation && (
              <>
                <div className="my-2 h-px bg-border" />
                <p className="font-medium">추천 판매가격</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">목표 원가율 25%</span>
                  <span>{formatKRW(results.recommendation.targetFoodCost25)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">목표 원가율 30%</span>
                  <span>{formatKRW(results.recommendation.targetFoodCost30)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">목표 원가율 35%</span>
                  <span>{formatKRW(results.recommendation.targetFoodCost35)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
