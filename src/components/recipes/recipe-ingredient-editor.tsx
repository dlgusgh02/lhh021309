"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnitSelect } from "@/components/common/unit-select";
import { calculateUsageCostFromPurchase, IncompatibleUnitError } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import { addRecipeIngredient, removeRecipeIngredient } from "@/actions/recipe-actions";
import type { Ingredient, RecipeIngredient } from "@/types";

interface RecipeIngredientEditorProps {
  recipeId: string;
  recipeIngredients: RecipeIngredient[];
  availableIngredients: Ingredient[];
}

export function RecipeIngredientEditor({
  recipeId,
  recipeIngredients,
  availableIngredients,
}: RecipeIngredientEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("g");

  const selectedIngredient = availableIngredients.find((i) => i.id === ingredientId);

  function lineCost(ri: RecipeIngredient) {
    if (!ri.ingredient) return { cost: 0, error: "식재료 정보 없음" };
    try {
      const cost = calculateUsageCostFromPurchase(
        {
          purchasePrice: ri.ingredient.purchasePrice,
          purchaseQuantity: ri.ingredient.purchaseQuantity,
          purchaseUnit: ri.ingredient.purchaseUnit,
          yieldRate: ri.ingredient.yieldRate,
        },
        ri.quantity,
        ri.unit,
      );
      return { cost, error: null as string | null };
    } catch (err) {
      return { cost: 0, error: err instanceof IncompatibleUnitError ? err.message : "계산 오류" };
    }
  }

  function handleAdd() {
    if (!ingredientId || !quantity) {
      toast.error("식재료와 사용량을 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ingredientId", ingredientId);
      formData.set("quantity", String(quantity));
      formData.set("unit", unit);

      const result = await addRecipeIngredient(recipeId, formData);
      if (result.success) {
        setIngredientId("");
        setQuantity("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(recipeIngredientId: string) {
    startTransition(async () => {
      const result = await removeRecipeIngredient(recipeId, recipeIngredientId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>재료</TableHead>
              <TableHead className="text-right">사용량</TableHead>
              <TableHead className="text-right">단위 원가</TableHead>
              <TableHead className="text-right">사용 원가</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipeIngredients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  아직 추가된 재료가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {recipeIngredients.map((ri) => {
              const { cost, error } = lineCost(ri);
              return (
                <TableRow key={ri.id}>
                  <TableCell className="font-medium">{ri.ingredient?.name ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {ri.quantity} {ri.unit}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {ri.ingredient
                      ? `${formatKRW(ri.ingredient.purchasePrice / ri.ingredient.purchaseQuantity)}/${ri.ingredient.purchaseUnit}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {error ? <span className="text-destructive text-xs">{error}</span> : formatKRW(cost)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleRemove(ri.id)}
                      aria-label="재료 삭제"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {availableIngredients.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>등록된 식재료가 없습니다. 먼저 식재료를 등록해야 레시피에 추가할 수 있습니다.</p>
          <Button variant="outline" size="sm" render={<Link href="/ingredients/new" />} nativeButton={false}>
            식재료 등록하러 가기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">식재료</label>
            <Select value={ingredientId} onValueChange={(v) => setIngredientId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="식재료 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableIngredients.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id}>
                    {ing.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 sm:w-28">
            <label className="text-xs text-muted-foreground">사용량</label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.valueAsNumber || "")}
            />
          </div>
          <div className="w-full space-y-1 sm:w-28">
            <label className="text-xs text-muted-foreground">단위</label>
            <UnitSelect value={unit} onChange={setUnit} />
          </div>
          <Button type="button" onClick={handleAdd} disabled={isPending} className="sm:mb-0">
            <Plus className="size-4" />
            추가
          </Button>
        </div>
      )}

      {selectedIngredient && (
        <p className="text-xs text-muted-foreground">
          {selectedIngredient.name} 구매 단위: {selectedIngredient.purchaseQuantity}
          {selectedIngredient.purchaseUnit} / {formatKRW(selectedIngredient.purchasePrice)}
        </p>
      )}
    </div>
  );
}
