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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { CurrencyInput } from "@/components/common/currency-input";
import { recipeFormSchema, type RecipeFormInput, type RecipeFormValues } from "@/lib/validations/recipe";
import { RECIPE_CATEGORIES } from "@/types";
import { createRecipe, updateRecipe } from "@/actions/recipe-actions";
import type { Recipe } from "@/types";

export function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        if (result.success) {
          toast.success("레시피를 생성했습니다.");
          router.push(`/recipes/${result.data.id}`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
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
