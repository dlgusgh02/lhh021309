/**
 * Ingredient-level cost calculations (TRD §7, §20, PRD §6, §11).
 *
 * All amounts are plain numbers (KRW is integer-denominated, but intermediate
 * unit-cost math is kept as float and only rounded at the final display step
 * — see TRD §69).
 */
import { convertUnit } from "@/lib/units/conversions";

export class InvalidQuantityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidQuantityError";
  }
}

/**
 * Unit cost = purchase price / purchase quantity.
 * e.g. 18,000원 / 1000g = 18원/g
 */
export function calculateUnitCost(purchasePrice: number, purchaseQuantity: number): number {
  if (purchasePrice < 0) {
    throw new InvalidQuantityError("구매 가격은 0 이상이어야 합니다.");
  }
  if (!(purchaseQuantity > 0)) {
    throw new InvalidQuantityError("구매량은 0보다 커야 합니다.");
  }
  return purchasePrice / purchaseQuantity;
}

/**
 * Effective unit cost accounts for yield/loss rate (TRD §20, PRD §11).
 * A yieldRate of 85 means only 85% of the purchased quantity is usable.
 *
 * effective unit cost = purchase price / (purchase quantity * yieldRate/100)
 */
export function calculateEffectiveUnitCost(
  purchasePrice: number,
  purchaseQuantity: number,
  yieldRate = 100,
): number {
  if (!(yieldRate > 0) || yieldRate > 100) {
    throw new InvalidQuantityError("손실률(수율)은 0% 초과 100% 이하여야 합니다.");
  }
  const usableQuantity = purchaseQuantity * (yieldRate / 100);
  return calculateUnitCost(purchasePrice, usableQuantity);
}

/**
 * Cost of using `usageQuantity` of an ingredient, given its unit cost.
 * usage cost = unit cost * usage quantity
 */
export function calculateIngredientCost(unitCost: number, usageQuantity: number): number {
  if (unitCost < 0) {
    throw new InvalidQuantityError("단위 원가는 0 이상이어야 합니다.");
  }
  if (!(usageQuantity > 0)) {
    throw new InvalidQuantityError("사용량은 0보다 커야 합니다.");
  }
  return unitCost * usageQuantity;
}

export interface IngredientPurchaseInfo {
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: string;
  yieldRate?: number;
}

/**
 * Given how an ingredient was purchased and how much of it a recipe uses
 * (in a possibly different but compatible unit), returns the cost of that
 * usage. This is the function recipe-cost calculation calls per line item.
 */
export function calculateUsageCostFromPurchase(
  purchase: IngredientPurchaseInfo,
  usageQuantity: number,
  usageUnit: string,
): number {
  const effectiveUnitCost = calculateEffectiveUnitCost(
    purchase.purchasePrice,
    purchase.purchaseQuantity,
    purchase.yieldRate ?? 100,
  );

  // Normalize the usage quantity into the ingredient's purchase unit so the
  // unit cost (which is per purchase unit) applies directly.
  const usageInPurchaseUnit =
    usageUnit === purchase.purchaseUnit
      ? usageQuantity
      : convertUnit(usageQuantity, usageUnit, purchase.purchaseUnit);

  return calculateIngredientCost(effectiveUnitCost, usageInPurchaseUnit);
}
