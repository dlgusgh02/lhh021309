"use client";

import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import type { Ingredient } from "@/types";

interface IngredientComboboxProps {
  ingredients: Ingredient[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

/**
 * Searchable ingredient picker (TRD §85 sizes stores for 50-500 ingredients —
 * a plain <Select> dropdown doesn't scale to that, so this filters as you type).
 */
export function IngredientCombobox({ ingredients, value, onChange, placeholder = "식재료 검색" }: IngredientComboboxProps) {
  const selected = ingredients.find((ingredient) => ingredient.id === value) ?? null;

  return (
    <Combobox
      items={ingredients}
      value={selected}
      onValueChange={(ingredient) => onChange(ingredient ? (ingredient as Ingredient).id : "")}
      itemToStringLabel={(ingredient: Ingredient) => ingredient.name}
      isItemEqualToValue={(a: Ingredient, b: Ingredient) => a.id === b.id}
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>일치하는 식재료가 없습니다.</ComboboxEmpty>
        <ComboboxList>
          {(ingredient: Ingredient) => <ComboboxItem key={ingredient.id} value={ingredient}>{ingredient.name}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
