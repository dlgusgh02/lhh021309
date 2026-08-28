import * as z from "zod";

export const recipeFormSchema = z.object({
  name: z.string().trim().min(1, "레시피 이름을 입력해주세요.").max(100),
  category: z.string().min(1, "메뉴 카테고리를 선택해주세요."),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  servings: z.coerce
    .number({ error: "인분 수를 숫자로 입력해주세요." })
    .gt(0, "인분 수를 입력해주세요."),
  sellingPrice: z.coerce
    .number({ error: "판매가격을 숫자로 입력해주세요." })
    .min(0, "판매가격은 0 이상이어야 합니다.")
    .default(0),
});

export type RecipeFormValues = z.output<typeof recipeFormSchema>;
export type RecipeFormInput = z.input<typeof recipeFormSchema>;

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1, "식재료를 선택해주세요."),
  quantity: z.coerce.number({ error: "사용량을 숫자로 입력해주세요." }).gt(0, "사용량은 0보다 커야 합니다."),
  unit: z.string().min(1, "단위를 선택해주세요."),
});

export type RecipeIngredientValues = z.infer<typeof recipeIngredientSchema>;

export const extraCostSchema = z.object({
  name: z.string().trim().min(1, "항목명을 입력해주세요.").max(100),
  amount: z.coerce.number({ error: "금액을 숫자로 입력해주세요." }).min(0, "금액은 0 이상이어야 합니다."),
  costType: z.string().min(1).default("etc"),
});

export type ExtraCostValues = z.infer<typeof extraCostSchema>;

export const sellingPriceSchema = z.object({
  sellingPrice: z.coerce
    .number({ error: "판매가격을 숫자로 입력해주세요." })
    .min(0, "판매가격은 0 이상이어야 합니다."),
});
