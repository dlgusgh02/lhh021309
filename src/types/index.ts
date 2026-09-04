/** Domain-facing types used across Server Actions, components, and pages. */

export const INGREDIENT_CATEGORIES = [
  { value: "meat", label: "육류" },
  { value: "seafood", label: "해산물" },
  { value: "vegetable", label: "채소" },
  { value: "fruit", label: "과일" },
  { value: "dairy", label: "유제품" },
  { value: "sauce", label: "소스" },
  { value: "seasoning", label: "조미료" },
  { value: "beverage", label: "음료" },
  { value: "bakery", label: "베이커리" },
  { value: "packaging", label: "포장재" },
  { value: "etc", label: "기타" },
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]["value"];

export const RECIPE_CATEGORIES = [
  { value: "korean", label: "한식" },
  { value: "chinese", label: "중식" },
  { value: "japanese", label: "일식" },
  { value: "western", label: "양식" },
  { value: "snack", label: "분식" },
  { value: "cafe", label: "카페/음료" },
  { value: "dessert", label: "디저트/베이커리" },
  { value: "delivery", label: "배달 전문" },
  { value: "etc", label: "기타" },
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]["value"];

export const EXTRA_COST_TYPES = [
  { value: "packaging", label: "포장 용기" },
  { value: "utensil", label: "수저/포크" },
  { value: "napkin", label: "냅킨" },
  { value: "delivery", label: "배달 포장" },
  { value: "sauce_container", label: "소스 용기" },
  { value: "etc", label: "기타" },
] as const;

export interface Ingredient {
  id: string;
  storeId: string;
  name: string;
  category: string;
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: string;
  baseUnit: string;
  yieldRate: number;
  supplier: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientPriceHistory {
  id: string;
  ingredientId: string;
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: string;
  recordedAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient?: Ingredient;
}

export interface ExtraCost {
  id: string;
  recipeId: string;
  name: string;
  amount: number;
  costType: string;
}

export interface Recipe {
  id: string;
  storeId: string;
  name: string;
  category: string;
  description: string | null;
  servings: number;
  sellingPrice: number;
  imageUrl: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  recipeIngredients?: RecipeIngredient[];
  extraCosts?: ExtraCost[];
}

/** Standard result envelope every Server Action returns (TRD §60). */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
