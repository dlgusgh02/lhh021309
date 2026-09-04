/**
 * Hand-written types mirroring `supabase/schema.sql`.
 *
 * Once the Supabase project is connected, these can be replaced with
 * generated types (`supabase gen types typescript`), but the shape must stay
 * compatible with what Server Actions and components import from here.
 *
 * Each `Insert`/`Update` type is written as a plain object type (not a
 * `Partial<Row> & {...}` intersection) — @supabase/postgrest-js's generic
 * inference for `.insert()`/`.update()` fails to resolve through an
 * intersection type here and silently collapses to `never`. Every table also
 * needs a `Relationships` field (even if empty) and the schema needs
 * `Views`/`Functions` for the `GenericSchema` constraint to be satisfied.
 *
 * Every `Row`/`Insert`/`Update` referenced inside `Database.public.Tables`
 * below is also wrapped in `Prettify<...>`. Referencing a separately-declared
 * named `interface` directly (e.g. `Row: IngredientRow`) makes
 * `SupabaseClient<Database>`'s defaulted generics silently collapse to
 * `never` for every table — a reproducible quirk of how TS resolves this
 * library's chain of dependent conditional-type defaults. Wrapping the
 * reference in a mapped type forces it to flatten into a fresh anonymous
 * object type, which resolves correctly. Confirmed by bisection against
 * @supabase/postgrest-js 2.112.4 + TypeScript 5.9.3 — re-check this note if
 * upgrading either package ever lets the plain reference work again.
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  display_name?: string | null;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  email?: string;
  display_name?: string | null;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoreRow {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface StoreInsert {
  id?: string;
  user_id: string;
  name: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoreUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IngredientRow {
  id: string;
  store_id: string;
  name: string;
  category: string;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string;
  base_unit: string;
  yield_rate: number;
  supplier: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngredientInsert {
  id?: string;
  store_id: string;
  name: string;
  category?: string;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string;
  base_unit: string;
  yield_rate?: number;
  supplier?: string | null;
  memo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IngredientUpdate {
  id?: string;
  store_id?: string;
  name?: string;
  category?: string;
  purchase_price?: number;
  purchase_quantity?: number;
  purchase_unit?: string;
  base_unit?: string;
  yield_rate?: number;
  supplier?: string | null;
  memo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeRow {
  id: string;
  store_id: string;
  name: string;
  category: string;
  description: string | null;
  servings: number;
  selling_price: number;
  image_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeInsert {
  id?: string;
  store_id: string;
  name: string;
  category?: string;
  description?: string | null;
  servings?: number;
  selling_price?: number;
  image_url?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeUpdate {
  id?: string;
  store_id?: string;
  name?: string;
  category?: string;
  description?: string | null;
  servings?: number;
  selling_price?: number;
  image_url?: string | null;
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeIngredientRow {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface RecipeIngredientInsert {
  id?: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  created_at?: string;
}

export interface RecipeIngredientUpdate {
  id?: string;
  recipe_id?: string;
  ingredient_id?: string;
  quantity?: number;
  unit?: string;
  created_at?: string;
}

export interface ExtraCostRow {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  cost_type: string;
  created_at: string;
}

export interface ExtraCostInsert {
  id?: string;
  recipe_id: string;
  name: string;
  amount: number;
  cost_type?: string;
  created_at?: string;
}

export interface ExtraCostUpdate {
  id?: string;
  recipe_id?: string;
  name?: string;
  amount?: number;
  cost_type?: string;
  created_at?: string;
}

export interface IngredientPriceHistoryRow {
  id: string;
  ingredient_id: string;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string;
  recorded_at: string;
}

export interface IngredientPriceHistoryInsert {
  id?: string;
  ingredient_id: string;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string;
  recorded_at?: string;
}

export interface IngredientPriceHistoryUpdate {
  id?: string;
  ingredient_id?: string;
  purchase_price?: number;
  purchase_quantity?: number;
  purchase_unit?: string;
  recorded_at?: string;
}

export interface MasterIngredientRow {
  id: string;
  name: string;
  category: string;
  reference_unit: string;
  kamis_item_code: string | null;
  kamis_kind_code: string | null;
  kamis_category_code: string | null;
  reference_price: number | null;
  price_updated_at: string | null;
  created_at: string;
}

export interface MasterIngredientInsert {
  id?: string;
  name: string;
  category?: string;
  reference_unit: string;
  kamis_item_code?: string | null;
  kamis_kind_code?: string | null;
  kamis_category_code?: string | null;
  reference_price?: number | null;
  price_updated_at?: string | null;
  created_at?: string;
}

export interface MasterIngredientUpdate {
  id?: string;
  name?: string;
  category?: string;
  reference_unit?: string;
  kamis_item_code?: string | null;
  kamis_kind_code?: string | null;
  kamis_category_code?: string | null;
  reference_price?: number | null;
  price_updated_at?: string | null;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Prettify<ProfileRow>;
        Insert: Prettify<ProfileInsert>;
        Update: Prettify<ProfileUpdate>;
        Relationships: [];
      };
      stores: {
        Row: Prettify<StoreRow>;
        Insert: Prettify<StoreInsert>;
        Update: Prettify<StoreUpdate>;
        Relationships: [];
      };
      ingredients: {
        Row: Prettify<IngredientRow>;
        Insert: Prettify<IngredientInsert>;
        Update: Prettify<IngredientUpdate>;
        Relationships: [];
      };
      recipes: {
        Row: Prettify<RecipeRow>;
        Insert: Prettify<RecipeInsert>;
        Update: Prettify<RecipeUpdate>;
        Relationships: [];
      };
      recipe_ingredients: {
        Row: Prettify<RecipeIngredientRow>;
        Insert: Prettify<RecipeIngredientInsert>;
        Update: Prettify<RecipeIngredientUpdate>;
        Relationships: [];
      };
      extra_costs: {
        Row: Prettify<ExtraCostRow>;
        Insert: Prettify<ExtraCostInsert>;
        Update: Prettify<ExtraCostUpdate>;
        Relationships: [];
      };
      ingredient_price_history: {
        Row: Prettify<IngredientPriceHistoryRow>;
        Insert: Prettify<IngredientPriceHistoryInsert>;
        Update: Prettify<IngredientPriceHistoryUpdate>;
        Relationships: [];
      };
      master_ingredients: {
        Row: Prettify<MasterIngredientRow>;
        Insert: Prettify<MasterIngredientInsert>;
        Update: Prettify<MasterIngredientUpdate>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
