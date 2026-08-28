import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfitabilityBadge } from "@/components/recipes/profitability-badge";
import { formatKRW } from "@/lib/utils/currency";
import { formatPercentage } from "@/lib/utils/percentage";
import type { RecipeCostResult } from "@/lib/calculations";

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? "font-semibold text-primary" : "font-medium"}>{value}</span>
    </div>
  );
}

export function RecipeCostSummary({ result }: { result: RecipeCostResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">원가 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Row label="총 레시피 원가" value={formatKRW(result.ingredientCostTotal)} />
        <Row label="1인분 원가" value={formatKRW(result.costPerServing)} />
        <Row label="추가 비용" value={formatKRW(result.extraCostTotal)} />
        <Row label="최종 원가" value={formatKRW(result.finalCostPerServing)} emphasis />

        <div className="my-2 h-px bg-border" />

        <Row label="현재 판매가" value={formatKRW(result.sellingPrice)} />
        <Row label="예상 이익" value={formatKRW(result.grossProfit)} />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">원가율</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatPercentage(result.foodCostPercentage)}</span>
            <ProfitabilityBadge foodCostPercentage={result.foodCostPercentage} />
          </div>
        </div>
        <Row label="매출총이익률" value={formatPercentage(result.grossMarginPercentage)} />
        <Row label="마크업률" value={formatPercentage(result.markupPercentage)} />
      </CardContent>
    </Card>
  );
}
