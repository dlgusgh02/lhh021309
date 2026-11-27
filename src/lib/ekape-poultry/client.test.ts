import { describe, expect, it } from "vitest";
import { pickEggReferencePrice, type EkapePoultryEggRow } from "@/lib/ekape-poultry/client";

function row(overrides: Partial<EkapePoultryEggRow> = {}): EkapePoultryEggRow {
  return {
    modYmd: "20261127",
    typeName: "도매",
    verybig: 5595,
    special: 5474,
    big: 5204,
    medium: 4679,
    small: 0,
    ...overrides,
  };
}

describe("pickEggReferencePrice", () => {
  it("returns null for an empty row list", () => {
    expect(pickEggReferencePrice([])).toBeNull();
  });

  it("converts 중란 원/30개 to 원/kg using the 48g medium-egg assumption (30 * 0.048kg = 1.44kg)", () => {
    const result = pickEggReferencePrice([row({ medium: 4679 })]);
    expect(result).toEqual({ pricePerKg: Math.round(4679 / 1.44), asOf: "20261127" });
  });

  it("excludes 산지 (farm-gate) rows, only pricing off 도매 (wholesale)", () => {
    const result = pickEggReferencePrice([row({ typeName: "산지", medium: 999999 }), row({ typeName: "도매", medium: 4679 })]);
    expect(result?.pricePerKg).toBe(Math.round(4679 / 1.44));
  });

  it("picks the most recent date", () => {
    const result = pickEggReferencePrice([row({ modYmd: "20261120", medium: 1000 }), row({ modYmd: "20261127", medium: 4679 })]);
    expect(result?.asOf).toBe("20261127");
  });

  it("excludes a zero medium price row", () => {
    const result = pickEggReferencePrice([row({ medium: 0 })]);
    expect(result).toBeNull();
  });
});
