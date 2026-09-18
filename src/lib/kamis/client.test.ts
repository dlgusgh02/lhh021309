import { describe, expect, it } from "vitest";
import { parseKiloUnit, pickReferencePrice, type OdcloudMarketPriceRow } from "@/lib/kamis/client";

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

describe("pickReferencePrice (kg mode, no unit given)", () => {
  it("returns null for an empty row list", () => {
    expect(pickReferencePrice([])).toBeNull();
  });

  it("converts a single matching row to a per-kg price", () => {
    const result = pickReferencePrice([row({ 단위: "10키로망대", 평균가격: 15000 })]);
    expect(result).toEqual({ price: 1500, unit: "kg", asOf: "2026-09-01" });
  });

  it("prefers the 가락 market over other markets", () => {
    const result = pickReferencePrice([
      row({ 시장명: "부산", 단위: "1키로", 평균가격: 5000 }),
      row({ 시장명: "가락", 단위: "1키로", 평균가격: 1000 }),
    ]);
    expect(result?.price).toBe(1000);
  });

  it("prefers 중 grade over 상/특/하", () => {
    const result = pickReferencePrice([
      row({ 등급: "특", 단위: "1키로", 평균가격: 3000 }),
      row({ 등급: "중", 단위: "1키로", 평균가격: 1000 }),
    ]);
    expect(result?.price).toBe(1000);
  });

  it("skips rows with a non-weight unit even if otherwise a better match", () => {
    const result = pickReferencePrice([
      row({ 단위: "50개", 평균가격: 999999 }),
      row({ 단위: "2키로", 평균가격: 4000 }),
    ]);
    expect(result?.price).toBe(2000);
  });

  it("skips rows with a zero or negative price", () => {
    const result = pickReferencePrice([
      row({ 일자: "2026-09-02", 평균가격: 0 }),
      row({ 일자: "2026-09-01", 평균가격: 1000 }),
    ]);
    expect(result?.asOf).toBe("2026-09-01");
  });

  it("picks the most recent date among otherwise-equal candidates", () => {
    const result = pickReferencePrice([
      row({ 일자: "2026-08-01", 평균가격: 1000 }),
      row({ 일자: "2026-09-01", 평균가격: 2000 }),
      row({ 일자: "2026-07-01", 평균가격: 500 }),
    ]);
    expect(result).toEqual({ price: 2000, unit: "kg", asOf: "2026-09-01" });
  });

  it("returns null when no row satisfies market/grade/unit/price constraints together", () => {
    const result = pickReferencePrice([
      row({ 시장명: "부산", 등급: "중", 단위: "1키로" }),
      row({ 시장명: "가락", 등급: "상", 단위: "1키로" }),
      row({ 시장명: "가락", 등급: "중", 단위: "50개" }),
      row({ 시장명: "가락", 등급: "중", 단위: "1키로", 평균가격: 0 }),
    ]);
    expect(result).toBeNull();
  });
});

describe("pickReferencePrice (exact-unit mode, e.g. count/bundle items)", () => {
  it("matches the exact unit string and returns the price unconverted", () => {
    const result = pickReferencePrice([row({ 단위: "50개", 평균가격: 18432 })], "50개");
    expect(result).toEqual({ price: 18432, unit: "50개", asOf: "2026-09-01" });
  });

  it("ignores rows with a different unit even if otherwise matching", () => {
    const result = pickReferencePrice(
      [row({ 단위: "100개", 평균가격: 1 }), row({ 단위: "50개", 평균가격: 18432 })],
      "50개",
    );
    expect(result?.price).toBe(18432);
  });

  it("returns null when the requested unit has no matching row", () => {
    const result = pickReferencePrice([row({ 단위: "1키로", 평균가격: 1000 })], "100속");
    expect(result).toBeNull();
  });

  it("still applies market/grade/price filters in exact-unit mode", () => {
    const result = pickReferencePrice(
      [
        row({ 시장명: "부산", 단위: "100속", 평균가격: 99999 }),
        row({ 등급: "상", 단위: "100속", 평균가격: 88888 }),
        row({ 단위: "100속", 평균가격: 0 }),
        row({ 일자: "2026-09-02", 단위: "100속", 평균가격: 27526 }),
      ],
      "100속",
    );
    expect(result).toEqual({ price: 27526, unit: "100속", asOf: "2026-09-02" });
  });
});
