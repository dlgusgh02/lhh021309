"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { CurrencyInput } from "@/components/common/currency-input";
import { PercentageInput } from "@/components/common/percentage-input";
import { UnitSelect } from "@/components/common/unit-select";
import { MasterIngredientPicker } from "@/components/ingredients/master-ingredient-picker";
import {
  ingredientFormSchema,
  type IngredientFormInput,
  type IngredientFormValues,
} from "@/lib/validations/ingredient";
import { calculateEffectiveUnitCost } from "@/lib/calculations";
import { formatKRW } from "@/lib/utils/currency";
import { INGREDIENT_CATEGORIES } from "@/types";
import { createIngredient, updateIngredient } from "@/actions/ingredient-actions";
import type { Ingredient, MasterIngredient } from "@/types";

export function IngredientForm({ ingredient }: { ingredient?: Ingredient }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<IngredientFormInput, unknown, IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: ingredient?.name ?? "",
      category: ingredient?.category ?? "etc",
      purchasePrice: ingredient?.purchasePrice ?? 0,
      purchaseQuantity: ingredient?.purchaseQuantity ?? 1,
      purchaseUnit: ingredient?.purchaseUnit ?? "g",
      yieldRate: ingredient?.yieldRate ?? 100,
      supplier: ingredient?.supplier ?? "",
      memo: ingredient?.memo ?? "",
    },
  });

  const [watchedPrice, watchedQuantity, purchaseUnit, watchedYieldRate] = form.watch([
    "purchasePrice",
    "purchaseQuantity",
    "purchaseUnit",
    "yieldRate",
  ]);
  const purchasePrice = Number(watchedPrice);
  const purchaseQuantity = Number(watchedQuantity);
  const yieldRate = Number(watchedYieldRate);

  let previewUnitCost: number | null = null;
  if (purchasePrice >= 0 && purchaseQuantity > 0) {
    try {
      previewUnitCost = calculateEffectiveUnitCost(purchasePrice, purchaseQuantity, yieldRate || 100);
    } catch {
      previewUnitCost = null;
    }
  }

  function handleImportFromMaster(item: MasterIngredient) {
    form.reset({
      ...form.getValues(),
      name: item.name,
      category: item.category,
      purchaseUnit: item.referenceUnit,
      purchasePrice: item.referencePrice ?? 0,
      purchaseQuantity: 1,
    });
  }

  function onSubmit(values: IngredientFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));

      const result = ingredient
        ? await updateIngredient(ingredient.id, formData)
        : await createIngredient(formData);

      if (result.success) {
        toast.success(ingredient ? "식재료 정보를 수정했습니다." : "식재료를 등록했습니다.");
        router.push("/ingredients");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {!ingredient && (
        <div className="flex justify-end">
          <MasterIngredientPicker onSelect={handleImportFromMaster} />
        </div>
      )}
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>식재료명</FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="돼지고기" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="category"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>카테고리</FieldLabel>
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {INGREDIENT_CATEGORIES.map((c) => (
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller
            name="purchasePrice"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>구매 가격</FieldLabel>
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
          <Controller
            name="purchaseQuantity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>구매량</FieldLabel>
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
            name="purchaseUnit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>단위</FieldLabel>
                <UnitSelect value={field.value} onChange={field.onChange} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="yieldRate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:max-w-56">
              <FieldLabel htmlFor={field.name}>수율 (손질 후 실사용 비율)</FieldLabel>
              <PercentageInput
                {...field}
                value={field.value as number}
                id={field.name}
                aria-invalid={fieldState.invalid}
                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
              />
              <FieldDescription>손질 후 버려지는 부분이 없다면 100%로 두세요.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {previewUnitCost !== null && (
          <div className="rounded-md bg-muted px-4 py-3 text-sm">
            단위 원가 미리보기:{" "}
            <span className="font-semibold">
              {formatKRW(previewUnitCost)} / {purchaseUnit || "단위"}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="supplier"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>구매처 (선택)</FieldLabel>
                <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <Controller
          name="memo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>메모 (선택)</FieldLabel>
              <Textarea {...field} id={field.name} rows={3} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "저장 중..." : ingredient ? "수정하기" : "등록하기"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
