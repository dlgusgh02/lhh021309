import { describe, expect, it } from "vitest";
import {
  calculateEffectiveUnitCost,
  calculateIngredientCost,
  calculateUnitCost,
  calculateUsageCostFromPurchase,
  InvalidQuantityError,
} from "@/lib/calculations/ingredient";
import { IncompatibleUnitError } from "@/lib/units/conversions";

describe("calculateUnitCost", () => {
  it("computes 돼지고기 18,000원/1000g = 18원/g", () => {
    expect(calculateUnitCost(18000, 1000)).toBe(18);
  });

  it("throws when purchase quantity is 0", () => {
    expect(() => calculateUnitCost(18000, 0)).toThrow(InvalidQuantityError);
  });

  it("throws when purchase quantity is negative", () => {
    expect(() => calculateUnitCost(18000, -1)).toThrow(InvalidQuantityError);
  });

  it("throws when purchase price is negative", () => {
    expect(() => calculateUnitCost(-1, 1000)).toThrow(InvalidQuantityError);
  });

  it("allows a purchase price of 0 (free/sample ingredient)", () => {
    expect(calculateUnitCost(0, 1000)).toBe(0);
  });
});

describe("calculateEffectiveUnitCost (yield rate)", () => {
  it("raises effective cost when yield rate is below 100%", () => {
    // 감자 1kg 구매, 손질 후 850g 실사용 -> 수율 85%
    const effective = calculateEffectiveUnitCost(1000, 1000, 85);
    expect(effective).toBeCloseTo(1000 / 850);
  });

  it("matches plain unit cost when yield rate is 100%", () => {
    expect(calculateEffectiveUnitCost(18000, 1000, 100)).toBe(18);
  });

  it("defaults to 100% yield when omitted", () => {
    expect(calculateEffectiveUnitCost(18000, 1000)).toBe(18);
  });

  it("throws for yield rate of 0", () => {
    expect(() => calculateEffectiveUnitCost(1000, 1000, 0)).toThrow(InvalidQuantityError);
  });

  it("throws for yield rate above 100", () => {
    expect(() => calculateEffectiveUnitCost(1000, 1000, 101)).toThrow(InvalidQuantityError);
  });
});

describe("calculateIngredientCost", () => {
  it("computes 18원/g * 180g = 3,240원", () => {
    expect(calculateIngredientCost(18, 180)).toBe(3240);
  });

  it("throws when usage quantity is 0", () => {
    expect(() => calculateIngredientCost(18, 0)).toThrow(InvalidQuantityError);
  });

  it("throws when usage quantity is negative", () => {
    expect(() => calculateIngredientCost(18, -5)).toThrow(InvalidQuantityError);
  });
});

describe("calculateUsageCostFromPurchase", () => {
  it("computes cost when usage unit matches purchase unit", () => {
    const cost = calculateUsageCostFromPurchase(
      { purchasePrice: 18000, purchaseQuantity: 1, purchaseUnit: "kg" },
      0.6,
      "kg",
    );
    expect(cost).toBe(10800);
  });

  it("converts usage unit into purchase unit before pricing (600g against a kg purchase)", () => {
    const cost = calculateUsageCostFromPurchase(
      { purchasePrice: 18000, purchaseQuantity: 1, purchaseUnit: "kg" },
      600,
      "g",
    );
    expect(cost).toBe(10800);
  });

  it("applies yield rate on top of unit conversion", () => {
    const cost = calculateUsageCostFromPurchase(
      { purchasePrice: 1000, purchaseQuantity: 1, purchaseUnit: "kg", yieldRate: 85 },
      850,
      "g",
    );
    // effective unit cost = 1000 / 850g ; usage 850g -> cost = 1000
    expect(cost).toBeCloseTo(1000);
  });

  it("throws when usage unit is incompatible with purchase unit (ml usage against a kg purchase)", () => {
    expect(() =>
      calculateUsageCostFromPurchase(
        { purchasePrice: 15000, purchaseQuantity: 1, purchaseUnit: "kg" },
        30,
        "ml",
      ),
    ).toThrow(IncompatibleUnitError);
  });

  it("computes olive oil example: 15,000원/1L, 30ml 사용 -> 450원", () => {
    const cost = calculateUsageCostFromPurchase(
      { purchasePrice: 15000, purchaseQuantity: 1, purchaseUnit: "l" },
      30,
      "ml",
    );
    expect(cost).toBe(450);
  });
});
