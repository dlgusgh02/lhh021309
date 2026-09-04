"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChefHat, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { ProfitabilityBadge } from "@/components/recipes/profitability-badge";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/utils/currency";
import { formatPercentage } from "@/lib/utils/percentage";
import { RECIPE_CATEGORIES } from "@/types";
import type { Recipe } from "@/types";
import type { RecipeCostResult } from "@/lib/calculations";

export interface RecipeTableRow {
  recipe: Recipe;
  result: RecipeCostResult | null;
}

function categoryLabel(value: string) {
  return RECIPE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function RecipeTable({ rows }: { rows: RecipeTableRow[] }) {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    const matched = rows
      .filter((r) => r.recipe.name.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((r) => !favoritesOnly || r.recipe.isFavorite);
    // Stable sort: favorites first, otherwise keep the incoming (updated_at desc) order.
    return [...matched].sort((a, b) => Number(b.recipe.isFavorite) - Number(a.recipe.isFavorite));
  }, [rows, query, favoritesOnly]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ChefHat}
        title="아직 등록된 레시피가 없습니다."
        description="첫 레시피를 만들고 원가와 추천 판매가격을 확인해보세요."
        action={
          <Button render={<Link href="/recipes/new" />} nativeButton={false}>
            레시피 만들기
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="레시피명 검색" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((v) => !v)}
          className={cn(favoritesOnly && "border-amber-400 text-amber-600")}
        >
          <Star className={cn("size-4", favoritesOnly && "fill-amber-400 text-amber-400")} />
          즐겨찾기만
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>메뉴명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="text-right">최종 원가</TableHead>
              <TableHead className="text-right">판매가</TableHead>
              <TableHead className="text-right">원가율</TableHead>
              <TableHead className="text-right">매출총이익률</TableHead>
              <TableHead className="text-right">수익성</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ recipe, result }) => (
              <TableRow key={recipe.id}>
                <TableCell>
                  <FavoriteButton id={recipe.id} name={recipe.name} isFavorite={recipe.isFavorite} />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/recipes/${recipe.id}`} className="hover:underline">
                    {recipe.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{categoryLabel(recipe.category)}</Badge>
                </TableCell>
                <TableCell className="text-right">{result ? formatKRW(result.finalCostPerServing) : "-"}</TableCell>
                <TableCell className="text-right">{formatKRW(recipe.sellingPrice)}</TableCell>
                <TableCell className="text-right">
                  {result && recipe.sellingPrice > 0 ? formatPercentage(result.foodCostPercentage) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {result && recipe.sellingPrice > 0 ? formatPercentage(result.grossMarginPercentage) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {result && recipe.sellingPrice > 0 ? (
                    <ProfitabilityBadge foodCostPercentage={result.foodCostPercentage} />
                  ) : (
                    <span className="text-xs text-muted-foreground">판매가 미설정</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}
