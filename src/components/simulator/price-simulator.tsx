"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProfitabilityBadge } from "@/components/recipes/profitability-badge";
import { analyzeProfitability, calculatePriceByDesiredProfit } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import { formatPercentage } from "@/lib/utils/percentage";

const STEP = 1000;
const POINTS = 6;

export function PriceSimulator() {
  const [cost, setCost] = useState(3000);
  const [basePrice, setBasePrice] = useState(10000);
  const [desiredProfit, setDesiredProfit] = useState(5000);

  const priceForDesiredProfit =
    cost >= 0 && desiredProfit >= 0 ? calculatePriceByDesiredProfit(cost, desiredProfit) : null;

  const rows = useMemo(() => {
    if (cost <= 0 || basePrice <= 0) return [];
    const start = Math.max(STEP, basePrice - Math.floor(POINTS / 2) * STEP);
    return Array.from({ length: POINTS }, (_, i) => {
      const price = start + i * STEP;
      const analysis = analyzeProfitability(cost, price);
      return { price, ...analysis };
    });
  }, [cost, basePrice]);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
