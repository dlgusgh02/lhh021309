"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurrencyInput } from "@/components/common/currency-input";
import { UnitSelect } from "@/components/common/unit-select";
import { IngredientCombobox } from "@/components/ingredients/ingredient-combobox";
import { recipeFormSchema, type RecipeFormInput, type RecipeFormValues } from "@/lib/validations/recipe";
import { RECIPE_CATEGORIES } from "@/types";
import { createRecipe, updateRecipe, addRecipeIngredient } from "@/actions/recipe-actions";
import { calculateUsageCostFromPurchase, IncompatibleUnitError } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import type { Ingredient, Recipe } from "@/types";

interface DraftLine {
  key: string;
  ingredientId: string;
  quantity: number;
  unit: string;
}

export function RecipeForm({ recipe, availableIngredients = [] }: { recipe?: Recipe; availableIngredients?: Ingredient[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [draftIngredientId, setDraftIngredientId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState<number | "">("");
  const [draftUnit, setDraftUnit] = useState("g");

  const form = useForm<RecipeFormInput, unknown, RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: recipe?.name ?? "",
      category: recipe?.category ?? "etc",
      description: recipe?.description ?? "",
      servings: recipe?.servings ?? 1,
      sellingPrice: recipe?.sellingPrice ?? 0,
    },
  });

  function lineCost(line: DraftLine): { cost: number; error: string | null } {
    const ingredient = availableIngredients.find((i) => i.id === line.ingredientId);
    if (!ingredient) return { cost: 0, error: "식재료 정보 없음" };
    try {
      const cost = calculateUsageCostFromPurchase(
        {
          purchasePrice: ingredient.purchasePrice,
          purchaseQuantity: ingredient.purchaseQuantity,
          purchaseUnit: ingredient.purchaseUnit,
          yieldRate: ingredient.yieldRate,
        },
        line.quantity,
        line.unit,
      );
      return { cost, error: null };
    } catch (err) {
      return { cost: 0, error: err instanceof IncompatibleUnitError ? err.message : "계산 오류" };
    }
  }

  const draftCostTotal = draftLines.reduce((sum, line) => sum + lineCost(line).cost, 0);

  function handleAddDraftLine() {
    if (!draftIngredientId || !draftQuantity) {
      toast.error("식재료와 사용량을 입력해주세요.");
      return;
    }
    setDraftLines((lines) => [
      ...lines,
      { key: `${draftIngredientId}-${Date.now()}`, ingredientId: draftIngredientId, quantity: draftQuantity, unit: draftUnit },
    ]);
    setDraftIngredientId("");
    setDraftQuantity("");
  }

  function handleRemoveDraftLine(key: string) {
    setDraftLines((lines) => lines.filter((line) => line.key !== key));
  }

  function onSubmit(values: RecipeFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));

      if (recipe) {
        const result = await updateRecipe(recipe.id, formData);
        if (result.success) {
          toast.success("레시피를 수정했습니다.");
          router.push(`/recipes/${recipe.id}`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createRecipe(formData);
        if (!result.success) {
          toast.error(result.error);
          return;
        }

        const newRecipeId = result.data.id;
        const failedIngredients: string[] = [];
        for (const line of draftLines) {
          const lineFormData = new FormData();
          lineFormData.set("ingredientId", line.ingredientId);
          lineFormData.set("quantity", String(line.quantity));
          lineFormData.set("unit", line.unit);
          const lineResult = await addRecipeIngredient(newRecipeId, lineFormData);
          if (!lineResult.success) {
            const name = availableIngredients.find((i) => i.id === line.ingredientId)?.name ?? "재료";
            failedIngredients.push(name);
          }
        }

        if (failedIngredients.length > 0) {
          toast.warning(`레시피는 생성됐지만 일부 재료를 추가하지 못했습니다: ${failedIngredients.join(", ")}`);
        } else {
          toast.success("레시피를 생성했습니다.");
        }
        router.push(`/recipes/${newRecipeId}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>레시피 이름</FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="제육볶음" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="category"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>메뉴 카테고리</FieldLabel>
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="servings"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>생산 인분</FieldLabel>
                <Input
                  {...field}
                  value={field.value as number}
                  id={field.name}
                  type="number"
                  min={0}
                  step="any"
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="sellingPrice"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>판매가격 (선택)</FieldLabel>
                <CurrencyInput
                  {...field}
                  value={field.value as number}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>설명 (선택)</FieldLabel>
              <Textarea {...field} id={field.name} rows={3} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {!recipe && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">재료 구성 (선택)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  등록된 식재료가 없습니다. 레시피를 먼저 생성한 뒤 상세 화면에서 재료를 추가할 수 있어요.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>재료</TableHead>
                          <TableHead className="text-right">사용량</TableHead>
                          <TableHead className="text-right">사용 원가</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draftLines.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                              아직 추가된 재료가 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                        {draftLines.map((line) => {
                          const ingredient = availableIngredients.find((i) => i.id === line.ingredientId);
                          const { cost, error } = lineCost(line);
                          return (
                            <TableRow key={line.key}>
                              <TableCell className="font-medium">{ingredient?.name ?? "-"}</TableCell>
                              <TableCell className="text-right">
                                {line.quantity} {line.unit}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {error ? <span className="text-destructive text-xs">{error}</span> : formatKRW(cost)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveDraftLine(line.key)}
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

                  <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-muted-foreground">식재료</label>
                      <IngredientCombobox
                        ingredients={availableIngredients}
                        value={draftIngredientId}
                        onChange={setDraftIngredientId}
                      />
                    </div>
                    <div className="w-full space-y-1 sm:w-28">
                      <label className="text-xs text-muted-foreground">사용량</label>
                      <Input
                        type="number"
                        min={0}
                        value={draftQuantity}
                        onChange={(e) => setDraftQuantity(e.target.valueAsNumber || "")}
                      />
                    </div>
                    <div className="w-full space-y-1 sm:w-28">
                      <label className="text-xs text-muted-foreground">단위</label>
                      <UnitSelect value={draftUnit} onChange={setDraftUnit} />
                    </div>
                    <Button type="button" onClick={handleAddDraftLine} className="sm:mb-0">
                      <Plus className="size-4" />
                      추가
                    </Button>
                  </div>

                  <div className="flex justify-between border-t pt-3 text-sm">
                    <span className="font-medium">재료 원가 합계</span>
                    <span className="font-semibold text-primary">{formatKRW(draftCostTotal)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "저장 중..." : recipe ? "수정하기" : "생성하기"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
