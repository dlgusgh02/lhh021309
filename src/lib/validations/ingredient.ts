import * as z from "zod";

export const ingredientFormSchema = z.object({
  name: z.string().trim().min(1, "식재료명을 입력해주세요.").max(100),
  category: z.string().min(1, "카테고리를 선택해주세요."),
  purchasePrice: z.coerce
    .number({ error: "구매 가격을 숫자로 입력해주세요." })
    .min(0, "구매 가격은 0 이상이어야 합니다."),
  purchaseQuantity: z.coerce
    .number({ error: "구매량을 숫자로 입력해주세요." })
    .gt(0, "구매량은 0보다 커야 합니다."),
  purchaseUnit: z.string().min(1, "단위를 선택해주세요."),
  yieldRate: z.coerce
    .number({ error: "손실률(수율)을 숫자로 입력해주세요." })
    .gt(0, "수율은 0%보다 커야 합니다.")
    .max(100, "수율은 100%를 초과할 수 없습니다.")
    .default(100),
  supplier: z.string().trim().max(100).optional().or(z.literal("")),
  memo: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Post-parse shape (all numeric fields coerced) — what Server Actions and form submit handlers receive. */
export type IngredientFormValues = z.output<typeof ingredientFormSchema>;
/** Pre-parse shape (numeric fields may still be `unknown`, matching raw form state) — what `useForm` is typed with. */
export type IngredientFormInput = z.input<typeof ingredientFormSchema>;
