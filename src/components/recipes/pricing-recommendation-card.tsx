import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPricingRecommendation, roundPrice } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";

export function PricingRecommendationCard({ cost }: { cost: number }) {
  if (cost <= 0) {
    return null;
  }

  const rec = getPricingRecommendation(cost);
  const rows = [
    { label: "목표 원가율 25%", value: rec.targetFoodCost25 },
    { label: "목표 원가율 30%", value: rec.targetFoodCost30 },
    { label: "목표 원가율 35%", value: rec.targetFoodCost35 },
    { label: "목표 매출총이익률 50%", value: rec.targetMargin50 },
    { label: "목표 매출총이익률 60%", value: rec.targetMargin60 },
    { label: "목표 매출총이익률 70%", value: rec.targetMargin70 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">추천 판매가격</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">
              {formatKRW(row.value)}{" "}
              <span className="text-muted-foreground">→ {formatKRW(roundPrice(row.value, "charm900"))}</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
