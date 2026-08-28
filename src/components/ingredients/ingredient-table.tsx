"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search, ShoppingBasket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { DeleteIngredientButton } from "@/components/ingredients/delete-ingredient-button";
import { calculateEffectiveUnitCost } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import { INGREDIENT_CATEGORIES } from "@/types";
import type { Ingredient } from "@/types";

function categoryLabel(value: string) {
  return INGREDIENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function IngredientTable({ ingredients }: { ingredients: Ingredient[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesQuery = ing.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = category === "all" || ing.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [ingredients, query, category]);

  if (ingredients.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBasket}
        title="아직 등록된 식재료가 없습니다."
        description="첫 식재료를 등록하고 단위 원가 자동 계산을 확인해보세요."
        action={
          <Button render={<Link href="/ingredients/new" />} nativeButton={false}>
            식재료 추가
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="식재료명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {INGREDIENT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>식재료명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="text-right">구매가격</TableHead>
              <TableHead className="text-right">구매량</TableHead>
              <TableHead className="text-right">단위 원가</TableHead>
              <TableHead className="text-right">수율</TableHead>
              <TableHead className="w-28 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ing) => {
              let unitCost = 0;
              try {
                unitCost = calculateEffectiveUnitCost(ing.purchasePrice, ing.purchaseQuantity, ing.yieldRate);
              } catch {
                unitCost = 0;
              }
              return (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">
                    <Link href={`/ingredients/${ing.id}`} className="hover:underline">
                      {ing.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{categoryLabel(ing.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatKRW(ing.purchasePrice)}</TableCell>
                  <TableCell className="text-right">
                    {ing.purchaseQuantity} {ing.purchaseUnit}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatKRW(unitCost)} / {ing.purchaseUnit}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{ing.yieldRate}%</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={`/ingredients/${ing.id}`} />}
                        nativeButton={false}
                        aria-label={`${ing.name} 수정`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteIngredientButton id={ing.id} name={ing.name} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}
