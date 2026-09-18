import { describe, expect, it } from "vitest";
import { parseKiloUnit, pickReferencePricePerKg, type OdcloudMarketPriceRow } from "@/lib/kamis/client";

function row(overrides: Partial<OdcloudMarketPriceRow> = {}): OdcloudMarketPriceRow {
  return {
    일자: "2026-09-01",
    시장명: "가락",
    품목: "양파",
    단위: "1키로",
    등급: "중",
    평균가격: 1000,
    전일평균가격: 0,
    전년가격: 900,
    ...overrides,
  };
}

describe("parseKiloUnit", () => {
  it("parses a bare kilo unit", () => {
    expect(parseKiloUnit("1키로")).toBe(1);
  });

  it("parses a multi-kilo bagged unit", () => {
    expect(parseKiloUnit("10키로망대")).toBe(10);
  });

  it("parses a boxed kilo unit", () => {
    expect(parseKiloUnit("5키로상자")).toBe(5);
  });

  it("returns null for a count-based unit that isn't weight-based", () => {
    expect(parseKiloUnit("50개")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseKiloUnit("")).toBeNull();
  });
});

describe("pickReferencePricePerKg", () => {
  it("returns null for an empty row list", () => {
    expect(pickReferencePricePerKg([])).toBeNull();
  });

  it("converts a single matching row to a per-kg price", () => {
    const result = pickReferencePricePerKg([row({ 단위: "10키로망대", 평균가격: 15000 })]);
    expect(result).toEqual({ pricePerKg: 1500, asOf: "2026-09-01" });
  });

  it("prefers the 가락 market over other markets", () => {
    const result = pickReferencePricePerKg([
      row({ 시장명: "부산", 단위: "1키로", 평균가격: 5000 }),
      row({ 시장명: "가락", 단위: "1키로", 평균가격: 1000 }),
    ]);
    expect(result?.pricePerKg).toBe(1000);
  });

  it("prefers 중 grade over 상/특/하", () => {
    const result = pickReferencePricePerKg([
      row({ 등급: "특", 단위: "1키로", 평균가격: 3000 }),
      row({ 등급: "중", 단위: "1키로", 평균가격: 1000 }),
    ]);
    expect(result?.pricePerKg).toBe(1000);
  });

  it("skips rows with a non-weight unit even if otherwise a better match", () => {
    const result = pickReferencePricePerKg([
      row({ 단위: "50개", 평균가격: 999999 }),
      row({ 단위: "2키로", 평균가격: 4000 }),
    ]);
    expect(result?.pricePerKg).toBe(2000);
  });

  it("skips rows with a zero or negative price", () => {
    const result = pickReferencePricePerKg([
      row({ 일자: "2026-09-02", 평균가격: 0 }),
      row({ 일자: "2026-09-01", 평균가격: 1000 }),
    ]);
    expect(result?.asOf).toBe("2026-09-01");
  });

  it("picks the most recent date among otherwise-equal candidates", () => {
    const result = pickReferencePricePerKg([
      row({ 일자: "2026-08-01", 평균가격: 1000 }),
      row({ 일자: "2026-09-01", 평균가격: 2000 }),
      row({ 일자: "2026-07-01", 평균가격: 500 }),
    ]);
    expect(result).toEqual({ pricePerKg: 2000, asOf: "2026-09-01" });
  });

  it("returns null when no row satisfies market/grade/unit/price constraints together", () => {
    const result = pickReferencePricePerKg([
      row({ 시장명: "부산", 등급: "중", 단위: "1키로" }),
      row({ 시장명: "가락", 등급: "상", 단위: "1키로" }),
      row({ 시장명: "가락", 등급: "중", 단위: "50개" }),
      row({ 시장명: "가락", 등급: "중", 단위: "1키로", 평균가격: 0 }),
    ]);
    expect(result).toBeNull();
  });
});
